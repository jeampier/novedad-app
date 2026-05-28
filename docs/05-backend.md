# Backend

Express 4 + Node.js. Entry point: `backend/src/index.js`.

---

## Rutas registradas

```javascript
// Públicas
POST   /api/auth/login

// Comandos CQRS (mutaciones)
POST   /api/commands

// Empleados
GET    /api/employees
GET    /api/employees/:id
GET    /api/employees/:id/history      → historial de nómina del empleado
POST   /api/employees                  → OnboardEmployee
PUT    /api/employees/:id              → (directo, no usa command bus)
PATCH  /api/employees/:id/status

// Contratos
GET    /api/contracts                  → todos los contratos con nombre de empleado
GET    /api/contracts/employee/:id     → contratos de un empleado
GET    /api/contracts/:id              → un contrato por ID
POST   /api/commands { CreateContract }
POST   /api/commands { UpdateContractStatus }

// Solicitudes
GET    /api/requests
POST   /api/commands { CreateRequest }
POST   /api/commands { ApproveRequest }
POST   /api/commands { RejectRequest }

// Ausencias
GET    /api/absences
POST   /api/absences                   → RegisterAbsence (vía command bus)

// Accidentes
GET    /api/accidents
POST   /api/accidents                  → RegisterAccident (vía command bus)

// Turnos
GET    /api/shifts
POST   /api/shifts                     → ChangeShift (vía command bus)

// Dashboard
GET    /api/dashboard/summary

// Nómina
GET/POST/PUT/DELETE  /api/payroll/shift-types
GET/POST             /api/payroll/schedule
POST                 /api/payroll/schedule/bulk
GET/POST/PUT/DELETE  /api/payroll/holidays
GET/POST             /api/payroll/periods
PATCH                /api/payroll/periods/:id/close
PATCH                /api/payroll/periods/:id/reopen
POST                 /api/payroll/periods/:id/import-schedule
GET                  /api/payroll/periods/:id/schedule-grid
POST                 /api/payroll/calculate             → cálculo completo con logs y advertencias
POST                 /api/payroll/calculate/dry-run     → simulación sin persistencia
GET                  /api/payroll/records
GET                  /api/payroll/records/:id
GET                  /api/payroll/records/employee/:id  → historial por empleado
GET                  /api/payroll/export
GET/PUT              /api/payroll/settings
GET/POST/PUT/DELETE  /api/payroll/concepts
GET/POST/PUT/DELETE  /api/payroll/concepts/:id/rules
GET/POST/PUT/DELETE  /api/payroll/absence-types
GET/POST/DELETE      /api/payroll/absence-code-catalog
GET/POST/PUT/DELETE  /api/payroll/rate-rules            → tasas por grupo/cargo
GET                  /api/payroll/validation-rules      → reglas de validación
POST   /api/commands { UpdateValidationRule }           → activar/desactivar regla

// Administración (requiere rol admin)
GET/POST/PUT/DELETE  /api/admin/users
GET/POST/PUT/DELETE  /api/admin/roles
GET                  /api/admin/audit
POST                 /api/admin/cleanup                 → limpieza de datos (solo con confirm='limpiar')
```

---

## Middlewares

### `requireAuth` — `src/middleware/auth.js`

Valida el JWT en el header `Authorization: Bearer <token>`. Si es válido, setea `req.user`:

```javascript
req.user = {
  id,
  email,
  role,     // rol principal
  roles,    // array de roles (para multi-rol)
}
```

Devuelve `401` si no hay token o es inválido.

### `requireRole(...roles)` — `src/middleware/auth.js`

Verifica que `req.user` tenga al menos uno de los roles requeridos. Devuelve `403` si no.

```javascript
// Uso en rutas:
router.post('/', requireRole('admin'), handler)
router.put('/:id', requireRole('admin', 'supervisor'), handler)
```

### `auditLog` — `src/middleware/auditLog.js`

Registra en `audit_log` cada comando ejecutado con su payload y el usuario que lo disparó.

---

## Command Bus

`src/commands/commandBus.js`

```javascript
const bus = {
  handlers: {},
  register(name, handler) { this.handlers[name] = handler },
  async dispatch(name, payload, ctx) {
    const handler = this.handlers[name]
    if (!handler) throw new Error(`Comando desconocido: ${name}`)
    return handler(payload, ctx)
  }
}
```

`src/commands/index.js` registra todos los comandos al iniciar:

```javascript
bus.register('RegisterAbsence',      absenceHandler.registerAbsence)
bus.register('RegisterAccident',     accidentHandler.registerAccident)
bus.register('ChangeShift',          shiftHandler.changeShift)
bus.register('OnboardEmployee',      employeeHandler.onboardEmployee)
bus.register('OffboardEmployee',     employeeHandler.offboardEmployee)
bus.register('CreateContract',       contractsHandler.createContract)
bus.register('UpdateContractStatus', contractsHandler.updateContractStatus)
bus.register('UpdateValidationRule', validationRulesHandler.updateValidationRule)
bus.register('CreateRequest',        requestHandler.createRequest)
bus.register('ApproveRequest',       requestHandler.approveRequest)
bus.register('RejectRequest',        requestHandler.rejectRequest)
// ... y demás comandos de nómina
```

