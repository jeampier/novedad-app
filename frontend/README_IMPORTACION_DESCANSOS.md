# Importación de Cuadro de Descansos

## Descripción

Permite cargar el cuadro anual de descansos desde un archivo `.xlsx` (formato Maquinor) y asociar los registros al período de nómina correspondiente.

---

## Flujo completo

### 1. Prerequisitos

- El archivo Excel debe seguir el formato del cuadro de descansos de Maquinor:
  - **Fila 1:** nombres de los meses (ENERO, FEBRERO, ...)
  - **Fila 2:** números de día (1, 2, 3, ...)
  - **Fila 3:** día de la semana (L, M, MI, J, V, S, D)
  - **Filas 4 en adelante:** datos de empleados
  - **Columna A:** nombre completo del empleado
  - **Columna B:** grupo (1, 2, 3, 4 o vacío)
  - **Celdas de datos:** `D` (descanso), `I` (incapacidad), o número (horas trabajadas)

- El período de nómina debe estar creado en el sistema antes de importar.
- Los empleados del Excel deben existir en la base de datos (ver sección de carga inicial).

### 2. Carga inicial de empleados (una sola vez)

Si los empleados aún no están en el sistema, ejecutar desde el backend:

```bash
cd backend
node src/db/seed_employees_from_excel.js "/ruta/al/archivo.xlsx"
```

Esto crea los empleados con documentos temporales (`TEMP-001`, `TEMP-002`, ...). Luego actualizar los documentos reales desde la pantalla de empleados.

### 3. Importar descansos

1. Ir a **Nómina → Períodos**
2. Localizar el período al que se quiere importar (ej: *Mayo 2026*)
3. Hacer clic en **"Importar descansos"**
4. En el modal, seleccionar el archivo `.xlsx`
5. Hacer clic en **Importar**

El sistema:
- Detecta automáticamente el mes a importar según las fechas del período
- Extrae solo las columnas de ese mes del Excel
- Hace upsert en `work_schedule` — si ya existen registros para ese empleado y fecha, los actualiza

### 4. Resultado

Al finalizar, el modal muestra:

- **Registros importados:** cantidad de días procesados correctamente
- **Empleados no encontrados:** lista de nombres del Excel que no coincidieron con ningún empleado en la BD (requieren revisión manual)

---

## Mapeo de valores

| Valor en Excel | Campo en BD | Descripción |
|---|---|---|
| `D` | `is_rest_day = true` | Día de descanso |
| `I` | `absence_type = 'I'` | Incapacidad |
| número (ej: `11`, `9.25`) | `notes = '11'` | Horas trabajadas ese día |

---

## Archivos involucrados

### Frontend
| Archivo | Descripción |
|---|---|
| `src/pages/payroll/PeriodsPage.jsx` | Botón y modal de importación |
| `src/api/payroll.js` | Método `periods.importSchedule(id, file)` |

### Backend
| Archivo | Descripción |
|---|---|
| `src/routes/payroll/scheduleImport.js` | Endpoint `POST /api/payroll/periods/:id/import-schedule` |
| `src/services/scheduleImportService.js` | Lógica de parseo e importación |
| `src/db/migrate_schedule_import.js` | Migración: agrega `period_id` a `work_schedule` |
| `src/db/seed_employees_from_excel.js` | Script de carga inicial de empleados |

---

## Notas

- El archivo puede cubrir todo el año; el sistema extrae solo el mes del período seleccionado.
- La importación es idempotente: ejecutarla varias veces con el mismo archivo no genera duplicados.
- Los nombres de empleados se normalizan (sin tildes, mayúsculas) para el matching. Si hay diferencias grandes entre el nombre en el Excel y el nombre en la BD, el empleado aparecerá en la lista de "no encontrados".
