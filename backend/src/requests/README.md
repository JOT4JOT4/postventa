# Registro de solicitudes — HU-01

## Archivos

| Archivo | Responsabilidad, entradas y salida |
| --- | --- |
| `request.types.ts` | `RequestType`: cuatro tipos acordados. `INITIAL_STATUS`: Abierto. `Purchase`: proyección interna de compra/cliente/líneas. `PurchaseGateway.findById(id)`: devuelve compra o null. No es un contrato externo acordado. |
| `pending-purchase.gateway.ts` | `PendingPurchaseGateway.findById(id)`: responde 503 mientras Ventas esté pendiente; nunca devuelve datos ficticios. |
| `create-request.dto.ts` | `CreateRequestDto`: valida compra entera positiva, entre 1 y 100 líneas distintas, tipo permitido y motivo no vacío de hasta 2000 caracteres. Recorta espacios exteriores. Los límites son técnicos. |
| `request.entity.ts` | `RequestEntity`: mapea propiedades TypeScript a columnas españolas de `peticion`. ID generado por PostgreSQL. |
| `request-item.entity.ts` | `RequestItemEntity`: vínculo de la petición con cada línea comprada y relación local con la cabecera. |
| `requests.service.ts` | `purchaseContext(id)` obtiene compra o devuelve 404. `create(dto)` comprueba pertenencia de líneas, deriva cliente, guarda todo en una transacción y retorna ID, datos y estado. Si falla la escritura devuelve 503 sin detalles internos. |
| `requests.controller.ts` | `RequestsController`: publica los dos endpoints de apoyo al registro. Delega al servicio. |
| `requests.module.ts` | `RequestsModule`: registra entidades, controlador, servicio y adaptador pendiente. |

## API interna

- `GET /postventa/compras/:id`: contexto mínimo para rellenar el formulario;
  respuesta `Purchase`. No implementa búsqueda de compras, reglas de garantía ni HU-02 completa.
- `POST /postventa/solicitudes`: cuerpo
  `{"purchaseId":10,"purchaseItemIds":[30],"type":"Reclamo","reason":"Faltan piezas."}`.
  Los números son un ejemplo ficticio, no datos cargados. Responde 201 con
  `id`, `purchaseId`, `customerId`, `purchaseItemIds`, `type`, `reason`, `status`, `createdAt`.
- 400: campos inválidos, propiedades adicionales o líneas ajenas; 404: compra ausente;
  503: integración pendiente o fallo de escritura. Cliente y estado no se aceptan del navegador.

## Pendiente de Ventas

Implementar `PurchaseGateway` cuando llegue el esquema o API acordado y sustituir
solo su proveedor en `RequestsModule`. Debe mapear los IDs reales de venta, cliente,
detalle del pedido y producto a `Purchase`, sin administrar ni copiar maestros.
Debe acordarse también qué compras se consideran existentes/válidas y el manejo
de errores y consistencia con el módulo externo. No hay URL ni payload de Ventas inventado.

Hoy los dos endpoints responden 503 al consultar una compra; no se puede registrar
un caso real hasta conectar esa dependencia. El camino exitoso se demuestra con
dobles de prueba y PostgreSQL aislado, sin presentarlo como integración real.
