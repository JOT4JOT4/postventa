# Módulo de Postventa

Modelo inicial de un proyecto con:

- `backend/`: API base con NestJS, TypeScript, PostgreSQL y TypeORM.
- `frontend/`: aplicación base con React, TypeScript, Vite y Tailwind CSS.

La base inicial se amplía únicamente con HU-01: registrar una solicitud asociada
a una compra, su cliente y al menos un producto. Se guarda el tipo, motivo,
identificador autogenerado y estado inicial **Abierto**.

El registro usa las relaciones del esquema definitivo: VENTA → PEDIDO → CLIENTE
y DETALLE_PEDIDO → inv_producto. El caso se guarda en RECLAMO. El adaptador
consulta PostgreSQL directamente; requiere las tablas compartidas y sus datos.
No crea maestros ajenos ni incorpora compras ficticias en la aplicación.
El tipo y los productos seleccionados se conservan en dos tablas auxiliares propias
de Postventa porque el diagrama no representa esos datos obligatorios de HU-01.

## Inicio con Docker (recomendado)

1. Copiar `.env.example` a `.env` en la raíz y definir `POSTGRES_PASSWORD`.
2. Iniciar la base con `docker compose up -d database`.
3. Importar el SQL compartido aprobado (Ventas, CRM e Inventario) en esa base. No se incluye un sustituto de esos scripts.
4. Ejecutar `docker compose up --build`.
5. Abrir `http://localhost:5173`. Backend en Docker: `http://localhost:3001`.

`compose.yaml` coordina PostgreSQL, backend y frontend. La base no expone un puerto
al equipo; las aplicaciones se publican solo en la interfaz local. Los datos se
conservan en el volumen `postventa-data`. Detener con `docker compose down`, sin
eliminar el volumen. No es una configuración de publicación ni de producción.
La autenticación y permisos corresponden a otra historia y siguen pendientes.
Los puertos se pueden cambiar con `POSTVENTA_API_PORT` y `POSTVENTA_WEB_PORT` en
el `.env` raíz. Docker usa 3001 para evitar el servicio que ya ocupa el 3000;
las URLs y CORS se ajustan conjuntamente. La ejecución local sin Docker conserva 3000.

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

Para HU-01: `npm run test:hu01 --prefix backend` y `npm test --prefix frontend`.
Comprobación sin modificar el backend: `npm run lint:check --prefix backend`.
El script original de lint del backend contiene `--fix` y puede modificar archivos.

TypeORM mantiene `synchronize` desactivado. La nueva migración conserva los casos
antiguos y prepara RECLAMO y las tablas auxiliares con FK a venta, cliente y detalle
del pedido. Docker la aplica al iniciar; si faltan las tablas compartidas, se detiene
sin crearlas ni sustituirlas. En ejecución local, configurar `backend/.env` para
la BD acordada y ejecutar `npm run migration:run --prefix backend` antes de arrancar.

## Organización y alcance

- `backend/`: API, servicio transaccional, entidades, migración y pruebas.
- `frontend/`: formulario de registro y pruebas de interacción.
- Cada carpeta modificada incluye documentación de sus archivos y conexiones.
- Los `package.json`/`package-lock.json` de la raíz conservan los comandos globales.
- `.env.example` documenta la contraseña local de Docker; `.gitignore` excluye valores locales y dependencias.

La documentación técnica y los requisitos del adaptador están en
`backend/src/requests/README.md`; el detalle de la migración está en
`backend/src/database/migrations/README.md`.
No se implementan consulta/seguimiento de casos, aprobaciones, historial, KPIs,
adjuntos, movimientos de inventario ni procesamiento de reembolsos.
