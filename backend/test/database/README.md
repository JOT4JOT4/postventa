# Pruebas de datos iniciales

`demo.database.spec.ts` valida destinos locales, mínimos de diez registros por tabla funcional, veinte casos, diez resoluciones, repetición concurrente sin duplicados, conservación de cambios y correspondencia venta-cliente-producto. `counts()` devuelve los recuentos de las tablas de una base aislada; recibe indirectamente el `DataSource` creado por `database-fixture.ts`.

Ejecutar `npm test -- --runInBand test/database` desde backend, configurando `POSTVENTA_TEST_DATABASE_URL` como indica `../requests/README.md`. No se usa una base compartida del curso.

`history-migration.database.spec.ts` verifica recuperación repetible de entradas iniciales, preservación de estado/fecha/notas y tratamiento explícito de casos antiguos sin metadatos.
