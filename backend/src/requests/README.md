# Registro de solicitudes — HU-01

## Relación con el esquema definitivo

Se lee `venta.id_venta → pedido.id_pedido → cliente.id_cliente` para identificar
al cliente, y `detalle_pedido.id_detalle_ped → inv_producto.id_producto` para
mostrar los productos y validar que pertenecen al pedido de la venta.
Los nombres SQL son minúsculos sin comillas, la convención de PostgreSQL para
los nombres VENTA, PEDIDO, CLIENTE y DETALLE_PEDIDO del diagrama. No se crea ni
modifica ninguna tabla de Ventas, CRM o Inventario.

`reclamo` conserva los cinco campos del diagrama: `id_reclamo`, `id_venta`,
`id_cliente`, `motivo` y `estado`. El diagrama no representa el tipo ni la
selección de productos que exige HU-01. Para conservarlos se agregan dos tablas
auxiliares **propias de Postventa**: `postventa_registro` y
`postventa_registro_producto`. Son una extensión explícita del diagrama, necesaria
para esos criterios, y deben incorporarse a su documentación compartida.
No representan la ejecución de un cambio, devolución o reembolso.

## Archivos

| Archivo | Funciones, entradas, salidas y dependencias |
| --- | --- |
| `request.types.ts` | `RequestType`: cuatro tipos. `INITIAL_STATUS`: Abierto. `Purchase`: proyección interna de venta, cliente y líneas. `PurchaseGateway.findById(id, manager?)` retorna la compra o null; acepta el administrador de la transacción de registro. |
| `database-purchase.gateway.ts` | `DatabasePurchaseGateway.findById` consulta las tablas compartidas con parámetros SQL. Dentro del registro bloquea en modo compartido las filas de venta, pedido, cliente, detalle y producto hasta terminar la transacción. Si la BD falla responde 503 sin detalles internos. |
| `create-request.dto.ts` | `CreateRequestDto`: valida ID entero positivo de venta, 1–100 líneas distintas, tipo y motivo de 1–2000 caracteres. Recorta espacios. Los límites son técnicos. |
| `request.entity.ts` | `RequestEntity`: los cinco campos de `reclamo`; su ID se genera en PostgreSQL. |
| `request-registration.entity.ts` | `RequestRegistrationEntity`: tipo y fecha, vinculados uno a uno por `id_reclamo`. |
| `request-item.entity.ts` | `RequestItemEntity`: selección de líneas en `postventa_registro_producto`, mediante `id_detalle_ped`, sin duplicar maestros. |
| `requests.service.ts` | `purchaseContext(id, manager?)`: carga venta o devuelve 404. `create(dto)`: vuelve a verificar la compra dentro de una transacción, deriva cliente, valida pertenencia y guarda caso, metadatos y líneas. Retorna ID, tipo, fecha y estado. |
| `requests.controller.ts` | `RequestsController`: expone únicamente el contexto de compra y el registro. |
| `requests.module.ts` | `RequestsModule`: registra entidades y conecta `PurchaseGateway` con el adaptador PostgreSQL. |

## API interna compatible

- `GET /postventa/compras/:id`: recibe **id_venta**, no id_pedido; devuelve `Purchase`.
- `POST /postventa/solicitudes`: cuerpo
  `{"purchaseId":10,"purchaseItemIds":[30],"type":"Reclamo","reason":"Faltan piezas."}`.
  `purchaseId` representa `id_venta`; `purchaseItemIds` contiene `id_detalle_ped`.
  Los números del ejemplo son ficticios; no se cargan en la aplicación.
- Respuesta 201: `id` (id_reclamo), `purchaseId`, `customerId`, `purchaseItemIds`,
  `type`, `reason`, `status`, `createdAt`. El contrato del frontend se conserva.
- 400: datos inválidos o productos ajenos; 404: venta ausente;
  503: estructuras/BD no disponibles o fallo de escritura. Cliente y estado
  nunca se aceptan del navegador. Sin datos compartidos no se inventan compras.

La autenticación, aprobación, seguimiento, KPIs y operaciones financieras o de
inventario pertenecen a otras historias y no se implementan aquí. La disponibilidad
de una venta no implica aplicar reglas de garantía, despacho u otras políticas
que no están especificadas en HU-01.
