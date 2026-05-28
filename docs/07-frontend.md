# Frontend

React 18 + Vite + Tailwind CSS v4. Single Page Application desplegada en Vercel.

---

## Estructura de archivos

```
frontend/src/
├── App.jsx                   ← Router principal
├── main.jsx                  ← Entry point React
├── api/
│   ├── client.js             ← Axios base + interceptores + dispatch()
│   ├── contracts.js          ← Endpoints del módulo de contratos
│   └── payroll.js            ← Todos los endpoints agrupados por módulo
├── components/
│   ├── Layout.jsx            ← Sidebar + navegación
│   └── EmployeeSelect.jsx    ← Dropdown reutilizable de empleados
├── context/
│   └── AuthContext.jsx       ← Estado global de autenticación
├── hooks/
│   └── useCommand.js         ← Hook para comandos CQRS
└── pages/
    ├── LoginPage.jsx
    ├── DashboardPage.jsx
    ├── employees/
    ├── absences/
    ├── accidents/
    ├── contracts/            ← Módulo de contratos
    ├── shifts/
    ├── payroll/
    └── admin/
```

---

## Rutas de la aplicación

| URL | Componente | Acceso |
|-----|-----------|--------|
| `/login` | LoginPage | Público |
| `/` | DashboardPage | Autenticado |
| `/employees` | EmployeesPage | Autenticado |
| `/contracts` | ContractsPage | Autenticado |
| `/absences` | AbsencesPage | Autenticado |
| `/accidents` | AccidentsPage | Autenticado |
| `/shifts` | ShiftsPage | Autenticado |
| `/payroll/schedule` | SchedulePage | Autenticado |
| `/payroll/shift-types` | ShiftTypesPage | Autenticado |
| `/payroll/absence-types` | AbsenceTypesPage | Autenticado |
| `/payroll/periods` | PeriodsPage | Autenticado |
| `/payroll/periods/:id/schedule` | PeriodScheduleGridPage | Autenticado |
| `/payroll/concepts` | ConceptsPage | Autenticado |
| `/payroll/records` | RecordsPage | Autenticado |
| `/payroll/settings` | PayrollSettingsPage | Autenticado |
| `/admin` | AdminPage | Solo admin |
| `/admin/users` | UsersPage | Solo admin |
| `/admin/roles` | RolesPage | Solo admin |
| `/admin/audit` | AuditPage | Solo admin |

### Guardianes de ruta

```jsx
// Requiere login
<PrivateRoute>
  <DashboardPage />
</PrivateRoute>

// Requiere rol admin
<AdminRoute>
  <UsersPage />
</AdminRoute>
```

Si no hay sesión, redirige a `/login`. Si no es admin, redirige a `/`.

---

## Cliente HTTP — `api/client.js`

```javascript
import axios from 'axios'

const http = axios.create({ baseURL: import.meta.env.VITE_API_URL })

// Agrega el token automáticamente a cada request
http.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = 'Bearer ' + token
  return cfg
})

// Función para comandos CQRS
export async function dispatch(command, payload) {
  const { data } = await http.post('/commands', { command, payload })
  return data
}

export default http
```

---

## API de contratos — `api/contracts.js`

```javascript
import http from './client'
import { dispatch } from './client'

export const contracts = {
  list:           ()         => http.get('/contracts').then(r => r.data),
  byEmployee:     (empId)    => http.get(`/contracts/employee/${empId}`).then(r => r.data),
  get:            (id)       => http.get(`/contracts/${id}`).then(r => r.data),
  create:         (d)        => dispatch('CreateContract', d),
  updateStatus:   (id, s)    => dispatch('UpdateContractStatus', { id, status: s }),
}
```

---

## API de nómina — `api/payroll.js`

Todos los endpoints del sistema agrupados por módulo:

```javascript
import { absenceTypes, validationRules, rateRules } from '../api/payroll'

// Tipos de ausencia
await absenceTypes.list()
await absenceTypes.create({ code, name, deduction_pct, behavior, active })
await absenceTypes.update(id, { name, deduction_pct, behavior, active })
await absenceTypes.remove(id)

// Reglas de validación (solo lectura — se modifican por comando)
await validationRules.list()
// → [{ id, code, name, description, active }]

// Tasas por grupo/cargo
await rateRules.list()
await rateRules.create(d)
await rateRules.update(id, d)
await rateRules.remove(id)
```

Módulos disponibles en `payroll.js`:
`dashboard`, `shiftTypes`, `schedule`, `holidays`, `periods`, `payroll`, `payrollSettings`, `absenceTypes`, `absenceCodeCatalog`, `rateRules`, `validationRules`, `employees`

### Resultado de cálculo de nómina

