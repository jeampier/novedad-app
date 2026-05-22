# Configuración local

## Requisitos previos

- Node.js 18+
- PostgreSQL 14+ (local o acceso a Neon)
- Git

---

## 1. Clonar los repositorios

El proyecto tiene **dos repositorios separados**: uno para backend y otro para frontend.

```bash
# Clonar en una carpeta común
mkdir novedad-app && cd novedad-app

git clone git@github.com:jeampier/novedad-app-backend.git backend
git clone git@github.com:jeampier/novedad-app-frontend.git frontend
```

---

## 2. Configurar el backend

```bash
cd backend
npm install
```

Crear el archivo `.env`:
```
PORT=3001
DATABASE_URL=postgresql://novedad_user:novedad_pass@localhost/novedad_db
JWT_SECRET=novedad_jwt_secret_2024_seguro
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### Crear la base de datos local

```bash
# Crear usuario y base de datos en PostgreSQL
psql -U postgres -c "CREATE USER novedad_user WITH PASSWORD 'novedad_pass';"
psql -U postgres -c "CREATE DATABASE novedad_db OWNER novedad_user;"
```

### Ejecutar migraciones en orden

```bash
npm run migrate              # Tablas base: users, employees, absences, accidents, shifts
npm run migrate:admin        # Roles, permisos, login_history, audit_log
npm run migrate:payroll      # shift_types, payroll_periods, payroll_records, work_schedule
npm run migrate:concepts     # payroll_concepts, payroll_rules, concept_execution_logs
npm run migrate:employees    # Mejoras a la tabla employees (first_name, last_name, etc.)
npm run migrate:smmlv        # Columna smmlv en employees
npm run migrate:hours        # Categorías de horas adicionales en shift_types
npm run migrate:absence-types      # absence_types con % descuento
npm run migrate:absence-catalog    # absence_code_catalog
npm run migrate:schedule-import    # period_id en work_schedule
```

### Cargar parámetros iniciales de nómina

```bash
npm run seed:settings        # Carga tasas 2026: SMMLV, aux. transporte, tasas SS
```

### Crear usuario administrador (primera vez)

```bash
node -e "
require('dotenv').config()
const { pool } = require('./src/db/client')
const bcrypt = require('bcryptjs')
bcrypt.hash('tu_password', 10).then(hash => {
  pool.query(
    'INSERT INTO users (email, password, role, full_name) VALUES (\$1, \$2, \$3, \$4)',
    ['admin@novedad.com', hash, 'admin', 'Administrador']
  ).then(() => { console.log('Admin creado'); pool.end() })
})
"
```

### Iniciar el backend

```bash
npm run dev     # Con nodemon (recarga automática)
npm start       # Sin recarga
```

El backend queda disponible en `http://localhost:3001`.

---

## 3. Configurar el frontend

```bash
cd ../frontend
npm install
```

Crear el archivo `.env`:
```
VITE_API_URL=http://localhost:3001/api
```

### Iniciar el frontend

```bash
npm run dev
```

El frontend queda disponible en `http://localhost:5173`.

---

## 4. Verificar que todo funciona

```bash
# Verificar que PostgreSQL acepta conexiones
pg_isready -h localhost -U novedad_user -d novedad_db

# Verificar que el backend responde
curl http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@novedad.com","password":"tu_password"}'
```

---

## Scripts disponibles

### Backend

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia con nodemon (recarga al guardar) |
| `npm start` | Inicia sin recarga |
| `npm run migrate` | Migración base |
| `npm run migrate:*` | Migración específica por módulo |
| `npm run seed:settings` | Carga parámetros de nómina |
| `npm run seed:employees-excel` | Importa empleados desde Excel |

### Frontend

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo Vite |
| `npm run build` | Build de producción |
| `npm run preview` | Previsualiza el build de producción |

---

## Convenciones de commits

Cada repo tiene su propio git. Siempre hacer commit desde la carpeta correspondiente:

```bash
# Para cambios en el backend
cd backend
git add src/routes/dashboard.js
git commit -m "feat: descripción del cambio"
git push origin main

# Para cambios en el frontend
cd frontend
git add src/pages/DashboardPage.jsx
git commit -m "feat: descripción del cambio"
git push origin main
```

**Nunca** hacer commit desde la carpeta raíz (`novedad-app/`).

---

## Deploy

- **Frontend:** Vercel detecta el push a `main` del repo frontend y hace deploy automático.
- **Backend:** Render detecta el push a `main` del repo backend y hace deploy automático.
- **Base de datos:** Neon (PostgreSQL serverless). Las migraciones se ejecutan manualmente contra la DB de producción.
