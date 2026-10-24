# Pruebas del backend

- `app.e2e-spec.ts`: marcador original; no valida el funcionamiento del sistema.
- `jest-e2e.json`: configuración original de descubrimiento de pruebas HTTP.
- `requests/`: pruebas reales de HU-01, sus contratos HTTP y PostgreSQL.

Ejecutar `npm run test:hu01` desde backend. El adaptador real pendiente no se
reemplaza en producción; sus dobles existen únicamente en las pruebas.
