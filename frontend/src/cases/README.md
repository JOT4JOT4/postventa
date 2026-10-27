# Módulo de Frontend: Gestión de reclamos (HU-04)

Este módulo implementa la interfaz de usuario para la visualización, gestión y resolución de casos de postventa, siguiendo los mockups 3 y 4 del proyecto.

## Archivos

| Archivo | Responsabilidad |
|---|---|
| `case-api.ts` | Contrato de API, tipos TypeScript y funciones de consumo (`getCase`, `updateStatus`, `resolveCase`, `getCaseHistory`). |
| `use-case-management.ts` | Hook personalizado que orquesta el ciclo de vida, estado de formulario, llamadas a la API y sincronización del historial. |
| `CaseStatus.tsx` | Componente de badge de estado con estilos semánticos acordes al estado (`Abierto`, `En revisión`, `Aprobado`, `Rechazado`, `Cerrado`). |
| `CaseHistory.tsx` | Línea de tiempo lateral que muestra los eventos cronológicos de cambio de estado y notas de bitácora. |
| `CaseManagement.tsx` | Vista principal de gestión: datos generales (con `type` en modo solo lectura por límite con HU-03), edición de descripción, actualización de estados permitidos y formulario de resolución final. |
| `case-management.css` | Hoja de estilos responsiva integrada con la paleta visual del proyecto (`#202b44`, `#bb1237`). |

## Reglas de interacción

- **Límite con HU-03:** El tipo de solicitud (`type`) registrado en HU-01 se presenta únicamente como lectura (`readonly-tag`). No se incluye selector ni capacidad de reclasificación.
- **Transiciones de estado:** Solo se listan en el selector los estados válidos según el estado actual del caso (`STATUS_TRANSITIONS`). Si el caso alcanza un estado terminal (`Rechazado` o `Cerrado`), el formulario de cambio de estado se bloquea.
- **Resolución final:** Se habilita exclusivamente cuando el caso está en estado terminal (`Rechazado` o `Cerrado`). Una vez registrada, se muestra en solo lectura protegiendo la inmutabilidad de la resolución y alimentando el cálculo del MTTR (KPI 3).
- **Navegación:** Enrutamiento ligero mediante el parámetro `?caseId=` en la URL gestionado en `App.tsx`, con soporte para historial de navegación (botón atrás/adelante del navegador).
