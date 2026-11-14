# Persistencia

El modelo activo de esta base de trabajo es el local del Sprint 2: `reclamo`,
`postventa_registro`, `postventa_registro_producto`, `postventa_historial` y
`postventa_resolucion`. Las entidades no fijan un esquema externo; las pruebas
pueden utilizar su esquema temporal exclusivo. La correspondencia con los esquemas
del ERP se acuerda durante Sprint 3; no se aplica desde esta preparación.

- `database-options.ts`: `databaseOptions(read)` recibe una función de lectura de
  variables y devuelve opciones PostgreSQL para aplicación y migraciones. Exige
  host, base, usuario y contraseña; valida puerto y SSL. Los errores solo indican
  nombres de variables. Local usa SSL desactivado por defecto; remoto exige SSL
  con certificado verificado, salvo selección explícita de `DATABASE_SSL=false`.
  No crea conexiones, tablas ni datos.

- `data-source.ts`: exporta el `DataSource` PostgreSQL, lee `DATABASE_*` y descubre
  entidades y migraciones con rutas relativas, tanto en `src` como en `dist`.
- `registration-upgrade.ts`: `ensureSharedSchema(runner)` comprueba las estructuras
  externas sin crearlas; `ensureCaseTable(runner)` conserva o crea RECLAMO y prepara
  sus FK y generador de IDs; `copyLegacyRequests(runner)` valida y copia solicitudes
  antiguas sin borrarlas. Las funciones reciben el QueryRunner de la migración y
  retornan `Promise<void>`; cualquier inconsistencia revierte la operación.
- `migrations/`: DDL y actualización versionados.

`synchronize` permanece desactivado. Cargar primero el SQL aprobado de los módulos
externos y aplicar `npm run migration:run` desde backend. El modo de demostración local carga maestros mínimos ficticios de forma explícita; el adaptador de la aplicación siempre consulta la base configurada.

- `demo-runner.ts`: `validateDemoTarget(environment)` restringe datos ficticios a hosts locales y nombres de base permitidos. `loadDemoData(db, mode)` recibe un `DataSource` conectado y `prepare` o `seed`, lee el SQL correspondiente y lo ejecuta dentro de una transacción con bloqueo asesor. Devuelve `Promise<void>` y propaga errores para revertir la carga. El ejecutable solo actúa con `POSTVENTA_DEMO_DATA=true`; no imprime credenciales.
- `../../database/demo/cases.sql`: semilla local de casos y su trazabilidad; se ejecuta después de migrar. Ver documentación de esa carpeta.

Para HU-06, `demo-runner.ts` procesa `cases.sql`, `refunds.sql` y `returns.sql`, en ese orden, durante `seed`. El modo `prepare` extiende únicamente el esquema ficticio local con cantidades de compra, sin sobrescribir valores existentes. La migración de devoluciones no modifica esa tabla externa.
