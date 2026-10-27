# Entrada de la interfaz

- `main.tsx`: monta `App` en el nodo raíz con `StrictMode` e importa estilos base.
- `App.tsx`: componente raíz con navegación por hash, sin dependencias de enrutamiento.
  Muestra una `<nav>` con "Registrar solicitud" (`#/`) y "Casos" (`#/casos`) y elige la vista:
  - hash vacío o `#/` → `RegistrationForm` (página de inicio);
  - `#/casos` → `CaseList`;
  - `#/casos/:id` (entero 1–2147483647) → `CaseManagement`, cuyo botón volver lleva a `#/casos`;
  - cualquier otra ruta → "Página no encontrada", sin consultar el backend.

  Escucha `hashchange`, por lo que atrás/adelante del navegador funcionan. Los enlaces
  anteriores `?caseId=N` se reemplazan al cargar por `#/casos/N`.
- `index.css`: estilos originales de Tailwind y tipografía base.
- `vite-env.d.ts`: tipos de Vite para la configuración pública `import.meta.env`.
- `requests/`: formulario, estado, llamadas HTTP y estilos propios de HU-01.
- `cases/`: gestión (HU-04) y consulta (HU-12) de casos.
