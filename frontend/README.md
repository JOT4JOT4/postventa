# Interfaz de Postventa

`src/` contiene la aplicación React. `test/` verifica el registro sin servicios reales.

- `package.json` / `package-lock.json`: dependencias y scripts reproducibles.
- `Dockerfile`: entorno local Vite con Node 24 y usuario sin privilegios.
- `index.html`: documento raíz, idioma español, título y metadatos del registro.
- `.env.example`: URL pública del backend; nunca incluir secretos en `VITE_*`.
- `vite.config.ts`: plugin React; `vitest.config.ts`: entorno jsdom y preparación de tests.
- `tailwind.config.js` / `postcss.config.js`: estilos base originales.
- `eslint.config.js`: análisis estático. `tsconfig*.json`: comprobación estricta y compilación.

Inicio recomendado desde la raíz: `docker compose up --build`.
Alternativa local: `npm ci`, configurar `VITE_API_BASE_URL` y `npm run dev`.
Verificación: `npm run build`, `npm run lint`, `npm test`.

Vitest, Testing Library y jsdom se incorporan solo para probar comportamiento y
accesibilidad del formulario. No forman parte de las dependencias de ejecución.
