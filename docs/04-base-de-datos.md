# Base de datos

PostgreSQL 14+. Sin ORM. Queries con parámetros posicionales (`$1`, `$2`...) para prevenir inyección SQL.

El cliente se importa desde `src/db/client.js`:
```javascript
const { query, pool } = require('../db/client')
await query('SELECT * FROM employees WHERE id = $1', [id])
```

---

## Diagrama de módulos

```
AUTENTICACIÓN          RRHH / ASISTENCIA         NÓMINA
─────────────          ─────────────────         ──────
users                  employees                 payroll_periods
roles                  shifts                    payroll_records
user_roles             absences                  payroll_concepts
permissions            absence_types             payroll_rules
role_permissions       absence_code_catalog      payroll_settings
login_history          accidents                 concept_execution_logs
audit_log              holidays                  rule_snapshots
                       work_schedule             payroll_validation_rules
                       shift_types
                       contracts
```

---

## Tablas

### `users`
Cuentas de acceso al sistema.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | serial PK | |
| email | varchar(120) UNIQUE | Login |
| password | varchar(120) | Hash bcrypt |
| role | varchar(20) | `admin` \| `supervisor` (default: `admin`) |
| full_name | varchar(120) | Nombre visible en UI |
| status | varchar(20) | `active` \| `inactive` |
| last_login | timestamp | Actualizado en cada login |
| created_at | timestamp | |

---

### `employees`
Empleados activos e históricos de MAQUINOR.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | serial PK | |
| document | varchar(30) UNIQUE | Cédula o NIT |
| document_type | varchar(10) | `CC`, `NIT`, etc. (default: `CC`) |
| first_name | varchar(80) | |
| last_name | varchar(80) | |
| name | varchar(200) GENERATED | `first_name \|\| ' ' \|\| last_name` (columna computada) |
| position | varchar(80) | Cargo |
| area | varchar(80) | Área o departamento |
| group_name | varchar(80) | Grupo para filtros en programación |
| base_salary | numeric(12,2) | IBC — base para cálculo de nómina |
| smmlv | numeric(14,2) | SMMLV aplicable al empleado |
| shift_type_id | FK → shift_types | Turno asignado |
| status | varchar(20) | `active` \| `inactive` |
| start_date | date | Fecha de ingreso |
| end_date | date | Fecha de retiro (null si activo) |
| phone | varchar(20) | |
| email | varchar(120) | |
| created_by | FK → users | |

---

### `contracts`
Contratos laborales de cada empleado. Un empleado puede tener múltiples contratos a lo largo del tiempo.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | serial PK | |
| employee_id | FK → employees CASCADE | |
| contract_type | varchar(50) | `indefinido`, `fijo`, `obra_labor`, `prestacion_servicios` |
| start_date | date | Fecha de inicio del contrato |
| end_date | date | Fecha de fin (null para indefinido) |
| position | varchar(100) | Cargo especificado en el contrato |
| base_salary | numeric(12,2) | Salario base del contrato |
| status | varchar(20) | `activo` \| `suspendido` \| `terminado` |
| notes | text | Observaciones |
| created_at | timestamp | |

**Índices:** `idx_contracts_employee` sobre `employee_id`.

**Estados:**
```
activo  →  suspendido  →  activo
  └─────────────────────→  terminado (estado final)
```

**Comandos:** `CreateContract`, `UpdateContractStatus`

---

### `shift_types`
Catálogo de tipos de turno. Cada turno define cuántas horas de cada categoría tiene un día laboral.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | serial PK | |
| code | varchar(20) UNIQUE | Ej: `M`, `T`, `N`, `11H` |
| name | varchar(80) | Ej: `Turno Mañana` |
| start_time / end_time | time | Hora de entrada/salida |
| ordinary_hours | numeric(4,2) | Horas ordinarias por día |
| extra_hours | numeric(4,2) | Horas extra diurnas |
| night_hours | numeric(4,2) | Horas nocturnas |
| surcharge_hours | numeric(4,2) | Horas con recargo |
| sunday_holiday_hours | numeric(4,2) | Horas dom/festivo |
| extra_diur_dom_hours | numeric(4,2) | Extra diurna dominical |
| extra_noct_hours | numeric(4,2) | Extra nocturna |
| extra_noct_dom_hours | numeric(4,2) | Extra nocturna dominical |
| rec_dom_noct_hours | numeric(4,2) | Recargo dom. nocturno |
| extra_multiplier | numeric(4,2) | Factor × (default: 1.25) |
| night_multiplier | numeric(4,2) | Factor × (default: 1.35) |
| surcharge_multiplier | numeric(4,2) | Factor × (default: 1.35) |
| sunday_holiday_multiplier | numeric(4,2) | Factor × (default: 1.75) |
| extra_diur_dom_multiplier | numeric(4,2) | Factor × (default: 1.75) |
| extra_noct_multiplier | numeric(4,2) | Factor × (default: 1.75) |
| extra_noct_dom_multiplier | numeric(4,2) | Factor × (default: 2.10) |
| rec_dom_noct_multiplier | numeric(4,2) | Factor × (default: 2.10) |
| color | varchar(10) | Color hex para la UI |
| active | boolean | |

