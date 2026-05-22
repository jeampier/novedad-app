# Cómo agregar un módulo nuevo

Guía paso a paso para agregar una funcionalidad nueva al sistema. El ejemplo es un módulo de **Capacitaciones** (`/capacitaciones`).

---

## Resumen del proceso

```
Backend (6 pasos)                    Frontend (4 pasos)
─────────────────                    ─────────────────
1. Migración (tabla)                 1. API client
2. Repositorio                       2. Página
3. Handler (si es comando)           3. Ruta en App.jsx
4. Registrar comando                 4. Link en Layout.jsx
5. Ruta REST
6. Registrar ruta en index.js
```

---

## Backend

### Paso 1 — Migración

Crea `backend/src/db/migrate_capacitaciones.js`:

```javascript
require('dotenv').config()
const { pool } = require('./client')

const schema = `
BEGIN;
CREATE TABLE IF NOT EXISTS capacitaciones (
  id          SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id),
  title       VARCHAR(120) NOT NULL,
  date        DATE NOT NULL,
  hours       NUMERIC(4,1),
  provider    VARCHAR(120),
  created_by  INTEGER REFERENCES users(id),
  created_at  TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_capacitaciones_employee ON capacitaciones(employee_id);
COMMIT;
`

;(async () => {
  try {
    await pool.query(schema)
    console.log('Migración capacitaciones completada')
  } catch (e) {
    console.error('Error:', e.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
})()
```

Agrega el script en `backend/package.json`:
```json
"migrate:capacitaciones": "node src/db/migrate_capacitaciones.js"
```

Ejecuta:
```bash
npm run migrate:capacitaciones
```

---

### Paso 2 — Repositorio

Crea `backend/src/repositories/capacitacionRepo.js`:

```javascript
const { query } = require('../db/client')

module.exports = {
  async findAll() {
    const { rows } = await query(`
      SELECT c.*, e.name AS employee_name
      FROM capacitaciones c
      JOIN employees e ON e.id = c.employee_id
      ORDER BY c.date DESC
    `)
    return rows
  },

  async create({ employeeId, title, date, hours, provider, createdBy }) {
    const { rows } = await query(
      `INSERT INTO capacitaciones (employee_id, title, date, hours, provider, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [employeeId, title, date, hours, provider, createdBy]
    )
    return rows[0]
  },
}
```

---

### Paso 3 — Handler (para operaciones de escritura)

Crea `backend/src/handlers/capacitacionHandler.js`:

```javascript
const repo = require('../repositories/capacitacionRepo')

async function registerCapacitacion({ employeeId, title, date, hours, provider }, ctx) {
  if (!employeeId) { const e = new Error('Empleado requerido'); e.status = 400; throw e }
  if (!title)      { const e = new Error('Título requerido');  e.status = 400; throw e }
  if (!date)       { const e = new Error('Fecha requerida');   e.status = 400; throw e }

  return repo.create({ employeeId, title, date, hours, provider, createdBy: ctx.userId })
}

module.exports = { registerCapacitacion }
```

---

### Paso 4 — Registrar el comando

En `backend/src/commands/index.js`, agrega:

```javascript
const { registerCapacitacion } = require('../handlers/capacitacionHandler')
// ...
bus.register('RegisterCapacitacion', registerCapacitacion)
```

---

### Paso 5 — Ruta REST

Crea `backend/src/routes/capacitaciones.js`:

```javascript
const router = require('express').Router()
const repo   = require('../repositories/capacitacionRepo')
const { requireAuth } = require('../middleware/auth')

router.get('/', requireAuth, async (req, res, next) => {
  try {
    res.json({ data: await repo.findAll() })
  } catch (e) { next(e) }
})

module.exports = router
```

Las operaciones de escritura van por `/api/commands` (command bus), no por esta ruta.

---

### Paso 6 — Registrar la ruta en index.js

En `backend/src/index.js`:

```javascript
const capacitacionesRouter = require('./routes/capacitaciones')
// ...
app.use('/api/capacitaciones', requireAuth, capacitacionesRouter)
```

---

## Frontend

### Paso 1 — API client

En `frontend/src/api/payroll.js`, agrega al final:

```javascript
export const capacitaciones = {
  list:   () => http.get('/capacitaciones').then(r => r.data.data),
}
```

Para la creación usa `dispatch` desde `api/client.js` vía `useCommand`.

---

### Paso 2 — Página

Crea `frontend/src/pages/capacitaciones/CapacitacionesPage.jsx`:

```jsx
import { useEffect, useState } from 'react'
import http from '../../api/client'
import { useCommand } from '../../hooks/useCommand'
import EmployeeSelect from '../../components/EmployeeSelect'

const inp = "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
const EMPTY = { employeeId: null, title: '', date: '', hours: '', provider: '' }

