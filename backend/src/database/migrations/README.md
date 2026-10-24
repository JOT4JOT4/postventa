# Migración inicial de HU-01

`1792800000000-CreateRequests.ts` contiene `CreateRequests1792800000000`:

- `up(queryRunner): Promise<void>` crea `peticion`, `detalle_peticion` y el índice de venta.
- `down(queryRunner): Promise<void>` elimina esas dos tablas; solo usar tras evaluar
  la pérdida de solicitudes. No se ejecuta automáticamente.
- `.gitkeep` es el marcador original de la carpeta.

`peticion` guarda ID entero autogenerado, referencias de venta y cliente, tipo,
motivo, estado inicial Abierto y fecha de registro con zona horaria.
`detalle_peticion` guarda ID propio, petición y línea del pedido. Tiene FK local a
petición, unicidad por petición/línea y restricciones de identificadores positivos.

Es un subconjunto del modelo del Sprint 1 para HU-01, no el esquema definitivo del
módulo. `tipo` se incorpora porque lo exige la historia y falta en el ER.
No se crean maestros ni tablas de Ventas. Las FK externas de `id_venta`, `id_cliente`
y `id_detalle_pedido` quedan pendientes hasta recibir nombres y tipos acordados.
El puerto de Ventas deberá confirmar pertenencia y cliente antes de cualquier alta.

Empleado/identidad (HU-16), prioridad, resolución, cantidades, observaciones y las
tablas de cambios, devoluciones y reembolsos no se implementan en esta historia.
La fecha usa `timestamptz` para conservar el instante de registro; el ER usaba `date`.
