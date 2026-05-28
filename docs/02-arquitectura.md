# Arquitectura

## Stack tecnológico

| Capa | Tecnología | Versión | Deploy |
|------|-----------|---------|--------|
| Frontend | React + Vite + Tailwind CSS v4 | React 18 | Vercel |
| Backend | Node.js + Express | Express 4 | Seenode |
| Base de datos | PostgreSQL | 14+ | Seenode (prod) / local (dev) |
| Auth | JWT + bcryptjs | — | — |
| Fórmulas dinámicas | mathjs | 15.x | — |
| Importación Excel | exceljs | 4.x | — |

**URLs de producción:**
- Frontend: Vercel (auto-deploy)
- Backend: `https://novedad-api.ddns.net`
- DB: `up-de-fra1-postgresql-2.db.run-on-seenode.com:11550`

---

## Estructura de carpetas

```
novedad-app/
├── backend/
│   ├── startup.sh                ← Ejecuta migraciones y arranca el servidor (usado por Seenode)
│   ├── src/
│   │   ├── index.js              ← Entry point Express, registra todas las rutas
│   │   ├── commands/
│   │   │   ├── commandBus.js     ← register() + dispatch()
│   │   │   └── index.js          ← Registra todos los comandos
│   │   ├── core/
│   │   │   └── payroll-engine/   ← Motor de nómina (ver doc 06)
│   │   │       ├── PayrollEngine.js
│   │   │       ├── Pipeline.js
│   │   │       ├── context.js
│   │   │       ├── calculators/
│   │   │       ├── concepts/
│   │   │       └── pipeline/     ← 11 pasos del pipeline
│   │   ├── db/
│   │   │   ├── client.js         ← Pool PostgreSQL + query()
│   │   │   ├── migrate*.js       ← Scripts de migración por módulo
│   │   │   └── seed*.js          ← Datos iniciales (shift_types, validation_rules)
│   │   ├── handlers/             ← Lógica de negocio para comandos
│   │   ├── middleware/
│   │   │   ├── auth.js           ← requireAuth, requireRole
│   │   │   └── auditLog.js       ← Registro de operaciones
│   │   ├── repositories/         ← Acceso a datos (SQL puro)
│   │   └── routes/               ← Rutas HTTP REST
│   │       ├── contracts.js
│   │       ├── admin/
│   │       │   └── cleanup.js    ← Endpoint de limpieza para pre-entrega
│   │       └── payroll/
│   ├── .env                      ← Variables de entorno (no en git)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js         ← Axios base + interceptores + dispatch()
│   │   │   ├── contracts.js      ← Endpoints del módulo de contratos
│   │   │   └── payroll.js        ← Todas las llamadas a la API agrupadas por módulo
│   │   ├── components/
│   │   │   ├── Layout.jsx        ← Sidebar + navegación principal
│   │   │   └── EmployeeSelect.jsx← Dropdown reutilizable de empleados
│   │   ├── context/
│   │   │   └── AuthContext.jsx   ← Estado de autenticación global
│   │   ├── hooks/
│   │   │   └── useCommand.js     ← Hook para ejecutar comandos CQRS
│   │   ├── pages/                ← Una carpeta por módulo
│   │   │   ├── contracts/        ← Módulo de contratos
│   │   │   └── payroll/
│   │   └── App.jsx               ← Router principal con rutas privadas
│   ├── .env                      ← VITE_API_URL
│   └── package.json
│
└── docs/                         ← Esta documentación
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
| `CreateContract` | contractsHandler | Crea un contrato laboral |
| `UpdateContractStatus` | contractsHandler | Cambia el estado de un contrato |
| `UpdateValidationRule` | validationRulesHandler | Activa/desactiva una regla de validación |
| `CreateAbsenceType` | absenceTypeHandler | Crea un tipo de ausencia |
| `UpdateAbsenceType` | absenceTypeHandler | Actualiza un tipo de ausencia |
| `CreateShiftType` | shiftTypeHandler | Crea un tipo de turno |
| `CreatePeriod` | periodHandler | Crea un período de nómina |

Las **consultas** (GET) van directo por rutas REST, sin pasar por el command bus.

---

### 2. Repository Pattern

Cada entidad tiene su repositorio con SQL puro y parámetros posicionales (`$1`, `$2`):

```javascript
// Ejemplo: contractsRepo.js
async findAll()              → SELECT con JOIN a employees
async findByEmployee(empId)  → SELECT WHERE employee_id = $1
async findById(id)           → SELECT WHERE id = $1
async create(d)              → INSERT ... RETURNING *
async updateStatus(id, s)    → UPDATE SET status = $1 WHERE id = $2 RETURNING *
```

No hay ORM. El cliente de DB devuelve filas en `result.rows`.

---

### 3. Pipeline (Motor de nómina)

El cálculo de nómina sigue un pipeline de **11 pasos secuenciales**. Cada paso recibe y devuelve un objeto `context`:

```
loadSettings → loadEmployees → loadSchedules → loadNovelties → loadRateRules
     → validateEmployees → applyConcepts → applyRules
     → calculateTotals → persistPayroll → liquidateRequests
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

> En producción `NODE_ENV=production` activa SSL (`rejectUnauthorized: false`) requerido por Seenode.

### Frontend (`.env`)
```
VITE_API_URL=http://localhost:3001/api
```

En producción `VITE_API_URL` apunta a `https://novedad-api.ddns.net/api`.

---

## Flujo de datos general

```
Usuario (browser)
    │
    ▼
React (Vercel)
    │  axios + JWT
    ▼
Express API (Seenode)
    │  requireAuth middleware
    │  → ruta GET  → repository → PostgreSQL (Seenode)
    │  → ruta POST → commandBus → handler → repository → PostgreSQL (Seenode)
    ▼
PostgreSQL (Seenode en prod / local en dev)
```

---

## startup.sh — arranque en producción

Seenode ejecuta `startup.sh` al iniciar el contenedor. El script corre todas las migraciones en orden y luego arranca el servidor:

```sh
#!/bin/bash
set -e
node src/db/migrate_admin.js
node src/db/migrate_payroll.js
node src/db/migrate_concepts.js
node src/db/migrate_employees.js
node src/db/migrate_payroll_records.js
node src/db/migrate_requests.js
node src/db/migrate_contracts.js
node src/db/migrate_absence_behavior.js
node src/db/migrate_validation_rules.js
npm start
```

Esto garantiza que cualquier migración nueva llegue a producción automáticamente en el próximo deploy.
