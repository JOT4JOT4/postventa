# Migraciones de HU-01

## Archivos

- `1792800000000-CreateRequests.ts`: migración histórica que creó `peticion` y
  `detalle_peticion`. Se mantiene sin reescribir para respetar bases ya migradas.
  `up(queryRunner)` crea ese esquema antiguo; `down` elimina sus tablas y no debe
  ejecutarse sobre datos que se quieran conservar. `.gitkeep` es el marcador original.
- `1792886400000-AlignRegistrationSchema.ts`: `up(runner)` comprueba el esquema
  compartido y actualiza el almacenamiento mediante las funciones de
  `../registration-upgrade.ts`. `down()` se detiene expresamente: la reversión
  exige conciliación manual para no romper referencias de otros módulos.

## Resultado

- `reclamo`: los cinco campos del diagrama; FK a `venta` y `cliente`. Se crea si
  no existe. Si ya existe se conserva, se comprueban sus campos y se completan
  las FK faltantes. Si su ID entero no tenía generador, se añade una secuencia
  para asignar identificadores sin pedirlos al usuario.
- `postventa_registro`: `id_reclamo` PK/FK, `tipo` restringido a los cuatro valores
  y `fecha_registro` con zona horaria.
- `postventa_registro_producto`: ID autogenerado, FK al caso y a
  `detalle_pedido.id_detalle_ped`; unicidad por caso/línea.

Las dos tablas auxiliares amplían el diagrama únicamente para conservar el tipo
seleccionado y los productos exigidos por HU-01, ausentes en RECLAMO. No agregan
funcionalidades ni modifican tablas ajenas. Deben reflejarse en el modelo compartido.

La actualización copia los casos anteriores, sus IDs, motivos, estados, tipos,
fechas y líneas. Mantiene las tablas de origen como archivo; la aplicación deja
de escribirlas. Si falta una referencia del ERP, un cliente no coincide o hay
colisión de IDs con RECLAMO, falla y se revierte la migración completa. No sobrescribe
ni elimina casos. Una segunda ejecución usa el historial de TypeORM y no repite la copia.
La secuencia del nuevo caso se ajusta para no reutilizar IDs existentes.

## Prerrequisito y ejecución

Cargar primero las tablas compartidas acordadas: `cliente`, `pedido`, `venta`,
`detalle_pedido` e `inv_producto`, con sus claves del diagrama. Luego ejecutar
`npm run migration:run` desde backend. Docker lo hace al iniciar el backend.
Si faltan esas estructuras, la actualización falla con un mensaje administrativo;
no las crea ni incorpora datos ficticios para sustituirlas.

No ejecutar sobre una BD compartida sin coordinar la ventana de migración. La
migración completa corre en una transacción y bloquea escrituras en RECLAMO durante
la copia. Antes de ejecutarla conviene revisar respaldo y correspondencia de los
IDs de casos antiguos con los de las tablas compartidas.

## Recuperación de historial inicial

`1793088000000-BackfillInitialHistory.ts` agrega una entrada inicial solo a casos que no la tengan. `up(runner)` usa fecha y estado inicial de registro cuando existe `postventa_registro`. En registros sin metadatos, conserva el estado conocido y señala que no existe fecha inicial disponible. No modifica estados, notas existentes ni resoluciones. `down()` requiere conciliación manual para no borrar trazabilidad.