export default function CapacitacionesPage() {
  const [list,    setList]    = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [form,    setForm]    = useState(EMPTY)
  const [error,   setError]   = useState('')

  const { execute } = useCommand('RegisterCapacitacion')

  const load = () => {
    setLoading(true)
    http.get('/capacitaciones').then(r => setList(r.data.data || [])).finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function handleSave() {
    if (!form.employeeId) { setError('Seleccioná un empleado'); return }
    if (!form.title)      { setError('Ingresá el título'); return }
    if (!form.date)       { setError('Ingresá la fecha'); return }
    try {
      await execute(form)
      setModal(false)
      load()
    } catch (e) { setError(e.message) }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mb-1">Personal</p>
          <h1 className="text-2xl font-semibold text-gray-800">Capacitaciones</h1>
        </div>
        <button onClick={() => { setForm(EMPTY); setError(''); setModal(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium border-0 hover:opacity-90 cursor-pointer"
          style={{ background: 'linear-gradient(135deg,#02005B,#0d0080)' }}>
          + Registrar capacitación
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Cargando...</div>
        ) : list.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">No hay capacitaciones registradas</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
              <tr>
                {['Empleado', 'Título', 'Fecha', 'Horas', 'Proveedor'].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {list.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-4 font-medium text-gray-800">{c.employee_name}</td>
                  <td className="px-5 py-4 text-gray-700">{c.title}</td>
                  <td className="px-5 py-4 text-gray-500">{c.date}</td>
                  <td className="px-5 py-4 text-gray-500">{c.hours ?? '—'}</td>
                  <td className="px-5 py-4 text-gray-400">{c.provider ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 pt-5 pb-2 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-800">Registrar capacitación</h3>
              <button onClick={() => setModal(false)} className="text-gray-400 bg-transparent border-0 text-2xl cursor-pointer">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block font-medium">Empleado *</label>
                <EmployeeSelect value={form.employeeId} onChange={v => set('employeeId', v)} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block font-medium">Título *</label>
                <input className={inp} value={form.title} onChange={e => set('title', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block font-medium">Fecha *</label>
                  <input type="date" className={inp} value={form.date} onChange={e => set('date', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block font-medium">Horas</label>
                  <input type="number" className={inp} value={form.hours} onChange={e => set('hours', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block font-medium">Proveedor</label>
                <input className={inp} value={form.provider} onChange={e => set('provider', e.target.value)} />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button onClick={() => setModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer">
                  Cancelar
                </button>
                <button onClick={handleSave}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold border-0 cursor-pointer"
                  style={{ background: 'linear-gradient(135deg,#02005B,#0d0080)' }}>
                  Registrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

---

### Paso 3 — Ruta en App.jsx

En `frontend/src/App.jsx`:

```jsx
import CapacitacionesPage from './pages/capacitaciones/CapacitacionesPage'
// ...
<Route path="/capacitaciones" element={
  <PrivateRoute><CapacitacionesPage /></PrivateRoute>
} />
```

---

### Paso 4 — Link en Layout.jsx

En `frontend/src/components/Layout.jsx`, dentro del array de módulos principales:

```jsx
{ path: '/capacitaciones', label: 'Capacitaciones', icon: <svg ...> }
```

---

## Checklist de verificación

Antes de hacer push, verificar que:

- [ ] La migración usa `IF NOT EXISTS` y tiene `BEGIN/COMMIT`
- [ ] El repositorio usa `$1, $2` (nunca interpola strings en el SQL)
- [ ] El handler valida los campos requeridos y lanza errores con `.status`
- [ ] El comando está registrado en `commands/index.js`
- [ ] La ruta está registrada en `index.js`
- [ ] El frontend carga dinámicamente (no hardcodea datos que vienen de la DB)
- [ ] Las mutaciones van por `useCommand` + command bus
- [ ] Las consultas van por `http.get` directo

---

## Reglas de oro del proyecto

1. **Command Bus solo para mutaciones** — crear/actualizar/borrar van por `POST /api/commands`. Las consultas van por GET directo.
2. **Sin ORM** — SQL puro con parámetros posicionales `$1, $2`.
3. **Parámetros configurables en `payroll_settings`** — nunca hardcodeados en el código.
4. **Validación en handlers** — lanza `err.status = 400/404/403` y la ruta llama `next(err)`.
5. **Repos separados** — commit siempre desde `frontend/` o `backend/`, nunca desde la raíz.
6. **Tailwind para estilos** — sin CSS custom salvo `style={}` para casos puntuales.
7. **Migrar antes de codificar** — la tabla debe existir en la DB antes de escribir el repositorio.
8. **ON DELETE SET NULL o CASCADE** — siempre definir comportamiento de FK al borrar.
