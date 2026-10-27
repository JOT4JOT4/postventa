# Backend de Postventa

Aplicación NestJS. HU-01 incorpora únicamente el registro de solicitudes. No incorpora
autenticación, seguimiento, evaluación ni operaciones de inventario o finanzas.

## Archivos y ejecución

- `package.json` y `package-lock.json`: dependencias y comandos reproducibles.
- `Dockerfile`: instala dependencias, compila y ejecuta con usuario sin privilegios.
- `.env.example`: nombres de variables para el entorno local; copiar a `.env` si no se usa Docker.
- `tsconfig.json` / `tsconfig.build.json`: compilación estricta del código y exclusión de tests del build.
- `.eslintrc.js`: reglas estáticas. `jest.config.js`: transformación TypeScript y descubrimiento de tests.
- `src/`: arranque, persistencia y registro; `test/`: pruebas aisladas.

Desde la raíz, iniciar primero `docker compose up -d database` y cargar el SQL
compartido aprobado. Luego ejecutar `docker compose up --build`. El arranque aplica
las migraciones pendientes; falla si faltan las tablas externas, sin crearlas. Fuera de Docker:
`npm ci`, configurar `.env`, `npm run migration:run`, `npm run start:dev`.

Verificación: `npm run build`, `npm run lint:check`, `npm run test:hu01`.
El comando antiguo `npm run lint` modifica archivos; `lint:check` solo comprueba.

La aplicación es para desarrollo local; la autenticación corresponde a HU-16 y
debe integrarse antes de exponerla fuera del equipo. El adaptador PostgreSQL ya lee
las relaciones del esquema definitivo. La conexión a la BD real del curso queda
sujeta a sus credenciales, estructuras y disponibilidad; no se ha verificado.
