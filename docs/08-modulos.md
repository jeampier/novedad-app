# Módulos funcionales

Descripción de cada módulo del sistema: qué hace, cómo fluye y qué tablas usa.

---

## Dashboard

**URL:** `/`  
**Archivo:** `frontend/src/pages/DashboardPage.jsx`  
**Endpoint:** `GET /api/dashboard/summary`

Panel principal con KPIs en tiempo real. Se carga una sola vez al montar la página (sin auto-refresco).

### KPIs disponibles

| KPI | Fuente |
|-----|--------|
| Empleados activos | `COUNT(*) FROM employees WHERE status='active'` |
| Ausencias en el mes | `COUNT(*) FROM absences` del mes actual |
| Accidentes en el mes | `COUNT(*) FROM accidents` del mes actual |
| Período de nómina activo | `payroll_periods WHERE status='open'` |
| Ausentes hoy | Ausencias con `start_date <= hoy <= end_date` |
| Días de ausencia acumulados | Suma de días de ausencias en el mes (clampeados al mes) |
| Días sin accidentes | `CURRENT_DATE - MAX(date)` de `accidents` |
| **Empleados programados** | `COUNT(DISTINCT employee_id) FROM work_schedule` del período activo, con turno activo |
| **Días de descanso** | `COUNT(*) FROM work_schedule WHERE is_rest_day = true` del período activo |
| **Ausencias en programación** | `COUNT(*) FROM work_schedule WHERE absence_type IS NOT NULL` del período activo |

Los tres últimos KPIs (de programación) solo aparecen si hay un período abierto.

---

## Empleados

**URL:** `/employees`  
**Tablas:** `employees`, `shift_types`  
**Comandos:** `OnboardEmployee`, `OffboardEmployee`

CRUD completo de empleados. El formulario de alta incluye:
- Datos personales: nombre, documento, tipo documento
- Datos laborales: cargo, área, grupo, fecha ingreso, turno asignado
- Salario base (IBC) y SMMLV aplicable

**Estado del empleado:** `active` | `inactive`. Los empleados inactivos no aparecen en el cuadro de programación ni en el cálculo de nómina, pero su historial se conserva.

---

## Contratos

**URL:** `/contracts`  
**Tabla:** `contracts`  
**Comandos:** `CreateContract`, `UpdateContractStatus`  
**API frontend:** `src/api/contracts.js`

Gestiona los contratos laborales de cada empleado. Un empleado puede tener múltiples contratos a lo largo del tiempo.

### Tipos de contrato
- `indefinido` — Sin fecha de terminación
- `fijo` — Con fecha de fin definida
- `obra_labor` — Para un proyecto específico
- `prestacion_servicios` — Contratista independiente

### Estados y transiciones
```
activo  →  suspendido  →  activo
  └─────────────────────→  terminado (estado final)
```

### Endpoints REST disponibles
```
GET /api/contracts                    → todos los contratos con nombre de empleado
GET /api/contracts/employee/:empId   → contratos de un empleado
GET /api/contracts/:id               → un contrato por ID
```

### Campos del formulario de creación
- `employee_id` (requerido)
- `contract_type` (requerido)
- `start_date` (requerido)
- `end_date` (opcional)
- `position` — cargo en el contrato
- `base_salary` — salario del contrato
- `notes` — observaciones

---

## Solicitudes

**URL:** `/requests`  
**Tablas:** `requests`  
**Comandos:** `CreateRequest`, `ApproveRequest`, `RejectRequest`

Flujo formal de aprobación para peticiones de empleados (permisos, vacaciones, incapacidades).

### Estados del flujo
```
Pendiente  →  Aprobada  →  Liquidada (al calcular nómina del período)
           →  Rechazada
```

### Pestañas en la UI
- **Pendientes:** solicitudes nuevas que requieren decisión
- **Aprobadas:** aprobadas, pendientes de liquidar en nómina
- **Rechazadas:** solicitudes denegadas
- **Liquidadas:** incluidas en un cálculo de nómina (cerradas por `liquidateRequests`)

> Al aprobar una solicitud, el sistema crea automáticamente un registro de ausencia para ese empleado.

---

## Ausencias

**URL:** `/absences`  
**Tablas:** `absences`, `absence_types`  
**Comando:** `RegisterAbsence`

Registro de ausencias formales (independiente del cuadro operativo).

El formulario carga los tipos de ausencia dinámicamente desde `absence_types` (tabla configurable). Al agregar un nuevo tipo en `/payroll/absence-types`, aparece automáticamente en este formulario.

**Campos:** empleado, tipo, fecha inicio, fecha fin (opcional), motivo.

---

## Accidentes

**URL:** `/accidents`  
**Tabla:** `accidents`  
**Comando:** `RegisterAccident`

Registro de accidentes laborales con severidad y ubicación. El KPI "Días sin accidentes" del dashboard se calcula desde esta tabla.

---

## Turnos

**URL:** `/shifts`  
**Tabla:** `shifts`  
**Comando:** `ChangeShift`

Registro de cambios de turno con fecha efectiva. Historial de cambios por empleado.

---

## Nómina — Programación

**URL:** `/payroll/schedule`  
**Tabla:** `work_schedule`  
**Archivos:** `SchedulePage.jsx`, `workScheduleRepo.js`, `routes/payroll/schedule.js`

Cuadro operativo mensual. Vista de tabla donde cada fila es un empleado y cada columna es un día del mes.

