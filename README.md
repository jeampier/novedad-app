# Novedad App

Sistema de novedades de empleados para empresa metalurgica.

## Stack
- Frontend: React + Vite → deploy en Vercel
- Backend:  Node.js + Express → deploy en Render
- Base de datos: PostgreSQL en Neon

## Estructura
```
novedad-app/
├── frontend/          React (Vercel)
│   └── src/
│       ├── api/       client.js + dispatch()
│       ├── context/   AuthContext
│       ├── hooks/     useCommand
│       └── pages/     absences / accidents / shifts / employees
└── backend/           Node.js + Express (Render)
    └── src/
        ├── commands/  commandBus + registro de comandos
        ├── handlers/  un handler por comando
        ├── repositories/ queries a PostgreSQL
        ├── routes/    REST + ruta /api/commands
        ├── middleware/ auth JWT
        └── db/        client pg + migrate.js
```

## Arrancar en local

### 1. Base de datos
Crea un proyecto en https://neon.tech y copia la DATABASE_URL.

### 2. Backend
```bash
cd backend
cp .env.example .env   # pega tu DATABASE_URL y JWT_SECRET
npm install
npm run migrate        # crea las tablas
npm run dev            # corre en puerto 3001
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env.local  # VITE_API_URL=http://localhost:3001/api
npm install
npm run dev                 # corre en puerto 5173
```

## Deploy

### Render (backend)
1. Nuevo Web Service → conecta el repo → root: backend
2. Variables de entorno: DATABASE_URL, JWT_SECRET, FRONTEND_URL

### Vercel (frontend)
1. Importa el repo → root: frontend
2. Variable de entorno: VITE_API_URL=https://tu-backend.onrender.com/api

## Comandos disponibles
| Comando           | Payload requerido                        |
|-------------------|------------------------------------------|
| RegisterAbsence   | employeeId, type, startDate              |
| RegisterAccident  | employeeId, date, description            |
| ChangeShift       | employeeId, newShift, effectiveDate      |
| OnboardEmployee   | name, document, position                 |
| OffboardEmployee  | employeeId, endDate                      |
