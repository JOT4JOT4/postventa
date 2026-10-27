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
externos y aplicar `npm run migration:run` desde backend. No se conecta a una BD
remota automáticamente ni se cargan maestros ficticios en el entorno de ejecución.
