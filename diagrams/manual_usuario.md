# Manual de Usuario — Novedad App
**Sistema de Gestión de Novedades y Nómina — MAQUINOR**
Versión 2.0 | Mayo 2026

---

## Tabla de contenido

1. [Introducción](#1-introducción)
2. [Acceso al sistema](#2-acceso-al-sistema)
3. [Dashboard](#3-dashboard)
4. [Empleados](#4-empleados)
5. [Contratos](#5-contratos)
6. [Solicitudes](#6-solicitudes)
7. [Ausencias](#7-ausencias)
8. [Accidentes](#8-accidentes)
9. [Turnos](#9-turnos)
10. [Módulo de Nómina](#10-módulo-de-nómina)
    - 10.1 [Tipos de turno](#101-tipos-de-turno)
    - 10.2 [Programación](#102-programación)
    - 10.3 [Importar descansos desde Excel](#103-importar-descansos-desde-excel)
    - 10.4 [Tipos de ausencia](#104-tipos-de-ausencia)
    - 10.5 [Períodos de nómina](#105-períodos-de-nómina)
    - 10.6 [Calcular nómina](#106-calcular-nómina)
    - 10.7 [Registros y colillas de pago](#107-registros-y-colillas-de-pago)
    - 10.8 [Historial por empleado](#108-historial-por-empleado)
    - 10.9 [Exportar nómina](#109-exportar-nómina)
    - 10.10 [Conceptos de nómina](#1010-conceptos-de-nómina)
    - 10.11 [Tasas por grupo/cargo](#1011-tasas-por-grupocargo)
    - 10.12 [Parámetros de nómina](#1012-parámetros-de-nómina)
11. [Administración](#11-administración)
    - 11.1 [Usuarios](#111-usuarios)
    - 11.2 [Roles y permisos](#112-roles-y-permisos)
    - 11.3 [Auditoría](#113-auditoría)
12. [Parametrización del sistema](#12-parametrización-del-sistema)
    - 12.1 [Secuencia de configuración inicial](#121-secuencia-de-configuración-inicial)
    - 12.2 [Configurar tipos de turno](#122-configurar-tipos-de-turno)
    - 12.3 [Configurar tipos de ausencia y comportamiento](#123-configurar-tipos-de-ausencia-y-comportamiento)
    - 12.4 [Configurar catálogo de códigos de ausencia](#124-configurar-catálogo-de-códigos-de-ausencia)
    - 12.5 [Actualizar parámetros legales anuales](#125-actualizar-parámetros-legales-anuales)
    - 12.6 [Configurar tasas de seguridad social](#126-configurar-tasas-de-seguridad-social)
    - 12.7 [Configurar tasas por grupo y cargo](#127-configurar-tasas-por-grupo-y-cargo)
    - 12.8 [Activar conceptos dinámicos](#128-activar-conceptos-dinámicos)
    - 12.9 [Gestionar reglas de validación](#129-gestionar-reglas-de-validación)
    - 12.10 [Actualización anual — lista de verificación](#1210-actualización-anual--lista-de-verificación)

---

## 1. Introducción

**Novedad App** es el sistema central de gestión de novedades y nómina de MAQUINOR. Reemplaza el manejo manual en Excel, centralizando en una sola plataforma:

- Registro de empleados y sus contratos
- Gestión de ausencias, accidentes y cambios de turno
- Flujo de solicitudes de los empleados
- Cálculo automático de nómina con todas las variables del Código Sustantivo del Trabajo (CST)
- Generación de colillas de pago y reportes

El sistema funciona desde cualquier navegador web. No requiere instalación.

---

## 2. Acceso al sistema

### Ingresar

1. Abrir el navegador y dirigirse a la URL de la aplicación
2. Ingresar el correo electrónico y la contraseña
3. Hacer clic en **Ingresar**

> Si olvidó su contraseña, contacte al administrador del sistema.

### Cerrar sesión

Hacer clic en el ícono de usuario en la esquina inferior izquierda del menú lateral.

### Roles de usuario

El sistema maneja dos roles principales:

| Rol | Acceso |
|---|---|
| **Administrador** | Acceso total — puede crear usuarios, calcular nómina, modificar parámetros |
| **Supervisor** | Puede registrar novedades y consultar nómina, sin acceso a configuración avanzada |

---

## 3. Dashboard

El **Dashboard** es la pantalla de inicio. Muestra un resumen del estado operativo en tiempo real:

| Indicador | Descripción |
|---|---|
| **Empleados activos** | Total de empleados con estado activo en el sistema |
| **Ausencias del mes** | Número de ausencias registradas en el mes actual |
| **Accidentes del mes** | Número de accidentes registrados en el mes actual |
| **Período activo** | Nombre del período de nómina abierto actualmente |

También muestra:
- **Últimas ausencias:** tabla con las 8 ausencias más recientes
- **Resumen por tipo:** distribución de ausencias por categoría (ausencia, permiso, incapacidad, etc.)
- **Accesos rápidos:** botones para las acciones más frecuentes

---

## 4. Empleados

### Acceder

Menú lateral → **Empleados**

### Qué puede hacer

- **Ver la lista** de todos los empleados con su nombre, documento, cargo, área, turno y estado
- **Registrar un empleado nuevo** haciendo clic en **+ Nuevo empleado**
- **Ver el detalle** de un empleado haciendo clic en su nombre
- **Dar de baja** a un empleado (cambia su estado a inactivo)

### Campos al registrar un empleado

| Campo | Descripción |
|---|---|
| Nombre y apellido | Nombre completo |
| Tipo y número de documento | CC, TI, CE, NIT |
| Cargo | Posición en la empresa |
| Área | Departamento o sección |
| Fecha de ingreso | Fecha de inicio del contrato |
| Turno | Tipo de turno asignado (Mañana, Tarde, Noche, 11h) |
| Salario base | IBC mensual en pesos |
| Teléfono y correo | Datos de contacto (opcionales) |

> **Nota:** El salario base es el IBC que se usa para calcular las deducciones de seguridad social.

---

## 5. Contratos

### Acceder

Menú lateral → **Contratos**

### Qué puede hacer

Gestionar los contratos laborales de cada empleado. Un empleado puede tener varios contratos a lo largo del tiempo.

### Tipos de contrato

| Tipo | Descripción |
|---|---|
| **Indefinido** | Sin fecha de terminación pactada |
| **Fijo** | Con fecha de terminación definida |
| **Obra o labor** | Para un proyecto específico |
| **Prestación de servicios** | Contratista independiente |

### Estados del contrato

```
Activo  →  Suspendido  →  Activo
  └─────────────────────→  Terminado (estado final)
```

### Cómo crear un contrato

1. Ir a **Contratos**
2. Hacer clic en **+ Nuevo contrato**
3. Seleccionar el empleado, tipo de contrato, fecha de inicio, cargo y salario base
4. Hacer clic en **Guardar**

### Cambiar el estado de un contrato

1. Localizar el contrato en la tabla
2. Hacer clic en **Cambiar estado**
3. Seleccionar el nuevo estado y confirmar

> **Importante:** El estado **Terminado** es irreversible. Use **Suspendido** para pausas temporales.

---

## 6. Solicitudes

### Acceder

Menú lateral → **Solicitudes**

### Qué es

El módulo de solicitudes permite gestionar las peticiones formales de los empleados (permisos, vacaciones, incapacidades, etc.) con un flujo de aprobación.

### Flujo de una solicitud

```
Pendiente  →  Aprobada  →  Liquidada (en nómina)
           →  Rechazada
```

### Pestañas

| Pestaña | Contenido |
|---|---|
| **Pendientes** | Solicitudes nuevas que requieren decisión |
| **Aprobadas** | Solicitudes aprobadas, pendientes de liquidar |
| **Rechazadas** | Solicitudes denegadas |
| **Liquidadas** | Solicitudes ya incluidas en un cálculo de nómina |

### Aprobar o rechazar una solicitud

1. Ir a la pestaña **Pendientes**
2. Hacer clic en **Aprobar** o **Rechazar** según corresponda
3. Al aprobar, el sistema crea automáticamente un registro de ausencia para ese empleado

> **Nota:** Las solicitudes aprobadas se liquidan automáticamente cuando se calcula la nómina del período que incluye esas fechas.

---

## 7. Ausencias

### Acceder

Menú lateral → **Ausencias**

### Qué puede hacer

Registrar y consultar ausencias individuales de empleados.

### Campos al registrar una ausencia

| Campo | Descripción |
|---|---|
| Empleado | Nombre del empleado |
| Tipo de ausencia | Ausencia, permiso, incapacidad, vacaciones |
| Fecha inicio | Primer día de la ausencia |
| Fecha fin | Último día de la ausencia |
| Observaciones | Notas adicionales (opcional) |

> El tipo de ausencia determina si se descuenta del salario. Ver **Tipos de ausencia** en el módulo de Nómina para la configuración de cada tipo.

---

## 8. Accidentes

### Acceder

Menú lateral → **Accidentes**

### Qué puede hacer

Registrar accidentes de trabajo o incidentes que afecten a los empleados.

### Campos al registrar un accidente

| Campo | Descripción |
|---|---|
| Empleado | Nombre del empleado afectado |
| Fecha del accidente | Fecha en que ocurrió |
| Descripción | Relato del incidente |
| Días de incapacidad | Días resultantes de incapacidad médica |
| Observaciones | Información adicional |

---

## 9. Turnos

### Acceder

Menú lateral → **Turnos**

### Qué puede hacer

Registrar cambios de turno permanentes o temporales para un empleado.

> Este módulo registra el **historial de cambios de turno**. Para la programación diaria por período, use **Nómina → Programación**.

### Campos al registrar un cambio de turno

| Campo | Descripción |
|---|---|
| Empleado | Nombre del empleado |
| Nuevo turno | Turno al que se traslada |
| Fecha efectiva | Desde cuándo aplica el cambio |
| Motivo | Razón del cambio |

---

## 10. Módulo de Nómina

El módulo de nómina contiene todas las herramientas para configurar y calcular la nómina mensual o quincenal.

---

### 10.1 Tipos de turno

**Menú:** Nómina → Tipos de turno

Define los turnos disponibles en la empresa con sus horas y características. MAQUINOR tiene preconfigurados:

| Código | Nombre | Horario | Horas ordinarias |
|---|---|---|---|
| M | Turno Mañana | 6:00 – 14:00 | 8h |
| T | Turno Tarde | 14:00 – 22:00 | 8h |
| N | Turno Noche | 22:00 – 6:00 | 8h nocturnas |
| 11H | Turno 11 Horas | 7:00 – 18:00 | 9h ord. + 2h extra |

Cada tipo de turno especifica cuántas horas son ordinarias, extras, nocturnas o dominicales — información que el motor de nómina usa para liquidar correctamente.

---

### 10.2 Programación

**Menú:** Nómina → Programación

Permite ver y editar el cuadro de programación diaria de todos los empleados para un período específico, indicando para cada día si el empleado trabaja, descansa o tiene algún tipo de ausencia.

Para ver la programación de un período:
1. Ir a **Nómina → Períodos**
2. Hacer clic en **Ver cuadro** en el período deseado

---

### 10.3 Importar descansos desde Excel

**Menú:** Nómina → Períodos → botón **Importar descansos**

Permite cargar el cuadro anual de descansos de MAQUINOR directamente desde el archivo Excel existente, sin necesidad de ingresar los datos manualmente.

#### Formato del archivo Excel

| Fila | Contenido |
|---|---|
| Fila 1 | Nombres de los meses (ENERO, FEBRERO, ...) |
| Fila 2 | Números de día (1, 2, 3, ...) |
| Fila 3 | Día de la semana (L, M, MI, J, V, S, D) |
| Filas 4 en adelante | Datos de empleados |

| Columna | Contenido |
|---|---|
| Columna A | Nombre completo del empleado |
| Columna B | Grupo (1, 2, 3, 4) |
| Celdas de datos | `D` = descanso, `I` = incapacidad, número = horas |

#### Pasos para importar

1. Ir a **Nómina → Períodos**
2. Hacer clic en **Importar descansos** en el período correspondiente
3. Seleccionar el archivo `.xlsx`
4. Hacer clic en **Importar**

El sistema detecta automáticamente el mes según las fechas del período y extrae solo esas columnas. Si hay empleados del Excel que no coincidan con los registrados en el sistema, aparecerán en una lista de **"Empleados no encontrados"** para revisión manual.

> La importación es **idempotente**: ejecutarla varias veces con el mismo archivo no genera registros duplicados.

---

### 10.4 Tipos de ausencia

**Menú:** Nómina → Tipos de ausencia

Configura cómo se trata cada tipo de ausencia en el cálculo de nómina.

| Campo | Descripción |
|---|---|
| Código | Identificador interno (ej: `ausencia`, `incapacidad`) |
| Nombre | Nombre visible al usuario |
| Descuento por día | Porcentaje del salario diario que se descuenta (0% = sin descuento) |
| Activo | Si está disponible para seleccionar al registrar ausencias |

**Configuración predeterminada MAQUINOR:**

| Tipo | Descuento |
|---|---|
| Ausencia | 100% del día |
| Permiso | 0% (sin descuento) |
| Incapacidad (EPS) | 0% (cubierta por EPS) |
| Vacaciones | 0% (remuneradas) |

---

### 10.5 Períodos de nómina

**Menú:** Nómina → Períodos

Un período define el rango de fechas que cubre un cálculo de nómina (mensual, quincenal, etc.).

#### Crear un período

1. Hacer clic en **+ Nuevo período**
2. Ingresar el nombre (ej: "Mayo 2026"), fecha de inicio y fecha de fin
3. Hacer clic en **Crear período**

#### Estados de un período

| Estado | Descripción |
|---|---|
| **Abierto** | Se puede calcular y modificar |
| **Cerrado** | Solo consulta, no se puede recalcular |

#### Acciones disponibles por período

| Botón | Acción |
|---|---|
| **Calcular nómina** | Ejecuta el motor de cálculo para todos los empleados activos |
| **Ver cuadro** | Muestra la programación diaria del período |
| **Importar descansos** | Carga el cuadro de descansos desde Excel |
| **Excel / CSV** | Exporta los resultados del cálculo |
| **Cerrar / Reabrir** | Cambia el estado del período |

---

### 10.6 Calcular nómina

1. Ir a **Nómina → Períodos**
2. Hacer clic en **Calcular nómina** en el período deseado
3. El sistema procesa todos los empleados activos con su programación del período

#### Resultado del cálculo

Una vez terminado, aparece un mensaje con el resultado:

- **Verde:** Nómina calculada exitosamente con el número de empleados procesados
- **Amarillo (advertencias):** El cálculo se completó pero el sistema detectó situaciones a revisar

#### Advertencias posibles

Las advertencias no bloquean el cálculo — son avisos informativos configurables en **Parámetros de nómina**:

| Advertencia | Qué significa |
|---|---|
| Sin contrato activo | El empleado no tiene un contrato en estado activo |
| Salario base en $0 | El empleado tiene IBC de $0, el neto será $0 |
| Período ya calculado | Este período ya tenía resultados — se sobreescriben |
| Sin programación | El empleado no tiene días programados en el período |

> **Importante:** Si el período ya fue calculado y enviado a pago, verifique las advertencias antes de recalcular para evitar inconsistencias.

---

### 10.7 Registros y colillas de pago

**Menú:** Nómina → Registros (o desde el consolidado)

Muestra el detalle del cálculo de cada empleado: días trabajados, horas por categoría, devengos, deducciones y neto a pagar.

#### Imprimir colilla de pago

1. Localizar al empleado en la tabla de registros
2. Hacer clic en el ícono de impresión o en el botón **Colilla**
3. Se abre una ventana con el comprobante listo para imprimir o guardar como PDF

La colilla incluye:
- Datos del empleado (nombre, cargo, período)
- Detalle de horas trabajadas por categoría
- Todos los devengos (ordinario, extras, nocturno, auxilio de transporte, etc.)
- Deducciones (salud, pensión, fondo de solidaridad, descuentos por ausencia)
- **Total neto a pagar**

---

### 10.8 Historial por empleado

**Menú:** Nómina → Historial (o desde el perfil del empleado)

Muestra el historial completo de nómina acumulado de un empleado a través de todos los períodos calculados.

Incluye KPIs acumulados:
- Total devengado histórico
- Total deducciones históricas
- Total neto pagado
- Número de períodos liquidados

También permite imprimir un **certificado de ingresos** con el historial completo.

---

### 10.9 Exportar nómina

Desde **Nómina → Períodos**, cada período tiene dos botones de exportación:

| Formato | Uso recomendado |
|---|---|
| **Excel (.xlsx)** | Para revisión y archivo en contabilidad |
| **CSV** | Para importar en otros sistemas o software contable |

El archivo exportado incluye todos los empleados del período con sus totales de devengos, deducciones y neto.

---

### 10.10 Conceptos de nómina

**Menú:** Nómina → Conceptos

Los conceptos son los componentes del cálculo de nómina: devengos (ingresos) y deducciones (descuentos).

#### Tipos de concepto

| Tipo | Descripción | Ejemplos |
|---|---|---|
| **Devengo** | Suma al salario | Horas extra, auxilio de transporte, bonificaciones |
| **Deducción** | Resta al salario | Salud, pensión, embargo, libranza |

#### Conceptos builtin (no editables)

El motor calcula automáticamente estos conceptos en cada nómina:

| Código | Concepto | Factor |
|---|---|---|
| HORAS_ORD | Horas ordinarias (base SS) | 1.00× |
| HORAS_EXT | Extra diurna | 1.25× |
| HORAS_EXT_DIUR_DOM | Extra diurna dominical | 1.75× |
| HORAS_EXT_NOCT | Extra nocturna | 1.75× |
| HORAS_EXT_NOCT_DOM | Extra nocturna dominical | 2.10× |
| HORAS_NOC | Recargo nocturno | Prima del 35% |
| HORAS_DOM | Recargo dominical diurno | Prima del 75% |
| HORAS_REC_DOM_NOCT | Recargo dominical nocturno | Prima del 110% |
| AUX_TRANS | Auxilio de transporte | Según parámetros |
| DESC_AUSENCIA | Descuento por ausencias | Según tipo de ausencia |

#### Conceptos dinámicos (configurables)

Conceptos adicionales específicos de MAQUINOR que se pueden activar para empleados que apliquen:

| Código | Concepto | Tipo |
|---|---|---|
| BONO_ALIM | Bonificación de alimentación | Devengo |
| PRIMA_SERV | Prima de servicios proporcional | Devengo |
| RODAMIENTO | Rodamiento / Movilización | Devengo |
| SINDICATO | Cuota sindical | Deducción |
| LIBRANZA | Libranza / Crédito empresa | Deducción |
| EMBARGO | Embargo judicial | Deducción |

> Estos conceptos están **inactivos por defecto**. Se activan solo cuando aplican colectivamente. Para descuentos individuales (un solo empleado), gestionar directamente en el registro de nómina.

---

### 10.11 Tasas por grupo/cargo

**Menú:** Nómina → Tasas grupo/cargo

Permite configurar factores multiplicadores de horas extras y recargos diferenciados por **grupo de empleado** o por **cargo**.

MAQUINOR tiene configurados 4 grupos con tasas base legales. Si un grupo o cargo tiene tasas diferentes a las legales mínimas, se editan aquí.

**Prioridad de aplicación:**
1. Regla específica de grupo + cargo
2. Regla solo por grupo
3. Regla solo por cargo
4. Tasas del tipo de turno del empleado

---

### 10.12 Parámetros de nómina

**Menú:** Nómina → Parámetros

Centraliza toda la configuración global del sistema de nómina. Solo los **administradores** pueden modificar estos valores.

#### Parámetros legales (actualizar cada año)

| Parámetro | Valor 2026 | Descripción |
|---|---|---|
| SMMLV mensual | $1.750.905 | Salario mínimo vigente |
| Auxilio de transporte | $249.095 | Valor mensual del auxilio |
| Límite auxilio transporte | 2 × SMMLV | Empleados que ganan hasta este valor reciben el auxilio |

#### Seguridad social — empleado

| Parámetro | Valor | Descripción |
|---|---|---|
| Tasa salud | 4.0% | Aporte de salud del empleado |
| Tasa pensión | 4.0% | Aporte pensional del empleado |
| Fondo de solidaridad | 1.0% | Solo aplica si IBC > 4 × SMMLV |
| Límite solidaridad | 4 × SMMLV | Umbral para cobrar fondo de solidaridad |

#### Códigos de ausencia (catálogo)

Lista de códigos válidos para asignar al programar ausencias en el cuadro de descansos. Permite agregar o eliminar códigos según las necesidades de la empresa.

#### Reglas de validación

Controles automáticos que se ejecutan antes de cada cálculo de nómina. Cada regla se puede activar o desactivar con el toggle:

| Regla | Qué verifica |
|---|---|
| Empleado sin contrato activo | Detecta empleados sin contrato vigente |
| Empleado con salario base cero | Detecta empleados con IBC de $0 |
| Período ya calculado | Avisa si el período tiene registros previos |
| Empleado sin programación | Detecta empleados sin días programados |

Cuando una regla activa detecta una situación, el resultado del cálculo muestra una **advertencia** pero el cálculo se completa normalmente.

---

## 11. Administración

Accesible solo para administradores desde el menú lateral en la sección **Admin**.

---

### 11.1 Usuarios

**Menú:** Admin → Usuarios

Gestión de las cuentas de acceso al sistema.

#### Crear un usuario

1. Hacer clic en **+ Nuevo usuario**
2. Ingresar nombre completo, correo electrónico y contraseña temporal
3. Asignar el rol correspondiente
4. Hacer clic en **Crear**

#### Estados de usuario

| Estado | Descripción |
|---|---|
| **Activo** | Puede iniciar sesión |
| **Inactivo** | No puede iniciar sesión (sin eliminar el registro) |

> Cuando un empleado deja la empresa, **desactivar** su usuario en lugar de eliminarlo para conservar el historial de auditoría.

---

### 11.2 Roles y permisos

**Menú:** Admin → Roles

Define qué acciones puede realizar cada rol en el sistema.

Los roles predeterminados son:
- **admin:** Acceso total
- **supervisor:** Registro de novedades y consulta de nómina

Los permisos se pueden personalizar desde esta pantalla asignando o removiendo permisos específicos a cada rol.

---

### 11.3 Auditoría

**Menú:** Admin → Auditoría

Registro cronológico de todas las acciones realizadas en el sistema: quién hizo qué y cuándo.

Permite filtrar por usuario, tipo de acción o rango de fechas. Útil para:
- Rastrear cambios en la nómina
- Verificar quién aprobó una solicitud
- Revisar modificaciones en la configuración

---

## 12. Parametrización del sistema

Esta sección está dirigida al **administrador** responsable de configurar y mantener el sistema. Cubre todos los parámetros configurables y el orden correcto para realizarlos.

> Solo los usuarios con rol **Administrador** tienen acceso a estas configuraciones.

---

### 12.1 Secuencia de configuración inicial

Al implementar el sistema en una empresa nueva, siga este orden para evitar errores de dependencia:

```
1. Tipos de turno
      ↓
2. Tipos de ausencia (con comportamiento)
      ↓
3. Catálogo de códigos de ausencia
      ↓
4. Parámetros legales (SMMLV, auxilio de transporte)
      ↓
5. Tasas de seguridad social
      ↓
6. Tasas por grupo/cargo (si aplica diferenciación)
      ↓
7. Activar conceptos dinámicos que apliquen
      ↓
8. Activar reglas de validación
      ↓
9. Crear empleados y contratos
      ↓
10. Crear primer período y calcular
```

Completar los pasos 1–8 antes de ingresar empleados garantiza que el motor de nómina tenga toda la información necesaria desde el primer cálculo.

---

### 12.2 Configurar tipos de turno

**Menú:** Nómina → Tipos de turno

Los tipos de turno definen la jornada base de cada grupo de empleados. El motor usa esta configuración para categorizar correctamente las horas trabajadas (ordinarias, nocturnas, extras).

#### Campos de un tipo de turno

| Campo | Descripción | Ejemplo |
|---|---|---|
| **Código** | Identificador corto (máx. 5 caracteres) | `M`, `T`, `N`, `11H` |
| **Nombre** | Nombre descriptivo | Turno Mañana |
| **Hora inicio** | Hora de entrada | 06:00 |
| **Hora fin** | Hora de salida | 14:00 |
| **Horas ordinarias** | Horas ordinarias diurnas de la jornada | 8 |
| **Horas nocturnas** | Horas nocturnas de la jornada (22:00–06:00) | 0 |
| **Horas extra ordinarias** | Horas extras diurnas incluidas en el turno | 0 |
| **Horas extra nocturnas** | Horas extras nocturnas incluidas en el turno | 0 |

#### Cómo crear un tipo de turno

1. Ir a **Nómina → Tipos de turno**
2. Hacer clic en **+ Nuevo tipo de turno**
3. Completar todos los campos
4. Hacer clic en **Guardar**

#### Cómo editar un tipo de turno

1. Hacer clic en el ícono de edición (lápiz) en la fila correspondiente
2. Modificar los campos necesarios
3. Hacer clic en **Guardar**

> **Importante:** Cambiar las horas de un tipo de turno afecta el cálculo de **todos los períodos futuros** que usen ese turno. Los períodos ya calculados no se ven afectados.

#### Configuración MAQUINOR

| Código | Nombre | Horas ord. | Horas noct. | Horas ext. |
|---|---|---|---|---|
| M | Turno Mañana | 8 | 0 | 0 |
| T | Turno Tarde | 8 | 0 | 0 |
| N | Turno Noche | 0 | 8 | 0 |
| 11H | Turno 11 Horas | 9 | 0 | 2 |

---

### 12.3 Configurar tipos de ausencia y comportamiento

**Menú:** Nómina → Tipos de ausencia

Los tipos de ausencia determinan cómo afecta cada novedad al cálculo de nómina. El campo más importante es el **comportamiento**, que le dice al motor de nómina cómo tratar esa ausencia.

#### Comportamientos disponibles

| Comportamiento | Código interno | Efecto en nómina |
|---|---|---|
| **Normal** | `normal` | Descuenta según el porcentaje configurado |
| **Incapacidad** | `disability` | No descuenta salario; excluye el auxilio de transporte |
| **Vacaciones** | `vacation` | No descuenta; pago especial de vacaciones |
| **Licencia remunerada** | `paid_leave` | No descuenta; conserva todos los devengos |

> El comportamiento le indica al motor de cálculo cómo tratar internamente la ausencia, independiente del nombre o código que usted le asigne. Esto permite renombrar tipos de ausencia sin romper el cálculo.

#### Cómo crear un tipo de ausencia

1. Ir a **Nómina → Tipos de ausencia**
2. Hacer clic en **+ Nuevo tipo**
3. Ingresar:
   - **Código:** identificador único en minúsculas sin espacios (ej: `licencia_luto`)
   - **Nombre:** nombre visible para los usuarios (ej: "Licencia de luto")
   - **Descuento por día:** porcentaje del salario diario que se descuenta (0 = sin descuento)
   - **Comportamiento:** seleccionar de la lista según la tabla anterior
4. Hacer clic en **Guardar**

#### Cómo editar un tipo de ausencia

1. Hacer clic en el ícono de edición en la fila
2. Actualizar los campos necesarios
3. Guardar

> **Nota:** Cambiar el comportamiento de un tipo de ausencia afecta cálculos futuros. Si necesita un comportamiento diferente para casos nuevos, cree un tipo nuevo en lugar de modificar uno existente.

#### Configuración predeterminada MAQUINOR

| Código | Nombre | Descuento | Comportamiento |
|---|---|---|---|
| `ausencia` | Ausencia | 100% | Normal |
| `permiso` | Permiso | 0% | Normal |
| `incapacidad` | Incapacidad EPS | 0% | Incapacidad |
| `vacaciones` | Vacaciones | 0% | Vacaciones |
| `licencia_remunerada` | Licencia remunerada | 0% | Licencia remunerada |

---

### 12.4 Configurar catálogo de códigos de ausencia

**Menú:** Nómina → Parámetros → sección "Catálogo de códigos"

El catálogo de códigos es la lista de abreviaturas válidas para el cuadro de programación (el Excel de descansos). El sistema rechaza cualquier código en el archivo Excel que no esté en este catálogo.

#### Códigos predeterminados

| Código | Significado |
|---|---|
| `D` | Descanso |
| `I` | Incapacidad |
| `V` | Vacaciones |
| `P` | Permiso |
| `A` | Ausencia |

#### Agregar un código nuevo

1. Ir a **Nómina → Parámetros**
2. Desplazarse a la sección **Catálogo de códigos de ausencia**
3. Ingresar el nuevo código en el campo de texto
4. Hacer clic en **+ Agregar**

#### Eliminar un código

1. Localizar el código en la lista
2. Hacer clic en el ícono de eliminar (×)

> **Precaución:** Eliminar un código que esté en uso en archivos Excel existentes causará errores al importar esos archivos.

---

### 12.5 Actualizar parámetros legales anuales

**Menú:** Nómina → Parámetros → sección "Parámetros globales"

Cada año, el gobierno colombiano actualiza el SMMLV y el auxilio de transporte. Estos valores deben actualizarse en el sistema antes del primer cálculo del nuevo año.

#### Parámetros a actualizar anualmente

| Parámetro | Clave en sistema | Valor 2026 |
|---|---|---|
| SMMLV mensual | `smmlv` | $1.423.500 |
| Auxilio de transporte | `aux_transporte` | $200.000 |
| Límite auxilio transporte | `limite_aux_transporte` | 2 (× SMMLV) |

#### Cómo actualizar un parámetro

1. Ir a **Nómina → Parámetros**
2. Localizar el parámetro en la tabla
3. Hacer clic en el campo de valor, modificarlo
4. Presionar **Enter** o hacer clic en el ícono de guardar (✓)

> **Importante:** Actualice estos valores **antes** de calcular el primer período del nuevo año. Si ya calculó un período con el valor anterior, ciérrelo, actualice el parámetro y calcule un período nuevo.

---

### 12.6 Configurar tasas de seguridad social

**Menú:** Nómina → Parámetros → sección "Seguridad Social"

Estas tasas se aplican a **todos** los empleados en cada cálculo de nómina. Solo cambian por disposición legal.

| Parámetro | Clave | Valor legal 2026 | Descripción |
|---|---|---|---|
| Tasa de salud | `tasa_salud` | 4.0% | Aporte del empleado a EPS |
| Tasa de pensión | `tasa_pension` | 4.0% | Aporte del empleado a AFP |
| Fondo de solidaridad | `tasa_solidaridad` | 1.0% | Solo aplica si IBC > 4 × SMMLV |
| Umbral solidaridad | `limite_solidaridad` | 4 (× SMMLV) | IBC mínimo para cobrar solidaridad |

> Las tasas del **empleador** (12% salud, 12% pensión, ARL, caja de compensación) no se liquidan en esta aplicación — corresponden a la nómina de prestaciones.

---

### 12.7 Configurar tasas por grupo y cargo

**Menú:** Nómina → Tasas grupo/cargo

Permite definir factores de liquidación diferenciados para grupos de empleados o cargos específicos, cuando la empresa paga tarifas superiores a las legales mínimas.

#### Cómo funciona

El motor busca una regla en este orden de prioridad:

1. **Grupo + Cargo** (regla más específica)
2. **Solo Grupo**
3. **Solo Cargo**
4. **Tipo de turno del empleado** (fallback general)

Si no hay ninguna regla, aplica los factores legales mínimos del CST.

#### Campos de una regla de tasas

| Campo | Descripción |
|---|---|
| **Grupo** | Número de grupo (1–4 para MAQUINOR) o vacío para "todos" |
| **Cargo** | Nombre del cargo o vacío para "todos" |
| **Extra diurna** | Factor multiplicador (legal mínimo: 1.25) |
| **Extra diurna dominical** | Factor multiplicador (legal mínimo: 1.75) |
| **Extra nocturna** | Factor multiplicador (legal mínimo: 1.75) |
| **Extra nocturna dominical** | Factor multiplicador (legal mínimo: 2.10) |
| **Recargo nocturno** | Prima sobre la hora ordinaria (legal: 0.35) |
| **Recargo dominical diurno** | Prima sobre la hora ordinaria (legal: 0.75) |
| **Recargo dominical nocturno** | Prima sobre la hora ordinaria (legal: 1.10) |

#### Cómo crear una regla de tasas

1. Ir a **Nómina → Tasas grupo/cargo**
2. Hacer clic en **+ Nueva regla**
3. Completar grupo, cargo y factores
4. Hacer clic en **Guardar**

> Si todos los grupos pagan las mismas tasas, no es necesario crear reglas — el sistema aplica los valores legales del turno.

---

### 12.8 Activar conceptos dinámicos

**Menú:** Nómina → Conceptos

Los conceptos dinámicos son devengos y deducciones que aplican a un subconjunto de empleados. Están **inactivos por defecto** y se activan solo cuando corresponda.

#### Cuándo activar cada concepto

| Concepto | Código | Tipo | Activar cuando... |
|---|---|---|---|
| Bonificación de alimentación | `BONO_ALIM` | Devengo | La empresa paga bonificación de alimentación mensual |
| Prima de servicios proporcional | `PRIMA_SERV` | Devengo | Se calcula prima proporcional en cada período |
| Rodamiento / Movilización | `RODAMIENTO` | Devengo | Existe reconocimiento de movilización para algunos cargos |
| Cuota sindical | `SINDICATO` | Deducción | La empresa tiene sindicato y hace el descuento directamente |
| Libranza | `LIBRANZA` | Deducción | La empresa descuenta cuotas de crédito directamente del sueldo |
| Embargo judicial | `EMBARGO` | Deducción | Existe orden judicial de embargo para algún empleado |

#### Cómo activar un concepto

1. Ir a **Nómina → Conceptos**
2. Localizar el concepto en la lista
3. Activar el toggle **Activo**
4. En el campo **Valor**, ingresar el monto fijo o el porcentaje según el tipo

> Los conceptos de valor fijo (ej: `BONO_ALIM = $80.000`) aplican igual a todos los empleados incluidos en ese cálculo. Si un empleado específico tiene un valor diferente, ajustar directamente en su registro de nómina después del cálculo.

---

### 12.9 Gestionar reglas de validación

**Menú:** Nómina → Parámetros → sección "Reglas de validación"

Las reglas de validación son controles automáticos que el sistema ejecuta antes de cada cálculo. Cuando se activan, generan **advertencias** en el resultado pero **no bloquean** el cálculo.

#### Reglas disponibles

| Regla | Código | Qué detecta | Cuándo activar |
|---|---|---|---|
| Empleado sin contrato activo | `CHECK_ACTIVE_CONTRACT` | Empleados activos sin contrato vigente | Siempre recomendado |
| Salario base en cero | `CHECK_BASE_SALARY` | Empleados con IBC = $0 | Siempre recomendado |
| Período ya calculado | `CHECK_RECALCULATION` | El período tiene registros previos | Cuando se quiere evitar recálculos accidentales |
| Sin programación en el período | `CHECK_SCHEDULE` | Empleados sin días programados | Cuando la programación es obligatoria antes de calcular |

#### Cómo activar o desactivar una regla

1. Ir a **Nómina → Parámetros**
2. Desplazarse a la sección **Reglas de validación**
3. Hacer clic en el toggle de la regla
4. El cambio se guarda automáticamente

#### Interpretar las advertencias

Después de calcular la nómina, si alguna regla activa detecta una situación, aparece una lista en color ámbar con las advertencias:

```
⚠ Advertencias (2)
   • Juan García: Sin contrato activo
   • Pedro López: Sin programación en el período
```

Estas advertencias deben revisarse antes de cerrar el período. No impiden el cálculo, pero sí indican empleados que posiblemente quedaron mal liquidados.

---

### 12.10 Actualización anual — lista de verificación

Al inicio de cada año fiscal, realice las siguientes actualizaciones antes del primer cálculo:

| # | Tarea | Menú | Notas |
|---|---|---|---|
| 1 | Actualizar SMMLV | Nómina → Parámetros | Valor vigente del 1 de enero |
| 2 | Actualizar auxilio de transporte | Nómina → Parámetros | Valor vigente del 1 de enero |
| 3 | Verificar tasas de SS | Nómina → Parámetros | Confirmar que no cambió la legislación |
| 4 | Revisar tipos de turno | Nómina → Tipos de turno | Agregar o modificar si la empresa cambió jornadas |
| 5 | Revisar tipos de ausencia | Nómina → Tipos de ausencia | Agregar nuevos tipos si aplica (ej: licencia de paternidad) |
| 6 | Revisar tasas por grupo | Nómina → Tasas grupo/cargo | Actualizar si la empresa mejoró las tasas |
| 7 | Verificar contratos activos | Contratos | Asegurarse de que todos los empleados activos tienen contrato |
| 8 | Crear primer período del año | Nómina → Períodos | Establecer fechas correctas del primer mes |

> Este procedimiento toma aproximadamente 15 minutos y evita errores de cálculo durante todo el año.

---

## Glosario

| Término | Significado |
|---|---|
| **IBC** | Ingreso Base de Cotización — el salario mensual sobre el que se calculan los aportes de SS |
| **SMMLV** | Salario Mínimo Mensual Legal Vigente |
| **SS** | Seguridad Social (salud + pensión) |
| **Período** | Rango de fechas que cubre un cálculo de nómina |
| **Devengo** | Ingreso que suma al salario (horas extras, auxilios, bonos) |
| **Deducción** | Descuento que resta al salario (SS, libranzas, embargos) |
| **Neto** | Valor final a pagar al empleado (Devengos − Deducciones) |
| **Recargo** | Prima adicional sobre la hora ordinaria (nocturno, dominical) |
| **Extra** | Hora trabajada fuera de la jornada ordinaria |
| **CST** | Código Sustantivo del Trabajo — ley laboral colombiana |

---

*Manual generado para Novedad App v2.0 — MAQUINOR | Mayo 2026*
