# Pruebas de devoluciones — HU-06

Estas suites verifican el registro y consulta de una devolución aprobada; no usan servicios externos ni la base oficial.

| Archivo | Cobertura y dependencias |
|---|---|
| `return-fixture.ts` | `returnInput` contiene datos ficticios. `createReturnCase(db, status, purchaseItemId)` recibe un DataSource conectado, estado y línea opcionales; inserta un caso y su línea, y devuelve el ID. |
| `returns.http.spec.ts` | Contrato GET/POST con servicio sustituido; campos obligatorios, fechas, cantidades/IDs, motivo, campos ajenos y códigos del dominio. Usa validación global real de Nest. |
| `returns.database.spec.ts` | Servicio real sobre PostgreSQL; producto/compra/cliente, fecha, cantidad acumulada, aprobación, líneas ajenas, consultas tras cierre, restricciones, rollback y migraciones repetidas. |
| `returns-concurrency.database.spec.ts` | Solicitudes simultáneas al mismo caso, cantidades desde casos diferentes de una misma compra y cierre concurrente. Usa conexiones y bloqueos reales. |
| `returns.integration.spec.ts` | Registro inicial, revisión, aprobación, creación y consulta HTTP con PostgreSQL. Reconecta el DataSource para comprobar persistencia. Verifica que el caso y su historial no cambien al devolver. |
| `returns-errors.spec.ts` | Fallos de conexión/transacción convertidos en 503 sin información privada. |

Ejecutar desde backend `npm test -- --runInBand test/returns`. Las suites de base requieren `POSTVENTA_TEST_DATABASE_URL` local y base exclusiva terminada en `_test`; el fixture común crea/elimina solo su esquema temporal. Docker: `docker compose -f compose.test.yaml run --build --rm backend-test` con `POSTGRES_PASSWORD` local definido.
