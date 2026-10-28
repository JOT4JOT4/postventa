# Datos ficticios de demostración

`cases.sql` se ejecuta después de las migraciones. Inserta 20 casos con IDs reservados `100001–100020`, sus tipos, líneas e historiales y 10 resoluciones. Incluye los cuatro tipos y los cinco estados. Solo crea hijos para casos realmente insertados durante esa ejecución. Repetirlo no sobrescribe datos ni duplica historiales; si un ID reservado ya existe, lo conserva. No se deben usar esos IDs para otros datos de demostración.

Se utilizan las relaciones actuales de las ventas de la semilla local para derivar clientes y productos. Una tabla temporal transaccional identifica los casos nuevos. El generador de ID de `reclamo` avanza sin retroceder; los IDs pueden tener saltos. El bloqueo asesor del ejecutor evita cargas simultáneas inconsistentes.

`shared-schema.sql`, en la raíz del repositorio, prepara las cinco tablas compartidas mínimas ficticias con diez clientes, pedidos, ventas y productos, y veinte líneas. Es un apoyo local y no reemplaza los maestros reales del ERP.

Ejecutar con `POSTVENTA_DEMO_DATA=true`, destino local y base `postventa`, `postventa_demo` o terminada en `_test`. Usar `npm run demo:prepare`, `npm run migration:run`, `npm run demo:seed` desde backend con sus variables `DATABASE_*` configuradas. Docker aplica esa secuencia automáticamente, también con un volumen ya existente. No se requiere eliminar volúmenes.

Las tablas históricas `peticion` y `detalle_peticion`, conservadas para migrar registros antiguos, no forman parte del modelo transaccional activo. No se duplican casos allí para inflar el volumen. La tabla interna de migraciones tampoco es una tabla funcional.
