# Guía para crear un módulo nuevo en novedad-app

Esta guía explica paso a paso cómo agregar un módulo completo al sistema,
con la explicación de qué hace cada archivo, cada función y cada patrón.
Está basada en el desarrollo real del módulo de Contratos.

---

## ¿Cómo funciona el sistema?

Antes de escribir código, es importante entender el flujo completo:

```
FRONTEND                          BACKEND
─────────────────────────────     ─────────────────────────────
NombrePage.jsx                    src/routes/nombre.js
  │                                 │
  ├─ GET → api/nombre.js            ├─ GET /api/nombre → repo.findAll()
  │         http.get('/nombre')     │
  │                                 │
  └─ Mutación → api/nombre.js       └─ POST /api/commands
            dispatch('CreateX')           → commandBus
                                              → handler
                                                  → repo.create()
```

**Regla de oro:**
- Las **consultas** (leer datos) → `GET` directo a la ruta
- Las **mutaciones** (crear, actualizar, borrar) → pasan por el **command bus** (`POST /api/commands`)

---

## Archivos que componen un módulo

```
BACKEND (6 archivos)                    FRONTEND (4 archivos)
─────────────────────────────────       ─────────────────────────────────
src/db/migrate_nombre.js                src/api/nombre.js
src/repositories/nombreRepo.js          src/pages/nombre/NombrePage.jsx
src/handlers/nombreHandler.js           src/App.jsx          ← modificar
src/commands/index.js  ← modificar      src/components/Layout.jsx ← modificar
src/routes/nombre.js
src/index.js           ← modificar
```

---

## BACKEND

---

### Paso 1 — Migración `src/db/migrate_nombre.js`

**¿Qué es?**
Un script que se corre una sola vez para crear la tabla en la base de datos PostgreSQL.
Una vez corrido, no se vuelve a tocar.

**¿Por qué existe separado?**
Porque la base de datos es compartida entre desarrollo y producción. Tener el script separado
permite correrlo de forma controlada y verificar que funcionó antes de escribir el resto del código.

```javascript
require('dotenv').config()          // carga las variables de entorno (.env) — necesario para DATABASE_URL
const { pool } = require('./client') // pool es la conexión a PostgreSQL

const schema = `
CREATE TABLE IF NOT EXISTS contratos (
  id            SERIAL PRIMARY KEY,              -- ID autoincremental
  employee_id   INTEGER NOT NULL                 -- llave foránea al empleado
                  REFERENCES employees(id)
                  ON DELETE CASCADE,             -- si se borra el empleado, se borran sus contratos
  tipo          VARCHAR(50) NOT NULL,            -- campo de texto corto
  fecha_inicio  DATE NOT NULL,                   -- fecha sin hora
  fecha_fin     DATE,                            -- sin NOT NULL = opcional (puede ser NULL)
  status        VARCHAR(20) NOT NULL DEFAULT 'activo'
                  CHECK (status IN ('activo','terminado','suspendido')), -- solo estos 3 valores permitidos
  notas         TEXT,                            -- texto largo, opcional
  created_at    TIMESTAMP DEFAULT NOW()          -- se llena automáticamente
);

-- Índice: acelera las búsquedas por employee_id (se usa mucho en findByEmployee)
CREATE INDEX IF NOT EXISTS idx_contratos_employee ON contratos(employee_id);
`

pool.query(schema)
  .then(() => { console.log('migrate_contratos: OK'); process.exit(0) })
  .catch(e => { console.error(e.message); process.exit(1) })
```

**Agregar el script en `package.json`:**
```json
"migrate:nombre": "node src/db/migrate_nombre.js"
```

**Correr la migración — esto debe hacerse ANTES de continuar:**
```bash
npm run migrate:nombre
# Debe imprimir: migrate_contratos: OK
```

**En producción (Seenode):** agregar la línea al `startup.sh` en el backend:
```bash
node src/db/migrate_nombre.js
```
El `startup.sh` se ejecuta automáticamente en cada deploy, así la migración llega a prod sola.

> ⚠️ Si la tabla no existe y escribes el repo, el servidor crashea al primer request.

---

### Paso 2 — Repositorio `src/repositories/nombreRepo.js`

**¿Qué es?**
La capa que se comunica directamente con la base de datos. Contiene todas las queries SQL.
Ningún otro archivo escribe SQL — solo el repo.