```javascript
const res = await payroll.calculate(periodId)
// res = {
//   data: [...],
//   message: "Nómina calculada para 45 empleados",
//   warnings: ["Juan García: Sin contrato activo"],
//   logs: [...]
// }
```

La página `PeriodsPage.jsx` muestra el resultado con panel verde para éxito y panel ámbar para las advertencias.

---

## Contexto de autenticación — `context/AuthContext.jsx`

```javascript
const { user, login, logout } = useAuth()

// user contiene:
// { id, email, full_name, role, roles }

// Verificar si es admin:
const isAdmin = user?.role === 'admin' || user?.roles?.includes('admin')
```

La sesión se persiste en `localStorage` (`token` y `user`). Al recargar la página, el contexto se inicializa desde ahí.

---

## Hook `useCommand` — `hooks/useCommand.js`

Para operaciones de escritura que van por el command bus.

> **Importante:** el nombre del comando se pasa al instanciar el hook, no en `execute`.

```javascript
// Correcto
const { execute, loading, error } = useCommand('RegisterAbsence')
await execute({ employeeId, type, startDate, endDate, reason })

// Contratos
const { execute: createContract } = useCommand('CreateContract')
await createContract({ employee_id, contract_type, start_date, base_salary })

// Reglas de validación
const { execute: toggleRule } = useCommand('UpdateValidationRule')
await toggleRule({ id: rule.id, active: !rule.active })
```

Maneja automáticamente `loading` y extrae el mensaje de error de `response.data.error`.

---

## Componente `EmployeeSelect`

Dropdown reutilizable con búsqueda en tiempo real. Úsalo en cualquier formulario que requiera seleccionar un empleado:

```jsx
import EmployeeSelect from '../../components/EmployeeSelect'

<EmployeeSelect
  value={form.employeeId}
  onChange={id => setForm(f => ({ ...f, employeeId: id }))}
/>
```

- Carga empleados activos al montar
- Filtra por nombre, documento o cargo mientras escribe
- Muestra avatar con iniciales, nombre y documento
- Botón X para limpiar

---

## Layout y navegación — `components/Layout.jsx`

El sidebar incluye todos los módulos. Tiene secciones colapsables que se abren automáticamente según la ruta activa:

- **Principal:** Dashboard, Empleados, **Contratos**, Ausencias, Accidentes, Turnos
- **Nómina** (colapsable): Programación, Tipos de turno, Tipos de ausencia, Períodos, Conceptos, Tasas grupo/cargo, Registros, Parámetros
- **Administración** (colapsable, solo admin): Usuarios, Roles, Auditoría

---

## Convenciones de UI

### Colores principales
```
Gradiente primario: linear-gradient(135deg, #02005B, #0d0080)  ← botones, sidebar
Indigo:             #4F46E5  ← acentos, links activos
Fondo de página:    bg-gray-50 (Tailwind)
Cards:              bg-white + border border-gray-100 + shadow-sm
```

### Inputs
```jsx
// Clase estándar para inputs de texto
const inp = "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
```

### Modales
```jsx
// Estructura estándar
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
    {/* header con título y botón × */}
    {/* body con formulario */}
    {/* footer con botones Cancelar / Guardar */}
  </div>
</div>
```

### Mensajes de resultado del cálculo de nómina
```jsx
// Éxito sin advertencias
<div className="bg-emerald-50 border border-emerald-200 text-emerald-700">
  {calcResult.message}
</div>

// Advertencias (ámbar) — se muestran junto al mensaje de éxito
{calcResult.warnings?.length > 0 && (
  <div className="bg-amber-50 border border-amber-200 text-amber-700">
    <p>Advertencias ({calcResult.warnings.length})</p>
    <ul>
      {calcResult.warnings.map((w, i) => <li key={i}>• {w}</li>)}
    </ul>
  </div>
)}
```

### Iconos
SVG inline con `stroke` (sin fill). `viewBox="0 0 24 24"`, `strokeWidth="1.8"`, `strokeLinecap="round"`, `strokeLinejoin="round"`.

---

## Patrón de una página típica

```jsx
export default function MiModuloPage() {
  // 1. Estado
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')

  // 2. Hook de comando (para mutaciones) — nombre al instanciar
  const { execute } = useCommand('MiComando')

  // 3. Carga inicial
  const load = () => {
    setLoading(true)
    http.get('/mi-modulo').then(r => setList(r.data.data || [])).finally(() => setLoading(false))
  }
  useEffect(load, [])

  // 4. Guardar
  async function handleSave() {
    try {
      await execute(form)
      setModal(false)
      load()
    } catch (e) { setError(e.message) }
  }

  return (
    <div className="p-8">
      {/* Header con título y botón "+ Nuevo" */}
      {/* Stats opcionales */}
      {/* Tabla o lista */}
      {/* Modal de formulario */}
    </div>
  )
}
```
