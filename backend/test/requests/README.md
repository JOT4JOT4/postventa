# Verificación HU-01

- `fixtures.ts`: `fictionalPurchase` y `validInput`, exclusivamente ficticios.
- `requests.http.spec.ts`: inicia Nest con controlador/servicio reales y dobles de
  Ventas/persistencia. Comprueba campos, cuatro tipos, IDs, estado inicial, cliente
  derivado, pertenencia, errores, rechazo de campos extra e integración pendiente.
- `requests.database.spec.ts`: usa PostgreSQL real y el DDL de la migración; verifica
  lectura posterior, concurrencia, FK, restricciones y rollback de la cabecera si
  falla el detalle. Crea un esquema temporal `hu01_test_*` y lo elimina al terminar.

`npm run test:hu01` ejecuta HTTP; omite explícitamente PostgreSQL si no se define
`POSTVENTA_TEST_DATABASE_URL`. Para ambas suites, proporcionar una URL PostgreSQL
de pruebas cuyo nombre de base termine en `_test`, por ejemplo en una instancia
Docker aislada. Nunca apuntar a una base compartida o de producción. Se requiere
permiso para crear y eliminar el esquema temporal. No se cargan maestros reales.

## Resultado de verificación — 24/10/2026

34 pruebas de HU-01 aprobadas: 30 HTTP y 4 PostgreSQL, sin omisiones en la ejecución
con una instancia Docker temporal. Se comprobó que un detalle duplicado provoca
un fallo real de restricción y revierte también la cabecera.
La compilación del backend y su lint sin correcciones automáticas pasaron.
Las seis pruebas de frontend, su compilación y su lint también pasaron.

El arranque Docker aplicó la migración; la API real devolvió 503 al consultar y
registrar con Ventas pendiente y 400 para campos inválidos. El recuento de
`peticion` permaneció en cero. Se comprobó visualmente el aviso y el botón bloqueado.
Esto no acredita una integración con Ventas: el camino exitoso usa un doble de esa
dependencia únicamente en pruebas, con persistencia real en la suite PostgreSQL.
