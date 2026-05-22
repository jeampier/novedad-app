# Motor de nómina

El motor de nómina es la pieza más compleja del sistema. Se encuentra en `backend/src/core/payroll-engine/`.

---

## Visión general

Cuando el usuario hace clic en "Calcular nómina", se ejecuta un pipeline de **8 pasos secuenciales**. Cada paso lee y escribe en un objeto `context` compartido.

```
POST /api/payroll/calculate { periodId }
        │
        ▼
PayrollEngine.run(periodId, userId)
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│  1. loadSettings    → carga tasas de payroll_settings   │
│  2. loadEmployees   → empleados activos                 │
│  3. loadSchedules   → work_schedule del período         │
│  4. loadNovelties   → conceptos, reglas, tipos ausencia │
│  5. applyConcepts   → calcula horas y earnings built-in │
│  6. applyRules      → aplica conceptos dinámicos        │
│  7. calculateTotals → deducciones SS y neto             │
│  8. persistPayroll  → guarda en payroll_records         │
└─────────────────────────────────────────────────────────┘
        │
        ▼
{ savedRecords: [...], logs: [...] }
```

---

## El objeto `context`

Fluye entre todos los pasos. Cada paso lo enriquece:

```javascript
{
  // Input
  periodId: 3,
  userId: 1,
  options: { dryRun: false },

  // Cargado en paso 1
  settings: {
    smmlv: 1750905,
    aux_trans: 249095,
    tasa_salud: 0.04,
    tasa_pension: 0.04,
    tasa_solidaridad: 0.01,
    limite_aux_trans: 2,
    limite_solidaridad: 4,
  },

  // Cargado en paso 2
  period: { id, name, start_date, end_date, status },
  employees: [{ id, name, base_salary, smmlv, shift_type_id, ... }],

  // Cargado en paso 3
  schedules: [{ employee_id, schedule_date, shift_type_id, is_rest_day, absence_type, ... }],
  schedulesByEmployee: { [employee_id]: [...días] },

  // Cargado en paso 4
  dynamicConcepts: [{ id, code, name, type, rules: [...] }],
  absenceTypesMap: { 'incapacidad': { deduction_pct: 0 }, 'ausencia': { deduction_pct: 1 }, ... },

  // Construido en pasos 5-7
  employeeResults: {
    [employee_id]: {
      employee: { ...datos },
      attendance: { daysWorked, restDays, absenceDays, disabilityDays, vacationDays },
      hours: { ordinary, extra, extraDiurDom, extraNoct, extraNoctDom, night, surcharge, ... },
      concepts: {
        HORAS_ORD:     { value, type: 'earning', ... },
        HORAS_EXT:     { value, type: 'earning', ... },
        DESC_AUSENCIA: { value, type: 'deduction', ... },
        // + conceptos dinámicos
      },
      grossPay: 0,
      deductions: 0,
      netPay: 0,
    }
  },

  // Resultado final (paso 8)
  savedRecords: [...],
  logs: [{ step, level, message, data }],
}
```

---

## Pasos del pipeline

### Paso 1 — `loadSettings`
```
DB: SELECT key, value FROM payroll_settings
→ ctx.settings = { smmlv, aux_trans, tasa_salud, ... }
```

### Paso 2 — `loadEmployees`
```
DB: SELECT * FROM payroll_periods WHERE id = $periodId
DB: SELECT * FROM employees WHERE status = 'active'
→ ctx.period, ctx.employees
Valida: período no debe estar cerrado
```

### Paso 3 — `loadSchedules`
```
DB: SELECT * FROM work_schedule WHERE schedule_date BETWEEN start AND end
→ ctx.schedules
→ ctx.schedulesByEmployee = { empId: [días...] }  ← índice para O(1) lookup
```

### Paso 4 — `loadNovelties`
```
En paralelo:
  DB: SELECT * FROM payroll_concepts WHERE active = true
  DB: SELECT * FROM payroll_rules WHERE active = true
  DB: SELECT * FROM absence_types WHERE active = true
→ ctx.dynamicConcepts (con reglas agrupadas por concept_id)
→ ctx.absenceTypesMap (código → { deduction_pct })
```

### Paso 5 — `applyConcepts`

Para cada empleado:

1. Obtiene sus días del `schedulesByEmployee`
2. Llama `HoursCalculator.aggregateEmployee(days, baseSalary)` que devuelve:
   - Totales de horas por categoría
   - Clasificación de días (trabajados, descanso, ausencia, incapacidad, vacaciones)
3. Para cada concepto built-in del `ConceptRegistry`, llama `concept.calculate(employee, days, settings)`
4. Calcula `DESC_AUSENCIA`:
   ```
   Por cada tipo de ausencia con deduction_pct > 0:
     descuento += diasAusencia × (base_salary / 30) × deduction_pct
   ```
5. Guarda todo en `ctx.employeeResults[emp.id]`

### Paso 6 — `applyRules`

Solo si hay `dynamicConcepts`. Para cada concepto dinámico:

1. Construye el scope de variables con los datos del empleado
2. Itera las reglas ordenadas por `priority` ASC
3. Para cada regla:
   ```
   if evaluateConditions(rule.conditions, scope):
     result = evaluate(rule.formula, scope)
     break  ← primera regla que aplica gana
   ```
4. Guarda el resultado en `ctx.employeeResults[emp.id].concepts[code]`

