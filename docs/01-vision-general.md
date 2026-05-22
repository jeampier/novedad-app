# Visión general

## ¿Qué es novedad-app?

novedad-app es un sistema web interno para **MAQUINOR**, empresa del sector metalúrgico. Centraliza la gestión de:

- Novedades del personal (ausencias, accidentes, cambios de turno)
- Programación operativa mensual de horarios
- Cálculo y exportación de nómina

**Problema que resuelve:** antes todo esto se manejaba manualmente en hojas de Excel dispersas, lo que generaba errores en liquidaciones, pérdida de historial y dificultad para auditar cambios.

---

## Usuarios del sistema

| Rol | Qué puede hacer |
|-----|-----------------|
| `admin` | Acceso total: CRUD de usuarios, roles, parámetros de nómina, catálogos |
| `operator` | Registrar novedades (ausencias, accidentes, turnos), programar horarios, ver dashboard |

---

## Módulos actuales

```
Dashboard          → KPIs en tiempo real: empleados, ausencias, accidentes, nómina, programación
Empleados          → Alta, baja y modificación de empleados
Ausencias          → Registro de incapacidades, vacaciones, permisos
Accidentes         → Registro de accidentes laborales con severidad
Turnos             → Cambios de turno con fecha efectiva
Nómina
  ├── Programación   → Cuadro operativo mensual (turno por empleado por día)
  ├── Tipos de turno → Catálogo configurable con horas y multiplicadores
  ├── Tipos ausencia → Catálogo con % de descuento por tipo
  ├── Períodos       → Apertura y cierre de períodos de pago
  ├── Conceptos      → Conceptos dinámicos con fórmulas y reglas
  ├── Consolidado    → Resultados del cálculo por período
  ├── Exportación    → Descarga en Excel o CSV
  └── Parámetros     → Tasas de seguridad social, SMMLV, aux. transporte
Admin
  ├── Usuarios       → CRUD de cuentas de acceso
  ├── Roles          → Gestión de permisos por módulo
  └── Auditoría      → Log de todas las operaciones
```

---

## Estado actual (mayo 2026)

El sistema está en **producción**, con empleados reales de MAQUINOR cargados. Se usa para:

- Programar turnos mensualmente
- Calcular la nómina quincenal/mensual
- Registrar y consultar novedades

---

## Hacia dónde vamos (roadmap)

Ver [Roadmap y pendientes](./10-roadmap.md) para el detalle completo. Los próximos temas son:

1. **Tasas de extras por cargo** — hoy el sistema usa los multiplicadores del turno; el Excel de MAQUINOR los tiene por cargo
2. **Tratamiento recargo vs extra** — alinear con la lógica contable del Excel (recargos pagan prima; extras incluyen base)
3. **Reportes gerenciales** — gráficas de ausentismo y accidentalidad
4. **Módulo de vacaciones** — planificación anual por empleado

---

## Decisiones de diseño clave

| Decisión | Por qué |
|----------|---------|
| Sin ORM (SQL puro) | Control total sobre las queries; el cálculo de nómina requiere precisión decimal |
| Command Bus para mutaciones | Separa lógica de negocio de rutas HTTP; facilita auditoría |
| Motor de nómina como pipeline | Cada paso es independiente y testeable; permite dry-run |
| Parámetros en DB (`payroll_settings`) | Tasas cambian cada año sin necesidad de deploy |
| Repos separados frontend/backend | Deploy independiente en Vercel (frontend) y Render (backend) |