**¿Por qué sin ORM?**
Este proyecto usa SQL puro a propósito: más control, sin magia oculta, más fácil de depurar.
Los parámetros van como `$1, $2, $3` (nunca interpolados en el string) para evitar SQL injection.

```javascript
const { query } = require('../db/client') // query() ejecuta SQL y devuelve { rows }

// findAll — lista todos los registros, con JOIN para traer el nombre del empleado
async function findAll() {
  const { rows } = await query(`
    SELECT n.*, e.first_name, e.last_name   -- n.* trae todas las columnas de nombre
    FROM nombre n
    JOIN employees e ON e.id = n.employee_id -- une con la tabla employees
    ORDER BY n.created_at DESC               -- más recientes primero
  `)
  return rows  // array de objetos
}

// findById — trae un registro por su ID
async function findById(id) {
  const { rows } = await query(
    `SELECT * FROM nombre WHERE id = $1`,
    [id]   // $1 se reemplaza con el valor de id — protege contra SQL injection
  )
  return rows[0] || null  // rows[0] es el primer resultado, null si no existe
}

// findByEmployee — todos los registros de un empleado específico
async function findByEmployee(employee_id) {
  const { rows } = await query(
    `SELECT * FROM nombre WHERE employee_id = $1 ORDER BY created_at DESC`,
    [employee_id]
  )
  return rows
}

// create — inserta un registro nuevo
async function create(data) {
  const { employee_id, tipo, fecha_inicio } = data  // desestructura solo lo que necesita
  const { rows } = await query(
    `INSERT INTO nombre (employee_id, tipo, fecha_inicio)
     VALUES ($1, $2, $3)
     RETURNING *`,  -- RETURNING * devuelve el registro recién creado (con su id y created_at)
    [employee_id, tipo, fecha_inicio]
  )
  return rows[0]
}

// updateStatus — actualiza solo el campo status
async function updateStatus(id, status) {
  const { rows } = await query(
    `UPDATE nombre SET status = $1 WHERE id = $2 RETURNING *`,
    [status, id]
  )
  return rows[0] || null  // null si el id no existía
}

// remove — elimina el registro (usar con cuidado)
async function remove(id) {
  await query('DELETE FROM nombre WHERE id = $1', [id])
  // no necesita RETURNING porque no devolvemos nada
}

module.exports = { findAll, findById, findByEmployee, create, updateStatus, remove }
```

---

### Paso 3 — Handler `src/handlers/nombreHandler.js`

**¿Qué es?**
El handler contiene la **lógica de negocio** de las mutaciones. Valida los datos que llegan,
aplica reglas del negocio, y llama al repo. Es el "cerebro" de cada operación.

**¿Por qué separado del repo?**
El repo solo sabe hablar con la base de datos. El handler sabe qué es válido para el negocio.
Si mañana cambian las reglas, solo se toca el handler, no el repo.

```javascript
const repo = require('../repositories/nombreRepo')

// Cada handler recibe (payload, context)
// payload: los datos enviados desde el frontend
// context: info del usuario autenticado (context.userId)

async function createNombre(payload, context) {
  const { employee_id, tipo, fecha_inicio } = payload

  // Validación: lanza error con status HTTP si faltan datos
  // El middleware de error en index.js captura esto y responde con el status correcto
  if (!employee_id || !tipo || !fecha_inicio) {
    const e = new Error('employee_id, tipo y fecha_inicio son requeridos')
    e.status = 400  // Bad Request
    throw e
  }

  // Si todo está bien, llama al repo para guardar en la BD
  return repo.create({ employee_id, tipo, fecha_inicio })
}

async function updateNombreStatus(payload, context) {
  const { id, status } = payload
  const VALID_STATUS = ['activo', 'terminado', 'suspendido']

  // Valida que el status sea uno de los permitidos
  if (!VALID_STATUS.includes(status)) {
    const e = new Error('Status inválido')
    e.status = 400
    throw e
  }

  // Verifica que el registro existe antes de actualizar
  const existe = await repo.findById(id)
  if (!existe) {
    const e = new Error('Registro no encontrado')
    e.status = 404  // Not Found
    throw e
  }

  return repo.updateStatus(id, status)
}

module.exports = { createNombre, updateNombreStatus }
```

---

### Paso 4 — Registrar en el command bus `src/commands/index.js`

**¿Qué es el command bus?**
Es un despachador central de mutaciones. El frontend envía `{ command: 'CreateNombre', payload: {...} }`
a `POST /api/commands`, y el command bus busca el handler registrado con ese nombre y lo ejecuta.

