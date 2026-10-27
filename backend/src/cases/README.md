# Módulo de gestión de reclamos — HU-04

## Archivos

| Archivo | Rol |
|---|---|
| `case.types.ts` | `CaseStatus`: enum de 5 estados. `STATUS_TRANSITIONS`: mapa de transiciones permitidas. `TERMINAL_STATUSES`: `Rechazado` y `Cerrado`. |
| `case-resolution.entity.ts` | Entidad TypeORM para `postventa_resolucion` (1:1 con `reclamo`). |
| `case-history.entity.ts` | Entidad TypeORM para `postventa_historial`; registra cada cambio de estado. |
| `update-case-status.dto.ts` | DTO para `PATCH /:id/estado`: `status` (requerido), `description`, `reason` y `note` (opcionales, recortados). |
| `resolve-case.dto.ts` | DTO para `POST /:id/resolucion`: `resolution` (1–4000 chars). |
| `cases.service.ts` | `findById`, `updateStatus`, `resolve`, `getHistory`. Opera sobre la tabla `reclamo` reutilizando `RequestEntity` sin duplicar la entidad. |
| `cases.controller.ts` | `GET /postventa/solicitudes/:id`, `PATCH /postventa/solicitudes/:id/estado`, `POST /postventa/solicitudes/:id/resolucion`, `GET /postventa/solicitudes/:id/historial`. |
| `cases.module.ts` | Registra `RequestEntity`, `RequestRegistrationEntity`, `RequestItemEntity`, `CaseResolutionEntity` y `CaseHistoryEntity`. |

## Reglas de negocio aplicadas

- La actualización de estado valida las transiciones del BPMN. Los estados `Rechazado` y `Cerrado` son terminales.
- Si solo se edita `description` o `reason` sin cambiar el estado, no se genera una entrada de historial.
- La resolución solo puede registrarse cuando el caso está en estado terminal (`Cerrado` o `Rechazado`) y una sola vez (409 si ya existe).
- El campo `type` se expone en lectura; la reclasificación corresponde a HU-03.

## Migración relacionada

`../database/migrations/1793000000000-AddCaseManagement.ts` agrega `descripcion` a `reclamo`, la restricción `CHECK` de estados, las tablas `postventa_resolucion` y `postventa_historial`, y el evento inicial del historial para cada reclamo existente.
