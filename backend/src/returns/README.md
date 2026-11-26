# Registro de devoluciones — HU-06

Esta carpeta registra y consulta la devolución de un producto asociada a un caso aprobado. Depende de los casos existentes y de las líneas de compra; no modifica Ventas, Inventario ni Logística.

## Archivos y responsabilidades

| Archivo | Funciones, entradas, retornos y conexiones |
|---|---|
| `create-return.dto.ts` | `CreateReturnDto` valida `purchaseItemId` y `quantity` como enteros positivos de 32 bits, `returnDate` como fecha calendario AAAA-MM-DD y `reason` como texto recortado de 1 a 2000 caracteres. La validación global rechaza campos adicionales. |
| `return.entity.ts` | `ReturnEntity` mapea `devolucion`: identificador generado, caso, línea original, producto canónico, cantidad, fecha y motivo. Depende de `RequestEntity`; la migración establece las referencias externas. |
| `return-reader.ts` | `ReturnRecord` y `ReturnProduct` definen los resultados. `readReturns(manager, caseId)` devuelve registros con compra, cliente y nombre del producto mediante JOIN. `readReturnProducts(manager, caseId)` devuelve únicamente líneas asociadas al caso y coherentes con su venta/cliente, con unidades compradas y aún no devueltas. Ambas retornan promesas y usan parámetros SQL. |
| `inventory-return.gateway.ts` | Adaptador de solo lectura hacia Inventario (HU-07). `findReturnWarehouse` lee `inv_bodegas` (priorizando Bodega Central `id_bodega = 1`) y `findReceptionByReturnId` consulta `inv_movimiento` + `inv_detalles_movimiento` por `id_devolucion` para clasificar el estado en `Pendiente de recepción`, `Recibida apta` o `Recibida con daño`. Respeta `INVENTORY_SCHEMA` cuando se configura para Neon. |
| `returns.service.ts` | `ReturnsService.findForCase(caseId)` verifica existencia y devuelve `{returns, products, warehouse, reception}`. `create(caseId, dto)` bloquea el caso, exige aprobación y ausencia de devolución; serializa operaciones por línea de compra, valida la cantidad disponible, deriva el producto y persiste. Devuelve el registro guardado. Errores ajenos al dominio se ocultan con 503 y se revierte la transacción. |
| `returns.controller.ts` | `ReturnsController` expone GET/POST bajo el caso. Usa `PositiveIdPipe` y el DTO, sin admitir cliente, producto, venta o estado desde el navegador. |
| `returns.module.ts` | `ReturnsModule` conecta controlador, servicio y entidades con TypeORM; lo importa `AppModule`. |

## Contrato de la API de Postventa

- GET `/postventa/solicitudes/:id/devoluciones`: `{returns: ReturnRecord[], products: ReturnProduct[], warehouse: ReturnWarehouse | null, reception: ReturnReception | null}`. Retorna cero o una devolución, las líneas del caso con sus cantidades, la bodega destino sugerida desde Inventario (`inv_bodegas`) y el estado de recepción leído de `inv_movimiento` + `inv_detalles_movimiento`. Permite consultar un registro aunque el caso posteriormente se cierre.
- POST en la misma ruta: `{"purchaseItemId":30,"quantity":1,"returnDate":"2026-11-14","reason":"Piezas faltantes"}`. Responde 201 con `ReturnRecord`.
- 400: entrada inválida, caso sin aprobación, línea no asociada/coherente o cantidad superior a la restante. 404: caso inexistente. 409: el caso ya tiene una devolución. 503: datos no disponibles, sin detalles internos.

## Reglas y trazabilidad

Se sigue la cardinalidad cero o una devolución por caso del diagrama ER: un registro contiene un producto. Un caso con varias líneas permite seleccionar una de ellas para ese registro. Ampliar esta estructura para una devolución con varias líneas requiere revisar el modelo acordado; no se incorpora en esta historia.

El producto se obtiene de `detalle_pedido.id_producto`; no se acepta un identificador de producto independiente que pueda contradecir la compra. La FK compuesta hacia `postventa_registro_producto` conserva la asociación con la línea del caso. `id_devolucion`, `id_reclamo`, `id_producto` y `cantidad` mantienen los nombres del diagrama. `id_detalle_ped` añade trazabilidad a la compra; `fecha_devolucion` y `motivo` completan los criterios de HU-06, ausentes en ese dibujo.

La cantidad positiva no puede superar `detalle_pedido.cantidad` menos las cantidades ya registradas en devoluciones de esa línea, incluso en otros casos. Un bloqueo transaccional asesor por línea evita sobrepasar ese límite en registros simultáneos; el caso se bloquea antes para evitar duplicados y competir correctamente con el cierre. No se escriben tablas externas. La consulta de cantidades es una validación contra la compra, no una gestión de existencias de bodega.

La fecha es ingresada por el encargado y se guarda como DATE, sin desplazamientos por zona horaria. No se inventan plazos de garantía, restricciones de fecha futura, devoluciones totales obligatorias ni necesidad de reembolso. Se requiere estado Aprobado, sin imponer que el tipo inicial del caso sea Devolución.

## Límites de integración

Registrar aquí documenta una devolución autorizada; no confirma recepción física, estado del producto, bodega, stock disponible o pago. No cierra el caso ni añade transiciones. La comunicación con Inventario/Logística y su tratamiento de stock siguen sujetos a los contratos de integración correspondientes.

La migración `1794652801000-CreateProductReturns.ts` crea solo la tabla propia y sus restricciones. La operación requiere una fuente de compra con `detalle_pedido.cantidad`; en Docker ese campo contiene datos ficticios explícitos. No se aplicó la migración ni se validó el flujo contra la base oficial. Autenticación y permisos siguen perteneciendo a su historia específica; el entorno actual es local de desarrollo.
