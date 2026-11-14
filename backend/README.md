# Backend de Postventa — base local del Sprint 2

Aplicación NestJS con registro y clasificación, consulta de casos, evaluación por estados, historial básico y resolución. No implementa autenticación ni ejecuta cambios de producto, devoluciones de inventario o reembolsos financieros.

## Organización y archivos

- `src/`: arranque y módulos `requests`, `cases`, `database`, cada uno con documentación de funciones y conexiones.
- `test/`: pruebas HTTP, de reglas, PostgreSQL, migraciones y configuración; documentación por carpeta.
- `database/demo/`: semilla ficticia del alcance local; no sustituye datos del ERP.
- `package.json` y `package-lock.json`: dependencias y comandos reproducibles.
- `Dockerfile`: target `app` para el servidor compilado y `test` para ejecutar Jest con PostgreSQL aislado.
- `.dockerignore`: excluye entornos privados, dependencias y compilados del contexto.
- `.env.example`: variables de conexión local y origen del frontend. No contiene una contraseña funcional.
- `tsconfig.json` / `tsconfig.build.json`: TypeScript estricto y exclusión de tests del build.
- `.eslintrc.js`: análisis estático; `jest.config.js`: transformación y descubrimiento de tests.

## Arranque

Usar el README de raíz: preparar `.env` y ejecutar `docker compose up --build -d --wait`.
Compose prepara maestros mínimos ficticios, aplica las migraciones locales y carga los casos de demostración. Conserva el volumen y repite la carga sin duplicar ni sobrescribir casos.

Fuera de Docker: instalar con `npm ci`, completar `.env`, preparar una base local con los antecedentes ficticios y ejecutar `npm run migration:run` antes de `npm run start:dev`. El procedimiento detallado está en la raíz; la base de Docker no publica puerto.

Servidor y migraciones comparten `src/database/database-options.ts`. Requiere `DATABASE_HOST`, `DATABASE_NAME`, `DATABASE_USER` y `DATABASE_PASSWORD`; puerto 5432 por defecto. `DATABASE_SSL=false` en Docker local; si se activa SSL, se verifica el certificado. Los errores de configuración no muestran valores privados.

El modelo local usa `reclamo` y tablas `postventa_*`; las entidades no fijan un esquema remoto. Las migraciones de esta versión no adaptan los esquemas compartidos de otros equipos. No se ha acreditado conexión a la base real del curso.

## Verificación

Desde la raíz: `npm run test:docker:backend`; al terminar, `npm run test:docker:down`.
Fuera de Docker: `npm run build`, `npm run lint:check`, `npm test -- --runInBand`, con `POSTVENTA_TEST_DATABASE_URL` hacia una base local exclusiva terminada en `_test` para incluir persistencia. Sin ella se omiten esas suites.

`npm run lint` del backend conserva corrección automática; `lint:check` no modifica archivos. El comando de lint de la raíz utiliza la variante de comprobación.

Esta aplicación debe permanecer en desarrollo local con datos ficticios mientras no se implemente la identidad y los permisos de su sprint.

La construcción predeterminada del Dockerfile termina en el target `app`. El target `test` se selecciona explícitamente desde `compose.test.yaml`; construir la aplicación directamente no ejecuta las pruebas en lugar del servicio.
