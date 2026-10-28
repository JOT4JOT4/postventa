# Pruebas del backend

- `app.e2e-spec.ts`: marcador original; no valida el funcionamiento del sistema.
- `jest-e2e.json`: configuración original de descubrimiento de pruebas HTTP.
- `requests/`: pruebas reales de HU-01, sus contratos HTTP y PostgreSQL.
- `cases/`: pruebas de HU-04 (`cases.*.spec.ts`) y HU-12:
  - `case-list.http.spec.ts`: contrato de `GET /postventa/solicitudes` con dobles
    (lista, lista vacía, 503) y ocultamiento del error del motor en `findAll`.
  - `case-list.database.spec.ts`: controlador y servicio reales sobre PostgreSQL
    vía HTTP. Comprueba lista vacía, valores y orden guardados, tipo/fecha `null`
    sin registro, cambios en la BD reflejados, coincidencia con el detalle y 404.

Ejecutar `npm run test:hu01` y `npm test -- test/cases` desde backend. Las pruebas HTTP aisladas usan dobles;
las suites de integración usan el adaptador real y tablas ficticias de prueba
en PostgreSQL. No se conecta al ERP real del curso durante estas verificaciones.

- `database/`: verificación de la carga de datos ficticios y protección del destino local.
- `cases/README.md`: detalla las regresiones de evaluación, concurrencia y errores.