### Paso 7 — `calculateTotals`

Para cada empleado:

```
grossPay = suma de todos los concepts donde type = 'earning'

IBC (base para SS) = HORAS_ORD.value  ← solo salario ordinario

salud       = IBC × tasa_salud
pension     = IBC × tasa_pension
solidaridad = IBC × tasa_solidaridad  (si base_salary > limite × smmlv)

deductions = salud + pension + solidaridad + DESC_AUSENCIA + otros deductions

netPay = grossPay - deductions
```

### Paso 8 — `persistPayroll`

Si `dryRun = true`: retorna los resultados sin escribir en DB.

Si no:
```
Para cada empleado:
  payrollRecordRepo.upsert({
    period_id, employee_id,
    days_worked, rest_days, absence_days, ...
    ordinary_hours, extra_hours, ...
    gross_pay, deductions, net_pay,
    calculation_details: JSON con el desglose completo
  })
  → INSERT ... ON CONFLICT (period_id, employee_id) DO UPDATE
```

---

## Conceptos built-in

Están en `src/core/payroll-engine/concepts/builtin/`. Todos siguen la misma interfaz:

```javascript
{
  code: 'HORAS_ORD',
  label: 'Horas ordinarias',
  type: 'earning',
  builtin: true,

  calculate(employee, days, settings) {
    const hourlyRate = employee.base_salary / 240
    // suma horas del tipo correspondiente en cada día
    return { hours, value, breakdown: [{date, hours, pay}] }
  }
}
```

| Código | Descripción | Multiplicador |
|--------|-------------|---------------|
| `HORAS_ORD` | Salario ordinario / base SS | 1.00× |
| `HORAS_EXT` | Extra diurna | 1.25× |
| `HORAS_EXT_DIUR_DOM` | Extra diurna dominical | 1.75× |
| `HORAS_EXT_NOCT` | Extra nocturna | 1.75× |
| `HORAS_EXT_NOCT_DOM` | Extra nocturna dominical | 2.10× |
| `HORAS_NOC` | Recargo nocturno | 1.35× |
| `HORAS_REC` | Recargo general | 1.35× |
| `HORAS_DOM` | Recargo dominical diurno | 1.75× |
| `HORAS_REC_DOM_NOCT` | Recargo dominical nocturno | 2.10× |
| `AUX_TRANS` | Auxilio de transporte | desde `payroll_settings` |
| `DESC_AUSENCIA` | Descuento por ausencias | según `absence_types.deduction_pct` |

> Los multiplicadores vienen de `shift_types`, no están hardcodeados en el motor.

---

## Conceptos dinámicos

Se crean desde la UI en `/payroll/concepts`. Permiten agregar bonificaciones, descuentos o reglas especiales sin modificar código.

**Ejemplo: bonificación por productividad**

```sql
-- payroll_concepts
INSERT INTO payroll_concepts (code, name, type, category)
VALUES ('BONIF_PROD', 'Bonificación productividad', 'earning', 'Incentivos');

-- payroll_rules
INSERT INTO payroll_rules (concept_id, name, formula, conditions, priority)
VALUES (
  5,
  'Si trabajó 20+ días',
  'base_salary * 0.05',
  '{"operator":"AND","rules":[{"variable":"days_worked","comparator":"gte","value":20}]}',
  1
);
```

Durante el cálculo:
1. Motor evalúa `days_worked >= 20`
2. Si aplica: `base_salary * 0.05` → `1,750,905 * 0.05 = 87,545`
3. Se agrega como concepto `BONIF_PROD` en el resultado del empleado

---

## Modo dry-run

Permite simular el cálculo sin escribir en base de datos. Se activa pasando `dryRun: true`:

```javascript
POST /api/payroll/calculate
{ "periodId": 3, "dryRun": true }
```

Útil para verificar resultados antes de confirmar una liquidación.

---

## `HoursCalculator`

`src/core/payroll-engine/calculators/HoursCalculator.js`

Función principal: `aggregateEmployee(days, baseSalary)`

Para cada día en el array:
- Si `is_rest_day`: cuenta como `restDays`
- Si `absence_type = 'incapacidad'`: cuenta como `disabilityDays`
- Si `absence_type = 'vacaciones'`: cuenta como `vacationDays`
- Si `absence_type` (otro): cuenta como `absenceDays`
- Si tiene `shift_type_id`: suma horas por categoría × multiplicador del turno

Devuelve:
```javascript
{
  daysWorked, restDays, absenceDays, disabilityDays, vacationDays,
  ordinary, extra, extraDiurDom, extraNoct, extraNoctDom,
  night, surcharge, sundayHoliday, recDomNoct,
  grossPay, hourlyRate,
  breakdown: [{ date, shiftCode, ordinary, extra, ..., pay }]
}
```

---

## `FormulaEvaluator`

`src/services/formulaEvaluator.js`

Usa `mathjs` para evaluar expresiones de forma segura:

```javascript
evaluate('base_salary * 0.05', { base_salary: 1750905 })
// → { success: true, result: 87545.25 }

evaluateConditions(
  { operator: 'AND', rules: [{ variable: 'days_worked', comparator: 'gte', value: 20 }] },
  { days_worked: 22 }
)
// → true
```

Comparadores soportados: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`.
Operadores lógicos: `AND`, `OR`.
