# Pruebas de interfaz

- `setup.ts`: carga comparadores DOM y limpia el documento después de cada prueba.
- `registration.test.tsx`: comprueba compra obligatoria, datos compartidos no disponibles,
  selección de productos, POST correcto, confirmación de ID/estado, invalidación
  de datos al cambiar compra y fallos de red. Las compras son ficticias y `fetch`
  se reemplaza solo dentro de las pruebas.

Ejecutar `npm test` desde frontend. No necesita un backend ni una base de datos.