La ruta `/api/commands` recibe `{ command, payload }` y hace `bus.dispatch(command, payload, { userId: req.user.id })`.

---

## Repositorios

Cada repositorio encapsula las queries SQL de una entidad. Convenciones:

- Usan `query()` de `src/db/client.js`
- Retornan `rows[0]` para registros únicos, `rows` para listas
- En caso de conflicto único (FK, UNIQUE) lanzan el error de postgres directamente para que la ruta lo interprete

### Referencia rápida

| Repositorio | Métodos principales |
|-------------|---------------------|
| `employeeRepo` | `findAll()`, `findById(id)`, `create(d)`, `update(id,d)`, `deactivate(d)`, `setStatus(id,status)` |
| `contractsRepo` | `findAll()`, `findByEmployee(empId)`, `findById(id)`, `create(d)`, `updateStatus(id,status)` |
| `absenceRepo` | `findAll()`, `create(d)` |
| `absenceTypeRepo` | `findAll()`, `findActive()`, `create(d)`, `update(id,d)`, `remove(id)` |
| `accidentRepo` | `findAll()`, `create(d)` |
| `shiftRepo` | `findAll()`, `create(d)` |
| `shiftTypeRepo` | `findAll()`, `findById(id)`, `create(d)`, `update(id,d)`, `remove(id)` |
| `workScheduleRepo` | `findByMonth(y,m)`, `upsert(d)`, `upsertBulk(entries,userId)`, `remove(id)`, `findForPeriod(start,end)` |
| `holidayRepo` | `findByYear(y)`, `create(d)`, `remove(id)` |
| `payrollPeriodRepo` | `findAll()`, `findById(id)`, `create(d)`, `close(id)`, `reopen(id)` |
| `payrollRecordRepo` | `findByPeriod(periodId)`, `findById(id)`, `findByEmployee(empId)`, `upsert(d)` |
| `conceptRepo` | `findAll()`, `findById(id)`, `create(d)`, `update(id,d)`, `remove(id)` |
| `ruleRepo` | `findByConceptId(cid)`, `create(cid,d)`, `update(cid,rid,d)`, `remove(cid,rid)` |
| `validationRulesRepo` | `findAll()`, `findActive()`, `update(id,d)` |
| `rateRulesRepo` | `findAll()`, `create(d)`, `update(id,d)`, `remove(id)` |

---

## Servicios

### `scheduleImportService.js`
Importa un archivo Excel con la programación mensual. Lee columnas de empleado y fechas, y hace `upsertBulk` en `work_schedule`. Usa `exceljs` para leer el archivo.

### `formulaEvaluator.js`
Evalúa fórmulas matemáticas de forma segura usando `mathjs`. Usado por el motor de nómina para los conceptos dinámicos.

```javascript
// API
evaluate(formula, variables)
// → { success: true, result: 75000 }
// → { success: false, error: 'Variable desconocida: xyz' }

evaluateConditions(conditions, variables)
// conditions = JsonLogic { operator: 'AND', rules: [...] }
// → true | false
```

### `payrollCalculator.js`
Orquestador del motor de nómina. Expone `calculateWithLogs(periodId, userId, options)` que crea una instancia de `PayrollEngine` y ejecuta el pipeline completo, retornando `{ savedRecords, logs, warnings }`.

---

## Respuesta de `/api/payroll/calculate`

```json
{
  "data": [...],
  "message": "Nómina calculada para 45 empleados",
  "warnings": [
    "Juan García: Sin contrato activo",
    "Pedro López: Sin programación en el período"
  ],
  "logs": [...]
}
```

Las `warnings` las genera el paso `validateEmployees` del pipeline para las reglas activas. No bloquean el cálculo.

---

## Endpoint de limpieza — `POST /api/admin/cleanup`

Diseñado para limpiar la base de datos antes de entregar el sistema al cliente.

```json
// Request
{ "confirm": "limpiar" }

// Response
{ "message": "Base de datos limpiada correctamente" }
```

Trunca todas las tablas de datos y elimina todos los usuarios excepto `admin@novedad.com`. Requiere rol `admin` y la confirmación exacta `"limpiar"`.

---

## Manejo de errores

Cada ruta captura errores y los pasa a `next(err)`. Un middleware global en `index.js` los formatea:

```javascript
app.use((err, req, res, next) => {
  const status = err.status || 500
  res.status(status).json({ error: err.message || 'Error interno' })
})
```

En los handlers, para lanzar errores con status HTTP:
```javascript
const err = new Error('Empleado no encontrado')
err.status = 404
throw err
```

---

## Cliente de base de datos

`src/db/client.js`

```javascript
const { Pool, types } = require('pg')

// Devuelve fechas DATE como string 'YYYY-MM-DD' (sin conversión de timezone)
types.setTypeParser(1082, val => val)

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

async function query(text, params) {
  return pool.query(text, params)
}

module.exports = { query, pool }
```

> El SSL se activa automáticamente con `NODE_ENV=production`. Requerido por Seenode.
