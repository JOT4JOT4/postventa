# Solicitudes de reembolso — HU-10

Esta carpeta registra y consulta un reembolso asociado a un caso aprobado. No ejecuta pagos ni modifica Ventas, Finanzas, Inventario o los estados del caso.

## Archivos y conexiones

| Archivo | Responsabilidad, entradas y salidas |
|---|---|
| `create-refund.dto.ts` | `CreateRefundDto` acepta únicamente `amount` como texto decimal positivo, sin separador de miles, con hasta trece enteros y dos decimales. Recorta espacios y rechaza campos ajenos. |
| `refund.entity.ts` | `RefundEntity` mapea `reembolso`: ID generado, caso único, monto NUMERIC(15,2) representado como string, estado Pendiente y fecha. Relación con `RequestEntity` mediante FK restrictiva. |
| `refund-reader.ts` | `RefundSummary` define el resultado. `readRefunds(manager, caseId)` recibe un administrador de TypeORM y el ID del caso; retorna una promesa de lista vacía o una solicitud con ID, caso, compra, cliente, monto, estado y fecha. Compra y cliente proceden del caso mediante JOIN. |
| `refunds.service.ts` | `RefundsService.create(caseId, dto)` bloquea el caso en una transacción, comprueba aprobación y ausencia de reembolso, persiste y devuelve lo guardado. `findForCase(caseId)` verifica existencia del caso y retorna la lista. Los errores ajenos al dominio se convierten en 503 sin detalles internos. |
| `refunds.controller.ts` | `RefundsController` expone GET y POST anidados bajo el caso; reutiliza `PositiveIdPipe`. |
| `refunds.module.ts` | `RefundsModule` registra controlador, servicio y entidades; lo importa `AppModule`. |

## API

- `POST /postventa/solicitudes/:id/reembolsos`: `{"amount":"1500.25"}`; responde 201 con la solicitud guardada.
- `GET /postventa/solicitudes/:id/reembolsos`: responde 200 con `[]` o `[RefundSummary]`. Permite consultar también cuando el caso posteriormente se cierra.
- 400: monto/ID inválido, campos no admitidos o caso no aprobado.
- 404: caso inexistente. 409: ya hay una solicitud para ese caso. 503: persistencia no disponible.

El navegador no proporciona cliente, venta, estado ni ID de reembolso. El monto se transmite como texto para mantener precisión decimal; no se realizan cálculos monetarios con flotantes.

## Reglas y límites

- Se aplica cero o un reembolso por caso, conforme a la cardinalidad del modelo ER. El bloqueo del caso y la restricción UNIQUE evitan duplicados simultáneos.
- El caso debe estar en Aprobado al registrar. El registro no lo cierra y no requiere una devolución previa ni un tipo de caso específico, porque HU-10 no establece esas condiciones.
- El estado inicial de la solicitud es Pendiente. HU-10 no incorpora transiciones financieras; Pendiente no significa pagado ni ejecutado.
- Se conserva `monto_reembolsado` como nombre del modelo ER; en esta historia contiene el importe solicitado, todavía sin desembolso.
- No se inventan límites contra el total de la venta, políticas de garantía o tipos de pago. El máximo decimal es el límite técnico de almacenamiento, no una política comercial.
- Autenticación y permisos pertenecen a la historia correspondiente; esta API mantiene el entorno local de desarrollo existente y no acredita acceso seguro para usuarios reales.

La migración `1794652800000-CreateRefundRequests.ts` crea únicamente la tabla propia. No cambia tablas externas ni reescribe migraciones anteriores. Se debe aplicar antes de usar estas rutas y coordinar cualquier adaptación posterior al esquema compartido.
