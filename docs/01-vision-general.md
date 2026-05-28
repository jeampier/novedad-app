# Visión general

## ¿Qué es novedad-app?

novedad-app es un sistema web interno para **MAQUINOR**, empresa del sector metalúrgico. Centraliza la gestión de:

- Novedades del personal (ausencias, accidentes, cambios de turno)
- Contratos laborales de los empleados
- Gestión de solicitudes con flujo de aprobación
- Programación operativa mensual de horarios
- Cálculo y exportación de nómina

**Problema que resuelve:** antes todo esto se manejaba manualmente en hojas de Excel dispersas, lo que generaba errores en liquidaciones, pérdida de historial y dificultad para auditar cambios.

---

## Usuarios del sistema

| Rol | Qué puede hacer |
|-----|-----------------|
| `admin` | Acceso total: CRUD de usuarios, roles, parámetros de nómina, catálogos, cálculo de nómina |
| `supervisor` | Registrar novedades (ausencias, accidentes, turnos, solicitudes), programar horarios, ver dashboard y resultados de nómina |

---

## Módulos actuales

```
Dashboard          → KPIs en tiempo real: empleados, ausencias, accidentes, nómina, programación
Empleados          → Alta, baja y modificación de empleados
Contratos          → Gestión de contratos laborales por empleado con estados y transiciones
Solicitudes        → Flujo de aprobación: Pendiente → Aprobada/Rechazada → Liquidada
Ausencias          → Registro de incapacidades, vacaciones, permisos
Accidentes         → Registro de accidentes laborales con severidad
Turnos             → Cambios de turno con fecha efectiva
Nómina
  ├── Programación      → Cuadro operativo mensual (turno por empleado por día)
  ├── Tipos de turno    → Catálogo configurable con horas y multiplicadores
  ├── Tipos ausencia    → Catálogo con % de descuento y comportamiento en motor
  ├── Períodos          → Apertura y cierre de períodos de pago
  ├── Conceptos         → Conceptos dinámicos con fórmulas y reglas
  ├── Tasas grupo/cargo → Multiplicadores diferenciados por grupo y cargo
  ├── Consolidado       → Resultados del cálculo por período
  ├── Exportación       → Descarga en Excel o CSV
  └── Parámetros        → Tasas de SS, SMMLV, aux. transporte, reglas de validación
Admin
  ├── Usuarios       → CRUD de cuentas de acceso
  ├── Roles          → Gestión de permisos por módulo
  └── Auditoría      → Log de todas las operaciones
```

---

## Estado actual (mayo 2026)

El sistema está en **producción** en Seenode, con empleados reales de MAQUINOR cargados. Se usa para:

- Programar turnos mensualmente
- Calcular la nómina quincenal/mensual
- Registrar y consultar novedades
- Gestionar contratos laborales y solicitudes

**Infraestructura:**
- Frontend: Vercel (auto-deploy desde `frontend/`)
- Backend: Seenode (`https://novedad-api.ddns.net`)
- Base de datos: PostgreSQL en Seenode (`up-de-fra1-postgresql-2.db.run-on-seenode.com:11550`)

---

## Hacia dónde vamos (roadmap)

Ver [Roadmap y pendientes](./10-roadmap.md) para el detalle completo. Los próximos temas son:

1. **Tratamiento recargo vs extra** — alinear con la lógica contable del Excel (recargos pagan prima; extras incluyen base)
2. **Reportes gerenciales** — gráficas de ausentismo y accidentalidad
3. **Módulo de vacaciones** — planificación anual con saldo por empleado

---

## Decisiones de diseño clave

| Decisión | Por qué |
|----------|---------|
| Sin ORM (SQL puro) | Control total sobre las queries; el cálculo de nómina requiere precisión decimal |
| Command Bus para mutaciones | Separa lógica de negocio de rutas HTTP; facilita auditoría |
| Motor de nómina como pipeline | Cada paso es independiente y testeable; permite dry-run |
| Parámetros en DB (`payroll_settings`) | Tasas cambian cada año sin necesidad de deploy |
| `behavior` en `absence_types` | Desacopla nombres de ausencias del motor; permite renombrar sin romper cálculos |
| Repos separados frontend/backend | Deploy independiente en Vercel (frontend) y Seenode (backend) |
| `startup.sh` con migraciones | Seenode ejecuta el script al iniciar; garantiza que prod siempre tenga el esquema actualizado |
