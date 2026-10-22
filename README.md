# E-commerce de microservicios

Modelo inicial de un proyecto con:

- `backend/`: API base con NestJS, TypeScript, PostgreSQL y TypeORM.
- `frontend/`: aplicación base con React, TypeScript, Vite y Tailwind CSS.

La estructura deja preparada la separación por servicios para una siguiente etapa,
sin agregar todavía entidades, migraciones ni endpoints de negocio.

## Requisitos

- Node.js 20 o superior.
- npm 10 o superior.
- PostgreSQL 15 o superior para ejecutar el backend con persistencia.

## Instalación

```powershell
npm install --prefix backend
npm install --prefix frontend
```

Copiar los archivos `.env.example` como `.env` en cada aplicación y ajustar sus
valores locales. No se deben versionar archivos `.env`.

## Desarrollo

En terminales separadas:

```powershell
npm run dev:backend
npm run dev:frontend
```

El backend queda disponible en `http://localhost:3000` y el frontend en
`http://localhost:5173`.

## Verificación

```powershell
npm run build
npm run lint
```

La configuración de TypeORM mantiene `synchronize` desactivado. Las migraciones
se agregarán cuando exista el primer modelo de dominio.
