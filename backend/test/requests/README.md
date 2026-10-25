# Verificación HU-01 con el esquema compartido

- `fixtures.ts`: compra y entrada de ejemplo, exclusivamente ficticias.
- `shared-schema.fixture.ts`: `createSharedFixture(db)` crea solo en pruebas las
  columnas compartidas que consume HU-01 y datos ficticios de dos clientes. No es
  el SQL de producción ni una implementación de los módulos externos.
- `database-fixture.ts`: `openTestDatabase(prefix)` abre un esquema temporal en una
  BD cuyo nombre termina en `_test`, registra entidades y migraciones;
  `closeTestDatabase(db)` elimina únicamente ese esquema y cierra la conexión.
  `databaseSuite` omite estas suites si no se define la URL de pruebas.
- `requests.http.spec.ts`: contrato HTTP, validación, cuatro tipos, ID, estado,
  errores seguros y rechazo de campos manipulados con dobles aislados.
- `requests.database.spec.ts`: adaptador real, transacciones, concurrencia, FK,
  pertenencia de productos, lectura posterior y rollback.
- `migration.database.spec.ts`: copia de casos anteriores, conservación de IDs,
  adopción de RECLAMO existente y rechazo seguro de colisiones, tablas ausentes
  o clientes inconsistentes.
- `registration.integration.spec.ts`: flujo GET y POST mediante HTTP con el
  adaptador real y PostgreSQL, sin sustituir Ventas por un doble. Usa únicamente
  las tablas ficticias del fixture que reproducen los campos consumidos del diagrama.

Ejecutar `npm run test:hu01` desde backend. Para ejecutar también las suites de BD,
configurar `POSTVENTA_TEST_DATABASE_URL` con una instancia PostgreSQL de pruebas
Docker aislada y un nombre de BD terminado en `_test`. Se crean y eliminan esquemas
temporales `hu01_*`. No apuntar a la base compartida ni a producción.

Esta verificación demuestra compatibilidad con las estructuras del diagrama;
no acredita conexión a la base real del curso ni validación de scripts SQL aún no recibidos.

## Verificación del 25/10/2026

- 46 pruebas del backend aprobadas con PostgreSQL Docker aislado, sin omisiones.
- Seis pruebas del frontend aprobadas; compilación y lint de ambas aplicaciones correctos.
- Docker compiló y arrancó aplicando ambas migraciones sobre los fixtures ficticios.
- En el navegador se cargó la venta ficticia 10, se identificó al cliente 20 y se
  registró un caso de tipo Cambio con dos líneas. La consulta posterior a PostgreSQL
  confirmó ID 1, estado Abierto y dos productos vinculados.
- No se modificaron ni conectaron bases del curso. El entorno temporal se retira
  tras verificarlo; solo queda la evidencia visual fuera del repositorio.
