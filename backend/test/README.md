# Pruebas del backend

- `app.e2e-spec.ts`: marcador original; no valida el funcionamiento del sistema.
- `jest-e2e.json`: configuración original de descubrimiento de pruebas HTTP.
- `requests/`: pruebas reales de HU-01, sus contratos HTTP y PostgreSQL.

Ejecutar `npm run test:hu01` desde backend. Las pruebas HTTP aisladas usan dobles;
las suites de integración usan el adaptador real y tablas ficticias de prueba
en PostgreSQL. No se conecta al ERP real del curso durante estas verificaciones.
