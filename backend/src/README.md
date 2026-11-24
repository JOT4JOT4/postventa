# Aplicación

- `main.ts`: `bootstrap(): Promise<void>` crea Nest, restringe CORS con
  `FRONTEND_ORIGIN`, permite cookies, configura validación global y escucha `PORT`
  (3000 por defecto).
- `app.module.ts`: `AppModule` conecta TypeORM con PostgreSQL mediante variables
  `DATABASE_*` e importa autenticación, solicitudes y casos. No crea tablas
  automáticamente.
- `auth/`: valida JWT HS256 emitidos por el login compartido, establece la cookie
  de sesión y protege rutas por rol; requiere `SSO_JWT_SECRET`.
- `database/`: fuente de datos para las migraciones.
- `requests/`: API y lógica de registro HU-01.

Las entradas pasan del controlador al servicio, que consulta el puerto de Ventas
y persiste RECLAMO, metadatos y productos dentro de una transacción, volviendo a
verificar la venta en la misma conexión antes de guardar.
