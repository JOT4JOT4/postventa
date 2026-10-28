# Módulo de Frontend: Gestión de reclamos (HU-04)

Este módulo implementa la interfaz de usuario para la visualización, gestión y resolución de casos de postventa, siguiendo los mockups 3 y 4 del proyecto.

## Archivos

| Archivo | Responsabilidad |
|---|---|
| `case-api.ts` | Contrato de API, tipos TypeScript y funciones de consumo (`listCases`, `getCase`, `updateStatus`, `resolveCase`, `getCaseHistory`). `CaseSummary` es el elemento del listado de HU-12. |
| `use-case-management.ts` | Hook personalizado que orquesta el ciclo de vida, estado de formulario, llamadas a la API y sincronización del historial. |
| `use-case-list.ts` | `useCaseList()` (HU-12): carga el listado al montar y devuelve `{ cases, loading, error, reload }`. |
| `CaseList.tsx` | Vista de consulta (HU-12): tabla con ID, tipo, estado, fecha de registro, compra, cliente y enlace "Ver detalle" a `#/casos/:id`. Estados de carga, error con Reintentar y lista vacía. |
| `case-list.css` | Estilos de la tabla, el estado vacío y el encabezado del listado. |
| `CaseStatus.tsx` | Componente de badge de estado con estilos semánticos acordes al estado (`Abierto`, `En revisión`, `Aprobado`, `Rechazado`, `Cerrado`). El prop opcional `live` (por defecto `true`) añade `role="status"`; el listado lo desactiva para no crear una región viva por fila. |
| `CaseHistory.tsx` | Línea de tiempo lateral que muestra los eventos cronológicos de cambio de estado y notas de bitácora. |
| `CaseManagement.tsx` | Vista principal de gestión: datos generales (con el tipo seleccionado durante el registro), edición de descripción, actualización de estados permitidos y formulario de resolución final. |
| `case-management.css` | Hoja de estilos responsiva integrada con la paleta visual del proyecto (`#202b44`, `#bb1237`). |

## Reglas de interacción

- **Clasificación HU-03:** El tipo de solicitud (`type`) registrado en HU-01 se presenta únicamente como lectura (`readonly-tag`). No se incluye selector ni capacidad de reclasificación. Si el caso no tiene tipo registrado, se muestra "Sin tipo registrado" en el detalle y en el listado, sin suponer un valor.
- **Transiciones de estado:** Solo se listan en el selector los estados válidos según el estado actual del caso (`STATUS_TRANSITIONS`). Si el caso alcanza un estado terminal (`Rechazado` o `Cerrado`), el formulario de cambio de estado se bloquea.
- **Resolución final:** Se habilita exclusivamente cuando el caso está en estado terminal (`Rechazado` o `Cerrado`). Una vez registrada, se muestra en solo lectura protegiendo la inmutabilidad de la resolución.
- **Navegación:** Enrutamiento por hash gestionado en `App.tsx` (`#/casos` para el listado y `#/casos/:id` para el detalle), con soporte para atrás/adelante del navegador. Los enlaces antiguos `?caseId=N` se redirigen a `#/casos/N`.

## Componentes y estilos separados

- `CaseManagement.tsx`: recibe `caseId` y `onBack` opcional; muestra carga/errores y compone las secciones con el estado de `useCaseManagement`.
- `CaseInformation.tsx`: recibe `caseDetail`; presenta tipo, motivo y líneas compradas sin modificar maestros.
- `CaseStatusForm.tsx`: recibe `management` del hook; permite editar descripción y estado. Exige `Motivo del rechazo` cuando se selecciona `Rechazado`; llama `saveStatusAndDetails()`.
- `CaseResolutionForm.tsx`: recibe `management`; registra o muestra una resolución final mediante `registerResolution()`, únicamente con estado terminal.
- `use-case-management.ts`: recibe ID del caso y devuelve datos, historial, estados de carga, campos y acciones. Evita envíos simultáneos con una referencia compartida y valida el motivo de rechazo antes de contactar la API.
- `case-management.css`: importa los estilos de gestión; no contiene lógica.
- `case-layout.css`: cabecera, navegación y presentación del caso.
- `case-cards.css`: cuadrícula, tarjetas e información general.
- `case-forms.css`: entradas, botones y presentación de resoluciones.
- `case-history.css`: línea de tiempo y avisos de carga/error.
- `case-responsive.css`: adaptación de columnas y espaciados a pantallas pequeñas.

Todos los componentes devuelven elementos React; sus datos provienen de los contratos de `case-api.ts`. La API valida nuevamente las reglas aunque se omita el formulario.