**Seeds MAQUINOR:** `M` (Mañana 6–14), `T` (Tarde 14–22), `N` (Noche 22–6), `11H` (7–18 con 2h extra).

---

### `work_schedule`
Cuadro operativo: un registro por empleado por día. Es la fuente de verdad de la programación.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | serial PK | |
| employee_id | FK → employees CASCADE | |
| schedule_date | date | Día programado |
| shift_type_id | FK → shift_types | Turno del día (null si descanso/ausencia) |
| period_id | FK → payroll_periods | Período al que pertenece |
| is_rest_day | boolean | `true` = día de descanso |
| absence_type | varchar(40) | Código de ausencia (ej: `incapacidad`) |
| notes | text | Observaciones |
| created_by / updated_by | FK → users | Trazabilidad |
| UNIQUE | (employee_id, schedule_date) | Un registro por empleado por día |

---

### `absences`
Registro formal de ausencias (distinto al cuadro operativo).

| Columna | Tipo | Notas |
|---------|------|-------|
| id | serial PK | |
| employee_id | FK → employees | |
| type | varchar(40) | Código: `incapacidad`, `vacaciones`, `permiso`, `ausencia` |
| start_date | date | |
| end_date | date | Opcional |
| reason | text | |
| status | varchar(20) | `pending` \| `approved` |
| created_by | FK → users | |

---

### `absence_types`
Catálogo configurable de tipos de ausencia. Controla el descuento y el comportamiento en el motor de nómina.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | serial PK | |
| code | varchar(40) UNIQUE | Debe coincidir con `work_schedule.absence_type` |
| name | varchar(120) | Nombre visible |
| description | text | |
| deduction_pct | numeric(5,4) | 0.0 a 1.0 (ej: `1.0` = 100% descuento) |
| behavior | varchar(20) | `normal` \| `disability` \| `vacation` \| `paid_leave` |
| active | boolean | Solo los activos aparecen en formularios |

**Campo `behavior`:** le indica al motor de nómina cómo tratar el tipo de ausencia internamente, independiente del `code` o `name`. Permite renombrar tipos sin romper el cálculo.

| behavior | Efecto en motor |
|---|---|
| `normal` | Descuenta según `deduction_pct` |
| `disability` | No descuenta; excluye del auxilio de transporte |
| `vacation` | No descuenta; tratamiento especial de vacaciones |
| `paid_leave` | No descuenta; conserva todos los devengos |

**Valores por defecto:**

| code | name | deduction_pct | behavior |
|------|------|---------------|----------|
| `ausencia` | Ausencia | 1.00 (100%) | `normal` |
| `permiso` | Permiso | 0.00 (0%) | `normal` |
| `incapacidad` | Incapacidad (EPS) | 0.00 (0%) | `disability` |
| `vacaciones` | Vacaciones | 0.00 (0%) | `vacation` |
| `licencia_remunerada` | Licencia remunerada | 0.00 (0%) | `paid_leave` |

---

### `accidents`

| Columna | Tipo | Notas |
|---------|------|-------|
| id | serial PK | |
| employee_id | FK → employees | |
| date | date | |
| description | text | |
| severity | varchar(20) | Ej: `leve`, `grave` |
| location | varchar(120) | |

---

### `payroll_periods`
Define los períodos de liquidación.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | serial PK | |
| name | varchar(80) | Ej: `Primera quincena mayo 2026` |
| start_date | date | |
| end_date | date | |
| status | varchar(20) | `open` \| `closed` |

---

