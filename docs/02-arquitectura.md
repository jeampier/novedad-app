# Arquitectura

## Stack tecnológico

| Capa | Tecnología | Versión | Deploy |
|------|-----------|---------|--------|
| Frontend | React + Vite + Tailwind CSS v4 | React 18 | Vercel |
| Backend | Node.js + Express | Express 4 | Render |
| Base de datos | PostgreSQL | 18.x | Neon (prod) / local (dev) |
| Auth | JWT + bcryptjs | — | — |
| Fórmulas dinámicas | mathjs | 15.x | — |
| Importación Excel | exceljs | 4.x | — |

---

## Estructura de carpetas

```
novedad-app/
├── backend/
│   ├── src/
│   │   ├── index.js                  ← Entry point Express, registra todas las rutas
│   │   ├── commands/
│   │   │   ├── commandBus.js         ← register() + dispatch()
│   │   │   └── index.js              ← Registra todos los comandos
│   │   ├── core/
│   │   │   └── payroll-engine/       ← Motor de nómina (ver doc 06)
│   │   ├── db/
│   │   │   ├── client.js             ← Pool PostgreSQL + query()
│   │   │   ├── migrate*.js           ← Scripts de migración por módulo
│   │   │   └── seed*.js              ← Datos iniciales
│   │   ├── handlers/                 ← Lógica de negocio para comandos
│   │   ├── middleware/
│   │   │   ├── auth.js               ← requireAuth, requireRole
│   │   │   └── auditLog.js           ← Registro de operaciones
│   │   ├── repositories/             ← Acceso a datos (SQL puro)
│   │   ├── routes/                   ← Rutas HTTP REST
│   │   └── services/                 ← Servicios reutilizables
│   ├── .env                          ← Variables de entorno (no en git)
│   ├── package.json
│   └── render.yaml                   ← Configuración de deploy en Render
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js             ← Axios base + interceptores + dispatch()
│   │   │   └── payroll.js            ← Todas las llamadas a la API
│   │   ├── components/
│   │   │   ├── Layout.jsx            ← Sidebar + navegación principal
│   │   │   └── EmployeeSelect.jsx    ← Dropdown reutilizable de empleados
│   │   ├── context/
│   │   │   └── AuthContext.jsx       ← Estado de autenticación global
│   │   ├── hooks/
│   │   │   └── useCommand.js         ← Hook para ejecutar comandos CQRS
│   │   ├── pages/                    ← Una carpeta por módulo
│   │   └── App.jsx                   ← Router principal con rutas privadas
│   ├── .env                          ← VITE_API_URL
│   └── package.json
│
└── docs/                             ← Esta documentación
```

---

## Patrones de diseño

### 1. Command Bus (solo mutaciones)

Las operaciones que **modifican datos** siguen el patrón Command Bus:

```
Frontend                    Backend
  │                            │
  ├─ POST /api/commands ──────►│
  │  { command, payload }      ├─ commandBus.dispatch(name, payload, ctx)
  │                            ├─ handler.execute(payload, ctx)
  │                            └─ → resultado
```

Comandos registrados:

| Comando | Handler | Descripción |
|---------|---------|-------------|
| `RegisterAbsence` | absenceHandler | Registra una ausencia |
| `RegisterAccident` | accidentHandler | Registra un accidente |
| `ChangeShift` | shiftHandler | Cambia el turno de un empleado |
| `OnboardEmployee` | employeeHandler | Da de alta un empleado |
| `OffboardEmployee` | employeeHandler | Da de baja un empleado |

Las **consultas** (GET) van directo por rutas REST, sin pasar por el command bus.

---

### 2. Repository Pattern

Cada entidad tiene su repositorio con SQL puro y parámetros posicionales (`$1`, `$2`):

```javascript
// Ejemplo: absenceTypeRepo.js
async findAll()     → SELECT * FROM absence_types ORDER BY active DESC, name
async findActive()  → SELECT * WHERE active = true
async create(d)     → INSERT ... RETURNING *
async update(id, d) → UPDATE ... WHERE id = $1 RETURNING *
async remove(id)    → DELETE WHERE id = $1
```

No hay ORM. El cliente de DB devuelve filas en `result.rows`.

---

### 3. Pipeline (Motor de nómina)

El cálculo de nómina sigue un pipeline de 8 pasos secuenciales. Cada paso recibe y devuelve un objeto `context`:

```
loadSettings → loadEmployees → loadSchedules → loadNovelties
     → applyConcepts → applyRules → calculateTotals → persistPayroll
```

Ver [Motor de nómina](./06-motor-nomina.md) para el detalle completo.

---

## Flujo de autenticación

```
1. POST /api/auth/login { email, password }
2. Backend verifica password con bcrypt → genera JWT (payload: id, email, role, roles)
3. Frontend guarda token en localStorage
4. Axios interceptor agrega "Authorization: Bearer <token>" a cada request
5. requireAuth middleware valida el token en cada ruta protegida
6. req.user = { id, email, role, roles } disponible en todos los handlers
```

---

## Variables de entorno

### Backend (`.env`)
```
PORT=3001
DATABASE_URL=postgresql://user:pass@host/db
JWT_SECRET=...
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### Frontend (`.env`)
```
VITE_API_URL=http://localhost:3001/api
```

En producción `VITE_API_URL` apunta a la URL de Render.

---

## Flujo de datos general

```
Usuario (browser)
    │
    ▼
React (Vercel)
    │  axios + JWT
    ▼
Express API (Render)
    │  requireAuth middleware
    │  → ruta GET  → repository → PostgreSQL (Neon)
    │  → ruta POST → commandBus → handler → repository → PostgreSQL (Neon)
    ▼
PostgreSQL (Neon en prod / local en dev)
```
