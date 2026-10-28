# Pruebas de casos

Todas usan `CasesController` o `CasesService`; los datos son ficticios.

- `cases.http.spec.ts`: contratos de detalle, historial y resolución; verifica 404, texto obligatorio y duplicado 409.
- `case-status.http.spec.ts`: validación HTTP de estados, longitudes, valores nulos, motivo obligatorio al rechazar y errores seguros 400/503.
- `cases.database.spec.ts`: persistencia real de descripción, estados, historial cronológico y resolución única.
- `case-concurrency.database.spec.ts`: aprobación/rechazo persistidos, terminalidad y bloqueo de operaciones concurrentes con PostgreSQL. Comprueba que no se reabra un rechazado y que resoluciones simultáneas devuelvan un éxito y un 409.
- `case-errors.spec.ts`: fallo asíncrono al consultar historial convertido en 503 sin revelar información SQL.
- `case-list.http.spec.ts`: listado, lista vacía y error seguro de lectura.
- `case-list.database.spec.ts`: listado y detalle HTTP contra PostgreSQL, orden y valores ausentes.

Ejecutar `npm test -- --runInBand test/cases` desde backend. Las suites PostgreSQL requieren `POSTVENTA_TEST_DATABASE_URL` apuntando a una base exclusiva terminada en `_test`; crean y eliminan solo sus esquemas temporales. Sin esa variable se omiten y no prueban persistencia.

- `case-flow.database.spec.ts`: flujo HTTP real para cada uno de los cuatro tipos, registro, consulta, rechazo inválido, evaluación, historial y resolución única con PostgreSQL.
