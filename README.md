# Módulo de Postventa — MVP Sprint 2

Aplicación React y TypeScript con API NestJS, TypeORM y PostgreSQL. Implementa el registro y clasificación inicial de solicitudes, consulta de casos, gestión de reclamos, evaluación mediante estados, historial y resolución final. El alcance corresponde a HU-01, HU-03, HU-04, HU-05, HU-12, HU-14 y HU-17 indicadas por el equipo.

El registro consulta `venta → pedido → cliente` y `detalle_pedido → inv_producto`. Deriva el cliente desde la compra y verifica que los productos seleccionados pertenezcan a ella. Guarda el caso en `reclamo`, su tipo y fecha en `postventa_registro`, y sus productos en `postventa_registro_producto`. El historial inicial se guarda en la misma transacción. Los tipos son Reclamo, Cambio, Devolución y Reembolso; el estado inicial es Abierto.

## Inicio local con Docker

1. Copiar `.env.example` a `.env` en la raíz y definir una contraseña local en `POSTGRES_PASSWORD`.
2. Ejecutar `docker compose up --build -d`.
3. Abrir `http://localhost:5173`. La API está en `http://localhost:3001`.
4. Consultar una venta de demostración entre **10 y 19**, seleccionar productos, tipo y motivo, y registrar.
5. Abrir **Solicitudes**, entrar al detalle y probar descripción, revisión, evaluación, historial y resolución final.

Docker prepara maestros mínimos ficticios, aplica las migraciones y carga casos ficticios. No depende de recibir una conexión remota de otros grupos para esta demostración. El adaptador de la aplicación sí consulta PostgreSQL y valida las relaciones; no fabrica compras ante una consulta fallida.

La secuencia también se ejecuta con el volumen existente. **No es necesario ejecutar `docker compose down -v`.** La carga conserva filas existentes y no duplica casos. Para detener los servicios conservando los datos, usar `docker compose down`.

`POSTVENTA_API_PORT` y `POSTVENTA_WEB_PORT` permiten cambiar puertos desde `.env`. Se publican solo en la interfaz local; PostgreSQL no expone puerto al equipo. Docker utiliza una base llamada `postventa`; esto no significa que exista un esquema SQL llamado `postventa`, ni acredita conexión con Neon.

## Datos iniciales del Sprint 2

| Tabla funcional | Registros en una instalación nueva |
| --- | ---: |
| cliente | 10 |
| pedido | 10 |
| venta | 10 |
| inv_producto | 10 |
| detalle_pedido | 20 |
| reclamo | 20 |
| postventa_registro | 20 |
| postventa_registro_producto | 20 |
| postventa_historial | 49 |
| postventa_resolucion | 10 |

Son datos ficticios identificados como tales. Los casos de demostración usan IDs `100001–100020`, los cuatro tipos y los cinco estados. Los primeros diez están cerrados y tienen resolución. Los recuentos pueden aumentar con la utilización de los formularios. Los archivos históricos `peticion`/`detalle_peticion` y la tabla interna de migraciones quedan fuera del modelo funcional activo; se conservan sin duplicar registros.

`shared-schema.sql` es una representación mínima para la prueba local, no la implementación completa de Ventas, CRM ni Inventario. La conexión real del ERP requiere sus estructuras y configuración acordadas. La semilla está restringida a destinos locales y requiere `POSTVENTA_DEMO_DATA=true`; Docker activa ese modo de demostración explícitamente.

## Reglas y respuestas

