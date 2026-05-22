# Roadmap y pendientes

Estado actual del sistema y lo que viene.

---

## Estado actual (mayo 2026)

El sistema está en producción con empleados reales de MAQUINOR. Las funcionalidades core están estables:

- Programación de turnos mensual
- Cálculo de nómina con conceptos built-in y dinámicos
- Registro de ausencias, accidentes y cambios de turno
- Dashboard con KPIs en tiempo real
- Exportación a Excel y CSV

---

## Brechas vs Excel MAQUINOR

El Excel original de MAQUINOR tiene lógicas que aún no están completamente replicadas en el sistema:

### 1. Tasas de extras/recargos por cargo

**Excel:** las tasas de recargo y extras están parametrizadas por cargo en la hoja `PARAMETROS`. Cada cargo puede tener multiplicadores distintos.

**Sistema actual:** los multiplicadores vienen del `shift_type` (tipo de turno), no del cargo del empleado.

**Impacto:** un operador y un supervisor que hacen el mismo turno reciben el mismo multiplicador, cuando en el Excel podrían tener tasas distintas.

**Solución propuesta:** agregar tabla `cargo_params` con FK a `employees.position` y columnas de multiplicadores, o agregar los multiplicadores directamente al empleado. El motor ya está diseñado para recibir estos valores desde el contexto.

---

### 2. Tratamiento recargo vs extra

**Excel:** los recargos (nocturno, dominical) solo pagan la **prima** sobre el salario. Es decir, si la tarifa ordinaria es $10,000/hora, un recargo nocturno del 35% paga $3,500 adicionales, no $13,500 totales.

**Sistema actual:** todos los tipos de hora (ordinaria + recargo) se calculan multiplicando la tarifa base × el factor completo. Resultado: las horas con recargo incluyen la base, cuando contablemente deberían ser solo la diferencia.

**Impacto:** pequeña sobreestimación del devengado en períodos con muchas horas nocturnas o dominicales.

**Solución propuesta:** agregar un flag `add_base` (boolean) en `shift_types` por tipo de hora. Si es `false`, el cálculo es `hourlyRate × (multiplier - 1)` en lugar de `hourlyRate × multiplier`.

---

## Pendientes de producto

### Módulo de vacaciones
Planificación anual de vacaciones por empleado. Actualmente las vacaciones se marcan en el cuadro operativo pero no hay gestión de saldo ni acumulado.

**Tablas a crear:** `vacation_balance` (acumulado por empleado), `vacation_requests` (solicitudes con fechas y estado).

---

### Reportes gerenciales
Gráficas de tendencias para presentar a gerencia:
- Ausentismo por mes y por tipo
- Accidentalidad y días sin accidentes
- Evolución del costo de nómina por período
- Comparativo entre grupos/áreas

**Tecnología sugerida:** agregar una librería de gráficas al frontend (Recharts o Chart.js).

---

### Notificaciones
Alertar a supervisores cuando:
- Un empleado lleva N días de ausencia consecutivos
- Se registra un accidente grave
- Un período está próximo a vencer sin ser calculado

---

### Historial de nómina por empleado
Vista de todos los recibos históricos de un empleado. Actualmente solo se puede ver el consolidado por período.

---

### Multi-empresa
La tabla `payroll_concepts` ya tiene una columna `company_id` preparada para soporte multi-empresa, pero aún no está implementada la lógica de separación por empresa.

---

## Deuda técnica

| Ítem | Prioridad | Descripción |
|------|-----------|-------------|
| Tests unitarios del motor de nómina | Alta | El pipeline no tiene cobertura de tests. Es el código más crítico. |
| Validación de solapamiento de períodos | Media | No hay constraint que impida crear dos períodos con fechas que se solapan |
| Paginación en tablas | Media | Las tablas cargan todos los registros. Con muchos empleados puede ser lento. |
| Rate limiting en la API | Media | No hay protección contra abuso de endpoints públicos |
| Refresh token | Baja | El token JWT vence y el usuario debe volver a hacer login manualmente |

---

## Arquitectura futura

A medida que el sistema crezca, considerar:

- **WebSockets o SSE** para el dashboard en tiempo real (sin recarga manual)
- **Cola de trabajo** (Bull/BullMQ) para el cálculo de nómina en background cuando haya muchos empleados
- **Caché** (Redis) para los KPIs del dashboard que no cambian frecuentemente
- **Separar la DB de Neon** a una instancia dedicada si el volumen de datos crece significativamente
