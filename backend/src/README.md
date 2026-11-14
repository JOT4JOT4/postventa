# Aplicación

- `main.ts`: `bootstrap(): Promise<void>` crea Nest, restringe CORS con
  `FRONTEND_ORIGIN`, configura validación global y escucha `PORT` (3000 por defecto).
- `app.module.ts`: `AppModule` conecta TypeORM con PostgreSQL mediante variables
  `DATABASE_*` e importa `RequestsModule` y `CasesModule`. No crea tablas automáticamente.
- `database/`: fuente de datos para las migraciones.
- `requests/`: API y lógica de registro HU-01.

Las entradas pasan del controlador al servicio, que consulta el puerto de Ventas
y persiste RECLAMO, metadatos y productos dentro de una transacción, volviendo a
verificar la venta en la misma conexión antes de guardar.

- `positive-id.pipe.ts`: `PositiveIdPipe.transform(value)` recibe un parámetro de ruta de texto o numérico y devuelve un entero entre 1 y 2147483647. Rechaza valores fuera de rango con 400 antes de invocar los servicios. Lo comparten los controladores de compras y casos; depende de las interfaces y excepciones de NestJS.