**¿Por qué este patrón?**
Centraliza toda la lógica de mutaciones en un solo endpoint. Facilita agregar auditoría,
validación de permisos y logging en un solo lugar.

```javascript
// Al final del archivo, agregar:
const { createNombre, updateNombreStatus } = require('../handlers/nombreHandler')

register('CreateNombre', createNombre)           // nombre del comando → handler que lo ejecuta
register('UpdateNombreStatus', updateNombreStatus)
```

> El nombre del comando (`'CreateNombre'`) debe coincidir exactamente con lo que
> el frontend envía en `dispatch('CreateNombre', payload)`.

---

### Paso 5 — Ruta `src/routes/nombre.js`

**¿Qué es?**
Define los endpoints GET del módulo. Solo van consultas aquí —
las mutaciones ya tienen su camino por el command bus.

**¿Por qué solo GETs?**
Porque las mutaciones van por `POST /api/commands`. Las rutas propias
solo sirven para que el frontend pueda leer datos de forma simple.

```javascript
const { Router } = require('express')
const { requireAuth } = require('../middleware/auth')  // middleware que verifica el JWT
const repo = require('../repositories/nombreRepo')

const router = Router()

// GET /api/nombre — lista todos
// requireAuth: si no hay token válido, responde 401 automáticamente
router.get('/', requireAuth, async (req, res, next) => {
  try {
    res.json(await repo.findAll())
  } catch (e) { next(e) }  // next(e) pasa el error al middleware de error global en index.js
})

// GET /api/nombre/employee/:id — contratos de un empleado
// El parámetro :employee_id se accede como req.params.employee_id
router.get('/employee/:employee_id', requireAuth, async (req, res, next) => {
  try {
    res.json(await repo.findByEmployee(req.params.employee_id))
  } catch (e) { next(e) }
})

// GET /api/nombre/:id — uno por ID
// Esta ruta debe ir DESPUÉS de /employee/:id para que Express no confunda "employee" con un id
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const row = await repo.findById(req.params.id)
    if (!row) return res.status(404).json({ error: 'No encontrado' })
    res.json(row)
  } catch (e) { next(e) }
})

module.exports = router
```

> ⚠️ El orden de las rutas importa. Siempre pon las rutas específicas
> (`/employee/:id`) antes de las genéricas (`/:id`), si no Express
> interpreta "employee" como un ID.

---

### Paso 6 — Montar en `src/index.js`

**¿Qué es?**
El archivo principal del servidor. Aquí se conectan todos los routers
con sus URLs base. Son solo dos líneas por módulo.

```javascript
// 1. Importar el router (junto a los demás imports de rutas)
const nombreRoutes = require('./routes/nombre')

// 2. Montar en la URL base (junto a los demás app.use)
app.use('/api/nombre', nombreRoutes)
// Esto hace que GET /api/nombre llame al router,
// que a su vez llama a repo.findAll()
```

---

## FRONTEND

---

### Paso 7 — API client `src/api/nombre.js`

**¿Qué es?**
El único lugar del frontend donde se sabe cómo llamar al backend.
El resto de los componentes importan estas funciones sin preocuparse por URLs.

**Regla crítica sobre las URLs:**
`VITE_API_URL` en `.env` ya vale `http://localhost:3001/api`.
Por eso las rutas en este archivo NO llevan `/api/` — si lo pones, queda duplicado
(`http://localhost:3001/api/api/nombre`) y el request falla silenciosamente.

```javascript
import http from './client'          // instancia axios con baseURL = VITE_API_URL
import { dispatch } from './client'  // función para enviar comandos al command bus

// ─── CONSULTAS (GET directo) ───────────────────────────────────────────────

// r es la respuesta de axios: r.data es el cuerpo de la respuesta HTTP
// Si el backend hace res.json(array)     → r.data es el array directamente
// Si el backend hace res.json({ data })  → r.data es { data: [...] }, necesitas r.data.data
export const list = () =>
  http.get('/nombre').then(r => r.data)

export const getByEmployee = (employeeId) =>
  http.get(`/nombre/employee/${employeeId}`).then(r => r.data)

export const getById = (id) =>
  http.get(`/nombre/${id}`).then(r => r.data)

// ─── MUTACIONES (command bus) ──────────────────────────────────────────────

// dispatch envía POST /api/commands { command: 'CreateNombre', payload }
// El backend ejecuta el handler registrado y devuelve { ok: true, data: resultado }
export const create = (payload) =>
  dispatch('CreateNombre', payload)

export const updateStatus = (id, status) =>
  dispatch('UpdateNombreStatus', { id, status })
```