**Cómo funciona:**
1. Al cargar, obtiene todos los `work_schedule` del mes seleccionado
2. Construye un mapa `{ empId_día: entry }` para renderizado rápido
3. Al hacer clic en una celda, abre un modal con opciones:
   - Seleccionar un turno (de `shift_types`)
   - Seleccionar una novedad/ausencia (de `absence_types` + "Descanso")
   - Limpiar la celda
4. Al guardar, hace `upsert` en `work_schedule`

**Filtros:** navegación por mes, filtro por grupo de empleados.

---

## Nómina — Tipos de turno

**URL:** `/payroll/shift-types`  
**Tabla:** `shift_types`

Catálogo de turnos configurables. Cada turno define:
- Código y nombre
- Horario (entrada/salida)
- Horas por categoría (ordinarias, extra, nocturnas, etc.)
- Multiplicadores (factores de pago por tipo de hora)
- Color para la UI

Los multiplicadores determinan cuánto se paga cada tipo de hora. Si hay una `rate_rule` para el grupo o cargo del empleado, esa regla tiene prioridad sobre los multiplicadores del turno.

**Seeds MAQUINOR:** `M` (Mañana), `T` (Tarde), `N` (Noche), `11H` (11 horas con 2h extra incluidas).

---

## Nómina — Tipos de ausencia

**URL:** `/payroll/absence-types`  
**Tabla:** `absence_types`

Catálogo configurable de tipos de ausencia. Controla el impacto en nómina.

**Campos clave:**
- `code`: debe coincidir con `work_schedule.absence_type`
- `deduction_pct`: porcentaje de descuento por día (0.0 a 1.0)
- `behavior`: determina el tratamiento en el motor (`normal`, `disability`, `vacation`, `paid_leave`)

> El `behavior` es la forma en que el motor identifica tipos especiales de ausencia. Permite renombrar el tipo sin romper el cálculo.

Solo admin puede crear, editar o eliminar tipos.

---

## Nómina — Períodos

**URL:** `/payroll/periods`  
**Tabla:** `payroll_periods`

Gestión de períodos de liquidación (quincenas o meses).

**Estados:**
- `open`: período activo. Se puede programar y calcular nómina.
- `closed`: período cerrado. No se puede modificar.

Solo puede haber **un período abierto** a la vez (convención, no constraint en DB).

Desde cada período se puede:
- Ver la grilla de programación del período
- Importar la programación desde un archivo Excel
- Calcular la nómina y ver advertencias del motor
- Exportar en Excel o CSV

---

## Nómina — Cuadro por período

**URL:** `/payroll/periods/:id/schedule`  
**Tabla:** `work_schedule` (filtrado por `period_id`)

Vista de la programación vinculada a un período específico. Permite importar desde Excel.

---

## Nómina — Conceptos

**URL:** `/payroll/concepts`  
**Tablas:** `payroll_concepts`, `payroll_rules`

CRUD de conceptos dinámicos de nómina. Cada concepto puede tener múltiples reglas.

**Tipos de concepto:**
- `earning`: suma al devengado
- `deduction`: descuenta del devengado
- `base`: valor base para cálculos derivados
- `derived`: calculado a partir de otros conceptos

**Constructor de reglas:**
- Condiciones en formato JsonLogic (AND/OR de comparadores)
- Fórmulas en mathjs (`base_salary * 0.05`, `days_worked * 5000`, etc.)
- La primera regla cuyas condiciones se cumplan es la que aplica

Se puede **simular** el cálculo de un concepto antes de activarlo.

---

## Nómina — Tasas por grupo/cargo

**URL:** `/payroll/rate-rules` (o dentro de Parámetros)  
**Tabla:** `rate_rules`  
**Archivo:** `routes/payroll/rateRules.js`

Define multiplicadores diferenciados por **grupo de empleado** o por **cargo**. Tiene prioridad sobre los multiplicadores del tipo de turno.

**Prioridad de aplicación en el motor:**
1. Regla específica de grupo + cargo
2. Solo grupo
3. Solo cargo
4. Multiplicadores del tipo de turno (fallback)

---

## Nómina — Consolidado

**URL:** `/payroll/records`  
**Tabla:** `payroll_records`

Muestra los resultados del último cálculo por período. Permite:
- Ver el desglose por empleado (horas, devengado, descuentos, neto)
- Exportar en Excel o CSV

---

## Nómina — Parámetros

**URL:** `/payroll/settings`  
**Tablas:** `payroll_settings`, `absence_code_catalog`, `payroll_validation_rules`

Pantalla central de configuración del sistema de nómina. Solo admin puede modificarlos.

### Secciones de la página

| Sección | Descripción |
|---------|-------------|
| **Parámetros globales** | SMMLV, auxilio de transporte, límites |
| **Seguridad Social** | Tasas de salud, pensión y solidaridad |
| **Catálogo de códigos de ausencia** | Códigos válidos para el cuadro Excel |
| **Reglas de validación** | Toggle para activar/desactivar cada regla; activas = generan advertencias en el cálculo |

### Reglas de validación

Cada regla tiene un toggle que se guarda con el comando `UpdateValidationRule`:

```javascript
const { execute } = useCommand('UpdateValidationRule')
await execute({ id: rule.id, active: !rule.active })
```

Las reglas activas se ejecutan en el paso `validateEmployees` del pipeline antes de cada cálculo.

---

## Administración

**URL:** `/admin/*`  
**Acceso:** solo `admin`

| Sección | Descripción |
|---------|-------------|
| Usuarios | CRUD de cuentas con rol y estado |
| Roles | Gestión de roles y permisos por módulo/acción |
| Auditoría | Log de todos los comandos ejecutados con usuario y timestamp |
