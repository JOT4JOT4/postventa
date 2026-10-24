# Persistencia

`data-source.ts` exporta un `DataSource` de TypeORM para PostgreSQL. Lee `DATABASE_*`
desde el entorno y descubre entidades y migraciones con rutas relativas al propio
archivo, tanto en `src` como en el resultado compilado `dist`.

`migrations/` contiene el DDL versionado. `synchronize` permanece desactivado.
Aplicar con `npm run migration:run` desde backend; en Docker se aplica al arrancar.
No ejecutar migraciones sobre una base compartida sin revisar los acuerdos del grupo.