### `payroll_records`
Resultado del cálculo de nómina por empleado por período. Se sobreescribe si se recalcula.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | serial PK | |
| period_id | FK → payroll_periods CASCADE | |
| employee_id | FK → employees | |
| days_worked | integer | |
| rest_days | integer | |
| absence_days | integer | Ausencias genéricas |
| disability_days | integer | Incapacidades |
| vacation_days | integer | Vacaciones |
| ordinary_hours | numeric(8,2) | |
| extra_hours | numeric(8,2) | |
| night_hours | numeric(8,2) | |
| surcharge_hours | numeric(8,2) | |
| sunday_holiday_hours | numeric(8,2) | |
| gross_pay | numeric(14,2) | Devengado bruto |
| deductions | numeric(14,2) | Total descuentos |
| net_pay | numeric(14,2) | A pagar |
| calculation_details | jsonb | Desglose completo del cálculo |
| UNIQUE | (period_id, employee_id) | |

---

### `payroll_settings`
Parámetros de nómina. Se actualizan cada año sin deploy.

| key | Valor 2026 | Descripción |
|-----|-----------|-------------|
| `smmlv` | 1,423,500 | Salario mínimo mensual |
| `aux_trans` | 200,000 | Auxilio de transporte |
| `tasa_salud` | 0.04 | 4% — descuento empleado |
| `tasa_pension` | 0.04 | 4% — descuento empleado |
| `tasa_solidaridad` | 0.01 | 1% — solo si base > 4 SMMLV |
| `limite_aux_trans` | 2 | Máximo en SMMLV para recibir aux. |
| `limite_solidaridad` | 4 | Mínimo en SMMLV para pagar solidaridad |

---

### `payroll_validation_rules`
Reglas de validación que el motor ejecuta antes de cada cálculo. Generan advertencias sin bloquear el cálculo.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | serial PK | |
| code | varchar(60) UNIQUE | Identificador de la regla |
| name | varchar(120) | Nombre visible en UI |
| description | text | Explicación de qué detecta |
| active | boolean | Si está activa, se ejecuta en cada cálculo |
| created_at | timestamp | |

**Reglas precargadas:**

| code | name | Qué detecta |
|------|------|-------------|
| `CHECK_ACTIVE_CONTRACT` | Sin contrato activo | Empleados activos sin contrato vigente |
| `CHECK_BASE_SALARY` | Salario base en cero | Empleados con IBC = $0 |
| `CHECK_RECALCULATION` | Período ya calculado | El período tiene registros previos |
| `CHECK_SCHEDULE` | Sin programación | Empleados sin días programados en el período |

---

### `payroll_concepts`
Conceptos dinámicos de nómina (además de los built-in del motor).

| Columna | Tipo | Notas |
|---------|------|-------|
| code | varchar(30) UNIQUE | Ej: `BONIFICACION` |
| name | varchar(120) | |
| type | varchar(30) | `earning` \| `deduction` \| `base` \| `derived` |
| category | varchar(60) | Agrupación en reportes |
| active | boolean | |

---

### `payroll_rules`
Reglas para calcular conceptos dinámicos. Cada concepto puede tener varias reglas (la primera que aplica gana).

| Columna | Tipo | Notas |
|---------|------|-------|
| concept_id | FK → payroll_concepts CASCADE | |
| formula | text | Expresión mathjs. Ej: `base_salary * 0.05` |
| conditions | jsonb | JsonLogic. Ej: `{"operator":"AND","rules":[...]}` |
| priority | integer | Menor número = mayor prioridad |
| active | boolean | |

**Variables disponibles en fórmulas:**

| Variable | Descripción |
|----------|-------------|
| `base_salary` | Salario base del empleado |
| `smmlv` | SMMLV del empleado (o de `payroll_settings` como fallback) |
| `days_worked` | Días trabajados en el período |
| `ordinary_hours` | Horas ordinarias |
| `extra_hours` | Horas extra |
| `night_hours` | Horas nocturnas |
| `absence_days` | Días de ausencia |
| `gross_pay` | Devengado hasta ese momento |

---

### `roles`, `user_roles`, `permissions`, `role_permissions`
Sistema de roles y permisos por módulo/acción. Cada usuario puede tener múltiples roles.

---

### `audit_log`
Registra cada comando ejecutado con su payload y usuario.

---

### `login_history`
Historial de intentos de login (exitosos y fallidos).

---

## Convenciones

- Todas las tablas tienen `id SERIAL PRIMARY KEY` y `created_at TIMESTAMP DEFAULT now()`.
- Las fechas de tipo `DATE` se devuelven como string `YYYY-MM-DD` (el cliente tiene configurado `types.setTypeParser(1082, val => val)` para evitar conversiones de timezone).
- Las FKs de auditoría (`created_by`, `updated_by`) apuntan a `users(id)`.
- Las migraciones usan `IF NOT EXISTS` para ser idempotentes y se ejecutan en `startup.sh`.
