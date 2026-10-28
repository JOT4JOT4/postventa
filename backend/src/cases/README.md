# Módulo de gestión de reclamos — HU-04

## Archivos

| Archivo | Rol |
|---|---|
| `case.types.ts` | `CaseStatus`: enum de 5 estados. `STATUS_TRANSITIONS`: mapa de transiciones permitidas. `TERMINAL_STATUSES`: `Rechazado` y `Cerrado`. |
| `case-resolution.entity.ts` | Entidad TypeORM para `postventa_resolucion` (1:1 con `reclamo`). |
| `case-history.entity.ts` | Entidad TypeORM para `postventa_historial`; registra cada cambio de estado. |
| `update-case-status.dto.ts` | DTO para `PATCH /:id/estado`: `status` (requerido), `description`, `reason` y `note` (opcionales, recortados; `note` obligatorio si se rechaza). |
| `resolve-case.dto.ts` | DTO para `POST /:id/resolucion`: `resolution` (1–4000 chars). |
| `cases.service.ts` | `findAll` (HU-12), `findById`, `updateStatus`, `resolve`, `getHistory`. Opera sobre la tabla `reclamo` reutilizando `RequestEntity` sin duplicar la entidad. |
| `cases.controller.ts` | `GET /postventa/solicitudes` (HU-12), `GET /postventa/solicitudes/:id`, `PATCH /postventa/solicitudes/:id/estado`, `POST /postventa/solicitudes/:id/resolucion`, `GET /postventa/solicitudes/:id/historial`. |
| `cases.module.ts` | Registra `RequestEntity`, `RequestRegistrationEntity`, `RequestItemEntity`, `CaseResolutionEntity` y `CaseHistoryEntity`. |

## Reglas de negocio aplicadas

- La actualización de estado valida el flujo definido en `case.types.ts`. Los estados `Rechazado` y `Cerrado` son terminales.
- Si solo se edita `description` o `reason` sin cambiar el estado, no se genera una entrada de historial.
- La resolución solo puede registrarse cuando el caso está en estado terminal (`Cerrado` o `Rechazado`) y una sola vez (409 si ya existe).
- HU-03 se cumple al seleccionar y guardar uno de los cuatro tipos durante el registro, y consultarlo posteriormente. Los criterios no exigen reclasificación.

## Consulta de casos — HU-12

`GET /postventa/solicitudes` no recibe parámetros ni pagina. Responde 200 con un arreglo
(vacío si no hay casos) de `{ id, type, status, createdAt, purchaseId, customerId }`.
`findAll()` usa una sola consulta `reclamo LEFT JOIN postventa_registro`, ordenada por
`fecha_registro` descendente (sin fecha al final) e `id_reclamo` descendente.
`type` y `createdAt` son `null` cuando el caso no tiene fila en `postventa_registro`
(por ejemplo, filas de `reclamo` previas a Postventa); no se completan con valores
supuestos. Si la BD falla responde 503 con un mensaje genérico, sin detalles internos.
El detalle de cada caso se obtiene con el `GET /postventa/solicitudes/:id` existente.

## Migración relacionada

`../database/migrations/1793000000000-AddCaseManagement.ts` agrega `descripcion` a `reclamo`, la restricción `CHECK` de estados, las tablas `postventa_resolucion` y `postventa_historial`, y el evento inicial del historial para cada reclamo existente.

## Separación de responsabilidades

- `cases.service.ts`: fachada inyectable que recibe `DataSource`; mantiene los métodos del controlador y delega lectura y escritura.
- `case-reader.ts`: `CaseReader.findAll()` devuelve resúmenes; `findById(id)` devuelve detalle; `getHistory(id)` devuelve eventos cronológicos. Recibe `DataSource`, devuelve promesas y convierte fallos del motor en 503.
- `case-detail.ts`: `loadCaseDetail(manager, id)` reúne caso, tipo, productos y resolución. Recibe el administrador de la consulta o transacción; devuelve el detalle o lanza 404.
- `case-writer.ts`: `CaseWriter.updateStatus(id, dto)` bloquea el caso con `FOR UPDATE`, valida el cambio y guarda estado e historial atómicamente; devuelve el detalle. `resolve(id, dto)` aplica el mismo bloqueo, conserva una única resolución y devuelve su fecha y texto; un duplicado recibe 409.
- `case-rules.ts`: `validateCaseUpdate(current, next, note)` valida terminalidad, transición y motivo obligatorio de rechazo; no devuelve datos, lanza 400 si incumple una regla.

La evaluación utiliza el cambio a `Aprobado` o `Rechazado` y el historial para persistir el resultado. En un rechazo, la nota contiene el motivo obligatorio. Los casos rechazados no pueden reabrirse ni aprobarse. Estos endpoints no ejecutan movimientos de inventario ni pagos.
Las ediciones de datos y la resolución también están protegidas por el bloqueo del caso. Una consulta fallida del historial devuelve 503 sin exponer SQL.
