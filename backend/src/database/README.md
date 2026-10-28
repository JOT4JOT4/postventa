# Persistencia

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