> ⚠️ **Cómo detectar el error de URL duplicada:**
> Abre DevTools → Network → busca el request → si la URL dice `/api/api/nombre` está duplicada.
> Solución: quitar el `/api` de las rutas en este archivo.

> ⚠️ **Cómo detectar el error de `{ data }` vs array:**
> En DevTools → Network → Response del GET → si ves `{ "data": [...] }` en lugar de `[...]`,
> usa `r.data.data`. Puedes verificarlo también leyendo el `res.json(...)` en la ruta del backend.

---

### Paso 8 — Página `src/pages/nombre/NombrePage.jsx`

**¿Qué es?**
El componente principal de la vista. Maneja el estado de la pantalla,
carga los datos al montar, y coordina los modales.

**Dos patrones para mutaciones:**

**Opción A — `dispatch` en el api client (recomendada cuando tienes un api/nombre.js centralizado):**
```jsx
import * as nombreApi from '../../api/nombre'
// en el handler: await nombreApi.create(form)
```

**Opción B — `useCommand` directo en la página (recomendada para acciones simples tipo toggle):**
```jsx
import { useCommand } from '../../hooks/useCommand'
// ⚠️ El nombre del comando va al instanciar, no en execute()
const { execute, loading: saving } = useCommand('CreateNombre')
// en el handler: await execute(form)
```

**Estructura estándar de la página:**

```jsx
import { useEffect, useState } from 'react'
import * as nombreApi from '../../api/nombre'
import { employees as employeesApi } from '../../api/payroll' // solo si necesitas empleados

export default function NombrePage() {
  // ─── Estado ────────────────────────────────────────────────────────────
  const [items,   setItems]   = useState([])   // datos de la tabla
  const [loading, setLoading] = useState(true) // muestra "Cargando..." mientras espera
  const [showNew, setShowNew] = useState(false) // controla si el modal de crear está abierto

  // ─── Carga de datos ────────────────────────────────────────────────────
  // load() se llama al montar y después de cada mutación exitosa
  async function load() {
    setLoading(true)
    try { setItems(await nombreApi.list()) }
    catch {} // el cliente axios ya logguea el error en consola
    finally { setLoading(false) }
  }

  // useEffect con [] vacío = se ejecuta una sola vez al montar el componente
  useEffect(() => {
    load()
  }, [])

  // ─── Handlers de mutaciones ────────────────────────────────────────────
  // Después de cada mutación exitosa se llama load() para refrescar la tabla
  async function handleCreate(form) {
    await nombreApi.create(form)
    await load()
  }

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <div className="p-8">
      {/* Header con título y botón de crear */}
      {/* Tabla con los datos */}
      {/* Modal condicional — solo se renderiza si showNew es true */}
      {showNew && <NuevoModal onSave={handleCreate} onClose={() => setShowNew(false)} />}
    </div>
  )
}
```

**Estructura estándar del modal de crear:**

```jsx
function NuevoModal({ onSave, onClose }) {
  // Estado del formulario — un objeto con todos los campos
  const [form, setForm] = useState({ campo1: '', campo2: '' })
  const [saving, setSaving] = useState(false) // deshabilita el botón mientras guarda
  const [error, setError]   = useState('')    // muestra error si falla

  // set(campo, valor) actualiza un campo del formulario sin perder los demás
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    // Validar antes de enviar
    if (!form.campo1) return setError('campo1 es requerido')

    setSaving(true); setError('')
    try {
      await onSave(form)  // llama al handleCreate de la página
      onClose()           // solo cierra si fue exitoso
    } catch (e) {
      // e.response.data.error es el mensaje que lanzó el handler del backend
      setError(e.response?.data?.error || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header del modal */}
        {/* Campos del formulario */}
        {/* Botones Cancelar / Guardar */}
      </div>
    </div>
  )
}
```

**Estructura estándar del modal de cambiar estado:**

