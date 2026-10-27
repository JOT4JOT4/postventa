# Pruebas de interfaz

- `setup.ts`: carga comparadores DOM y limpia el documento después de cada prueba.
- `registration.test.tsx`: comprueba compra obligatoria, datos compartidos no disponibles,
  selección de productos, POST correcto, confirmación de ID/estado, invalidación
  de datos al cambiar compra y fallos de red. Las compras son ficticias y `fetch`
  se reemplaza solo dentro de las pruebas.
- `case-management.test.tsx`: vista de gestión de HU-04; incluye el tipo ausente
  mostrado como "Sin tipo registrado".
- `case-list.test.tsx` (HU-12): listado con ID, tipo y estado obtenidos de `fetch`,
  tipo y fecha ausentes sin valores inventados, enlace al detalle, badges sin región
  viva, lista vacía, error con Reintentar y fallo de red.
- `app-navigation.test.tsx` (HU-12): el formulario como inicio, enlaces de la `<nav>`,
  listado → detalle → volver, acceso directo a `#/casos/:id`, redirección desde
  `?caseId=` y "Página no encontrada" para rutas o IDs inválidos.

Ejecutar `npm test` desde frontend. No necesita un backend ni una base de datos.
