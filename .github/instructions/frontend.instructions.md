---
name: Instrucciones de frontend
description: Convenciones para el código de interfaz React, TypeScript, Vite y Tailwind CSS.
applyTo: "frontend/**/*.{ts,tsx,js,jsx}"
---

# Frontend: React, TypeScript, Vite y Tailwind CSS

- Usa componentes funcionales y hooks de React.
- Mantén TypeScript estricto; evita `any` y supresiones de errores sin justificación.
- Sigue la estructura y las convenciones ya existentes; no impongas una estructura nueva sin necesidad.
- Mantén los componentes enfocados y extrae lógica reutilizable cuando simplifique el código.
- Gestiona estados de carga, error, éxito y ausencia de datos.
- Usa HTML semántico, labels, foco visible, navegación por teclado y diseños responsive.
- Aplica Tailwind CSS según la versión instalada y evita estilos duplicados innecesarios.
- Organiza las llamadas HTTP y los tipos compartidos según la arquitectura del proyecto.
- No inventes endpoints ni estructuras de respuesta; confirma el contrato real del backend.
- Usa variables `VITE_*` solo para configuración pública; nunca incluyas secretos en el bundle.
- Añade o actualiza pruebas cuando haya infraestructura de pruebas de frontend disponible.
- Ejecuta los scripts de lint, pruebas y build definidos por el proyecto cuando corresponda.

Nota: ajusta `applyTo` si el frontend no se encuentra dentro de la carpeta `frontend/`. Por ejemplo, para un frontend en `client/`, usa `client/**/*.{ts,tsx,js,jsx}`.
