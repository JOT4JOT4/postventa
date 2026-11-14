# Pruebas de solicitudes de reembolso — HU-10

La carpeta verifica exclusivamente el registro y consulta de reembolsos de Postventa con datos ficticios.

- `refunds.http.spec.ts`: usa `RefundsController`, el pipe y DTO reales con un doble de servicio. Comprueba monto decimal positivo y precisión, campos obligatorios, rechazo de referencias/estado manipulados, IDs, consulta vacía y respuestas 404/409.
- `refunds.database.spec.ts`: usa `RefundsService` y PostgreSQL real aislado. Verifica aprobación, referencias derivadas, monto exacto, fecha/estado, consulta tras cierre, FK, unicidad, creación simultánea, cierre concurrente, rollback y conservación de migraciones.
- `refunds.integration.spec.ts`: crea un caso mediante el servicio de registro, lo evalúa y consume GET/POST de reembolsos por HTTP con persistencia real. Comprueba aprobación previa, referencias y ausencia de cambios en estado/historial del caso por registrar el reembolso.
- `refunds-errors.spec.ts`: comprueba que errores privados de conexión/transacción devuelvan 503 y no se presenten como éxito o lista vacía.

Ejecutar desde backend `npm test -- --runInBand test/refunds`. Para persistencia, usar `POSTVENTA_TEST_DATABASE_URL` hacia la base exclusiva local terminada en `_test`; sin ella esas suites se omiten. Desde la raíz se recomienda `npm run test:docker:backend` y al finalizar `npm run test:docker:down`.

El fixture compartido de `test/requests/database-fixture.ts` registra la entidad y la migración nuevas dentro del esquema temporal de cada suite. No se usan servicios de Finanzas ni bases del curso.