- Registro: compra existente, uno a cien detalles distintos pertenecientes a ella, identificadores enteros positivos, tipo definido y motivo obligatorio de hasta 2000 caracteres. Cliente, ID y estado no los impone el navegador.
- Clasificación: el tipo se selecciona al registrar, se almacena y se consulta en listado/detalle. No se requiere una funcionalidad adicional de reclasificación.
- Estados: Abierto → En revisión o Rechazado; En revisión → Aprobado, Rechazado o Cerrado; Aprobado → Cerrado. Rechazado y Cerrado son terminales.
- Evaluación: aprobar o rechazar persiste el resultado en el caso y en su historial. Rechazar exige una nota con el motivo. Un rechazo impide volver a revisión, aprobar o avanzar el caso.
- Resolución: texto obligatorio de hasta 4000 caracteres, una sola vez, cuando el caso esté Cerrado o Rechazado. La resolución documenta la atención; no procesa pagos ni movimientos de inventario.
- Escrituras: las operaciones sobre un mismo caso se serializan en PostgreSQL; los errores revierten la transacción.
- HTTP: 400 ante datos o transiciones inválidos; 404 para referencias inexistentes; 409 si ya existe resolución; 503 ante indisponibilidad de persistencia. Los mensajes se muestran en español sin detalles internos del motor.

El registro selecciona líneas compradas y no solicita cantidades de devolución/cambio. Por eso no se añade un campo para ejecutar operaciones que corresponden a otras historias. Se valida la cantidad de líneas seleccionadas (mínimo una, máximo cien, sin duplicados).

## Desarrollo y pruebas

Requisitos fuera de Docker: Node.js 20 o superior, npm 10 o superior y PostgreSQL 15 o superior. Instalar con `npm ci --prefix backend` y `npm ci --prefix frontend`. Configurar los `.env` de ambas aplicaciones según sus ejemplos; no versionar secretos.

Para preparar una base **local de demostración** desde backend: configurar `DATABASE_*` y `POSTVENTA_DEMO_DATA=true`, ejecutar `npm run demo:prepare`, `npm run migration:run`, `npm run demo:seed`, y luego `npm run start:dev`. Para datos reales, no activar el modo demo; aplicar los scripts acordados y las migraciones sobre el destino autorizado. `synchronize` permanece desactivado.

```sh
npm run build --prefix backend
npm run build --prefix frontend
npm run lint:check --prefix backend
npm run lint --prefix frontend
npm test --prefix backend -- --runInBand
npm test --prefix frontend -- --run
```

Las pruebas de PostgreSQL requieren `POSTVENTA_TEST_DATABASE_URL` apuntando a una base exclusiva cuyo nombre termine en `_test`. Sin ella se omiten; una ejecución sin fallos con pruebas omitidas no acredita persistencia. Las suites crean y eliminan únicamente sus esquemas temporales. El script original `lint` del backend modifica archivos: para comprobar usar `lint:check`.

## Organización

- `backend/src/requests/`: registro y adaptador de lectura de compras.
- `backend/src/cases/`: consultas, reglas de evaluación, cambios de estado, historial y resolución.
- `backend/src/database/`: conexión y migraciones versionadas; ejecutor protegido de datos demo.
- `backend/database/demo/`: SQL de casos ficticios.
- `backend/test/`: pruebas HTTP, transaccionales, concurrencia y datos iniciales.
- `frontend/src/requests/`: formulario de registro.
- `frontend/src/cases/`: listado, detalle y formularios de gestión.
- `frontend/test/`: pruebas de interacción y navegación.
- `compose.yaml`: entorno local reproducible; `backend/Dockerfile` incluye el ejecutor y SQL demo; el frontend conserva su entorno Vite.
- `shared-schema.sql`: maestros mínimos ficticios, inserciones repetibles sin sobrescribir filas existentes.

Cada carpeta incluye documentación de sus archivos y conexiones.

## Comprobación para la demostración

Se dispone de formulario de registro, listado de consulta y formularios de gestión conectados a la API. Para mostrar el flujo parcial: registrar un caso, abrirlo en Solicitudes, pasar a En revisión, aprobar o rechazar con motivo, consultar el historial y registrar la resolución en un estado terminal.

La exposición del flujo en clase es una actividad del equipo; no se considera realizada por disponer del código. La integración remota con el ERP del curso debe validarse con los demás grupos. Autenticación/permisos, ejecución de devoluciones/cambios/reembolsos, indicadores y dashboards no se amplían como parte de esta corrección del Sprint 2.
