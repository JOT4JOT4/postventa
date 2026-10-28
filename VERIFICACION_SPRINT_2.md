# Verificación del MVP — Sprint 2

La revisión se realizó sobre la rama `fix/completar-mvp-sprint-2`, creada desde `origin/main`. Los cambios quedan sin commit ni publicación.

## Criterios funcionales

| Tarea | Resultado comprobado |
| --- | --- |
| HU-01 Registrar solicitud | Compra existente, cliente derivado, productos de esa compra, motivo y tipo obligatorios, ID único, estado Abierto e historial inicial en una transacción. |
| HU-03 Clasificar | Los cuatro tipos se seleccionan al registrar, se guardan y se consultan en listado y detalle. Los criterios no exigen reclasificación posterior. |
| HU-04 Gestionar reclamos | Motivo, descripción, estado, cambios válidos, historial básico y resolución final persistida. |
| HU-05 Evaluar | Revisión, aprobación o rechazo persistidos; rechazo con motivo obligatorio; rechazados no pueden reabrirse, aprobarse ni avanzar. Los endpoints no ejecutan operaciones de inventario ni pagos. |
| HU-12 Consultar | Listado y detalle corresponden a PostgreSQL, incluidos tipo y estado; sin tipo histórico se muestra la ausencia de datos. |
| HU-14 Gestionar estados | Flujo permitido, estados terminales y bloqueo transaccional contra actualizaciones concurrentes inconsistentes. |
| HU-17 Validar datos | Campos obligatorios, identificadores válidos y existentes, pertenencia de productos, selección no vacía y sin duplicados, límites de texto, motivo de rechazo y errores visibles. No se añaden cantidades de devolución/cambio porque esas operaciones no están en el alcance. |

## Obligaciones del Sprint 2

| Obligación | Resultado |
| --- | --- |
| Módulo transaccional conectado a BD | Comprobado con PostgreSQL 16 aislado y entorno Docker. |
| Al menos dos formularios de ingreso/consulta | Registro, consulta listado/detalle y formularios de estado/resolución conectados a la API. |
| Diez registros por tabla funcional | Instalación nueva: 10 clientes, 10 pedidos, 10 ventas, 10 productos, 20 detalles, 20 casos, 20 registros de tipo/fecha, 20 productos de caso, 49 eventos y 10 resoluciones. |
| Al menos una validación | Comprobadas varias validaciones en interfaz, DTO, servicios y restricciones SQL. |
| Demostración parcial en clase | Flujo preparado y verificado localmente; la exposición debe realizarla el equipo. |

Los maestros son mínimos y ficticios para la demo local. No se acredita conexión remota con Neon ni integración en vivo con los otros grupos. Las tablas históricas preservadas para migración (`peticion`, `detalle_peticion`) y la tabla técnica de migraciones no forman parte de las tablas funcionales activas.

## Comprobaciones realizadas

- **Backend:** 102 pruebas aprobadas, sin suites omitidas, con `POSTVENTA_TEST_DATABASE_URL` apuntando a una base exclusiva terminada en `_test`.
- **Frontend:** 30 pruebas aprobadas con Vitest.
- Compilación de backend y frontend correcta.
- `lint:check` de backend y `lint` de frontend sin errores; `git diff --check` correcto.
- Ningún archivo de código nuevo o modificado supera 150 líneas.
- PostgreSQL real: registro y rollback, FK, unicidad, evaluación, motivo de rechazo, terminalidad, resoluciones concurrentes y carga inicial repetible.
- Migración de historial: recupera entradas iniciales ausentes sin borrar notas, modificar estados ni duplicar eventos. Si faltan metadatos, deja explícita la falta de fecha inicial.
- Docker: construcción y arranque correctos, nueva carga sobre volumen existente sin eliminarlo.
- Navegador: venta 10, cliente y producto vinculados, registro del caso 100022, descripción, rechazo con motivo, historial inicial y resolución final.
- Reinicio posterior: conserva 21 casos (20 demo y uno de prueba), descripción, motivo de rechazo, 51 eventos y 11 resoluciones. No duplica las filas demo.

Las pruebas de migración muestran mensajes de error esperados al provocar estructuras faltantes, colisiones y referencias no conciliadas. Esos escenarios verifican que se detenga y revierta la migración, y sus pruebas terminaron aprobadas.

## Repetir la comprobación

Seguir `README.md` para levantar Docker. Usar ventas ficticias 10–19, seleccionar al menos un producto, tipo y motivo. Registrar, entrar desde la confirmación o el listado, guardar descripción, pasar a revisión, aprobar/cerrar o rechazar con motivo y registrar la resolución final. Recargar y comprobar el historial.

Ejecutar desde la raíz:

```sh
npm run build --prefix backend
npm run build --prefix frontend
npm run lint:check --prefix backend
npm run lint --prefix frontend
npm test --prefix backend -- --runInBand
npm test --prefix frontend -- --run
```

Sin `POSTVENTA_TEST_DATABASE_URL`, las pruebas PostgreSQL se omiten; consultar `backend/test/requests/README.md` para configurar el destino aislado. No usar una base real del curso para estas pruebas.
