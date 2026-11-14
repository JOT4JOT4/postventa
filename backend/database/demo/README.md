# Datos ficticios de demostración

`cases.sql` se ejecuta después de las migraciones. Inserta 20 casos con IDs reservados `100001–100020`, sus tipos, líneas e historiales y 10 resoluciones. Incluye los cuatro tipos y los cinco estados. Solo crea hijos para casos realmente insertados durante esa ejecución. Repetirlo no sobrescribe datos ni duplica historiales; si un ID reservado ya existe, lo conserva. No se deben usar esos IDs para otros datos de demostración.

Se utilizan las relaciones actuales de las ventas de la semilla local para derivar clientes y productos. Una tabla temporal transaccional identifica los casos nuevos. El generador de ID de `reclamo` avanza sin retroceder; los IDs pueden tener saltos. El bloqueo asesor del ejecutor evita cargas simultáneas inconsistentes.

`shared-schema.sql`, en la raíz del repositorio, prepara las cinco tablas compartidas mínimas ficticias con diez clientes, pedidos, ventas y productos, y veinte líneas. Es un apoyo local y no reemplaza los maestros reales del ERP.

Ejecutar con `POSTVENTA_DEMO_DATA=true`, destino local y base `postventa`, `postventa_demo` o terminada en `_test`. Usar `npm run demo:prepare`, `npm run migration:run`, `npm run demo:seed` desde backend con sus variables `DATABASE_*` configuradas. Docker aplica esa secuencia automáticamente, también con un volumen ya existente. No se requiere eliminar volúmenes.

Las tablas históricas `peticion` y `detalle_peticion`, conservadas para migrar registros antiguos, no forman parte del modelo transaccional activo. No se duplican casos allí para inflar el volumen. La tabla interna de migraciones tampoco es una tabla funcional.

## Solicitudes de reembolso HU-10

`refunds.sql` agrega diez casos ficticios aprobados (IDs 200001–200010), tipo Reembolso, líneas de compra, historial y una solicitud Pendiente por caso. Solo completa los casos insertados en esa ejecución; repetir la carga conserva cambios existentes y no duplica solicitudes. El ejecutor procesa `cases.sql` y luego `refunds.sql` bajo una misma transacción y bloqueo. HU-10 suma esos diez casos a los veinte originales, que se mantienen. HU-06 agrega los casos descritos en la siguiente sección.

## Devoluciones HU-06

`returns.sql` agrega diez casos ficticios aprobados (IDs 300001–300010), tipo Devolución, líneas de compra, historial y una devolución por caso, con cantidad 1, fecha actual y motivo ficticio. Solo crea hijos de casos insertados en esa ejecución; repetirlo conserva modificaciones y no duplica registros. Se ejecuta después de `refunds.sql` en la misma transacción. La instalación nueva queda con cuarenta casos, diez reembolsos y diez devoluciones.

`shared-schema.sql` incluye `detalle_pedido.cantidad` con valor ficticio 3 para las líneas nuevas. Si un volumen local antiguo no tenía esa columna, `prepare` la incorpora con ese valor de demostración; si ya existe, no sobrescribe cantidades. No representa las cantidades reales del ERP ni autoriza alterar tablas remotas.