```jsx
// NEXT_STATUS define qué estados son posibles desde el estado actual
// activo puede pasar a suspendido o terminado, pero terminado no puede cambiar
const NEXT_STATUS = {
  activo:     ['suspendido', 'terminado'],
  suspendido: ['activo', 'terminado'],
  terminado:  [],  // estado final, no cambia
}

function ChangeStatusModal({ item, onConfirm, onClose }) {
  // Estado inicial = primer estado posible desde el actual
  const [status, setStatus] = useState(NEXT_STATUS[item.status][0])
  const [saving, setSaving] = useState(false)

  async function handleConfirm() {
    setSaving(true)
    try { await onConfirm(status); onClose() }
    finally { setSaving(false) }
  }

  return (
    // Radio buttons para seleccionar el nuevo estado
    // Solo muestra los estados válidos según NEXT_STATUS
    <div>
      {NEXT_STATUS[item.status].map(s => (
        <label key={s}>
          <input type="radio" value={s} checked={status === s} onChange={() => setStatus(s)} />
          {s}
        </label>
      ))}
    </div>
  )
}
```

---

### Paso 9 — Ruta en `src/App.jsx`

**¿Qué es?**
El router de React que asocia una URL con un componente.
`PrivateRoute` redirige al login si el usuario no está autenticado.

```javascript
// Import (junto a los demás imports de páginas)
import NombrePage from './pages/nombre/NombrePage'

// Ruta (dentro del bloque de <Routes>)
// El orden no afecta el funcionamiento, pero se recomienda agrupar por sección
<Route path="/nombre" element={<PrivateRoute><NombrePage /></PrivateRoute>} />
```

---

### Paso 10 — Link en `src/components/Layout.jsx`

**¿Qué es?**
El menú lateral de la aplicación. El orden del array es el orden visual en pantalla —
ponlo donde tenga sentido para el usuario.

```javascript
// Agregar en el array de navegación
{ path: '/nombre', label: 'Nombre del módulo' },
```

---

## Cómo depurar cuando algo no funciona

### El select no carga datos

1. Abre DevTools → pestaña **Network**
2. Busca el request al endpoint (ej: `contracts`)
3. Revisa la pestaña **Response** — ¿es un array `[...]` o un objeto `{ data: [...] }`?
4. Si es `{ data: [...] }`, en el API client usa `r.data.data` no `r.data`

### El request falla con error

1. Abre DevTools → pestaña **Console** — el cliente axios loguea todos los errores
2. O en **Network** → clic en el request fallido → pestaña **Response** → lee el mensaje de error

### Probar un endpoint desde la terminal

```bash
# 1. Obtener el token: en la consola del navegador ejecuta:
#    localStorage.getItem('token')

# 2. Probar el endpoint:
curl -s http://localhost:3001/api/nombre \
  -H "Authorization: Bearer TU_TOKEN_AQUI" | jq .

# Si no tienes jq instalado:
sudo dnf install jq -y
```

### El servidor crashea al arrancar

Lee el error completo en la terminal. Los más frecuentes:
- `SyntaxError: Unexpected identifier 'd'` → carácter extra en una línea (revisar el archivo mencionado)
- `relation "nombre" does not exist` → faltó correr la migración

---

## Checklist final

Antes de dar el módulo por terminado:

- [ ] `npm run migrate:nombre` → imprime `OK`
- [ ] Backend arranca sin errores (`npm run dev`)
- [ ] `GET /api/nombre` responde correctamente (verificar en Network tab)
- [ ] La página carga sin errores en consola
- [ ] El formulario de crear funciona y el registro aparece en la tabla
- [ ] Las acciones de estado funcionan
- [ ] Los filtros (si existen) filtran correctamente

---

## Tabla de errores frecuentes

| Síntoma | Causa | Solución |
|---|---|---|
| Request va a `/api/api/nombre` | Pusiste `/api/nombre` en el API client cuando `VITE_API_URL` ya incluye `/api` | Usar solo `/nombre` en `api/nombre.js` |
| Select o tabla vacía sin error visible | El endpoint devuelve `{ data: [] }` y se usa `r.data` | Cambiar a `r.data.data` |
| `SyntaxError` al arrancar el backend | Carácter extra al pegar código | Revisar la línea exacta en el editor |
| `command not found` en el command bus | Faltó registrar en `commands/index.js` | Agregar `register('NombreComando', handler)` |
| `relation does not exist` | No se corrió la migración | `npm run migrate:nombre` |
| 401 en todos los requests | Token expirado | Hacer logout y login de nuevo |
| Modal cierra pero la tabla no actualiza | Faltó llamar `load()` después de la mutación | Agregar `await load()` en el handler |
