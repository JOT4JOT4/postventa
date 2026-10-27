import { DataSource } from 'typeorm';

export async function createSharedFixture(db: DataSource): Promise<void> {
  await db.query(`
    CREATE TABLE cliente (id_cliente integer PRIMARY KEY, nombre text NOT NULL);
    CREATE TABLE pedido (
      id_pedido integer PRIMARY KEY,
      id_cliente integer NOT NULL REFERENCES cliente(id_cliente)
    );
    CREATE TABLE venta (
      id_venta integer PRIMARY KEY,
      id_pedido integer NOT NULL REFERENCES pedido(id_pedido)
    );
    CREATE TABLE inv_producto (id_producto integer PRIMARY KEY, nombre_set text NOT NULL);
    CREATE TABLE detalle_pedido (
      id_detalle_ped integer PRIMARY KEY,
      id_pedido integer NOT NULL REFERENCES pedido(id_pedido),
      id_producto integer NOT NULL REFERENCES inv_producto(id_producto)
    );
    INSERT INTO cliente VALUES (20, 'Cliente ficticio de prueba'), (21, 'Otro cliente ficticio');
    INSERT INTO pedido VALUES (100, 20), (101, 21), (102, 20);
    INSERT INTO venta VALUES (10, 100), (11, 101), (12, 102);
    INSERT INTO inv_producto VALUES (40, 'Set ficticio A'), (41, 'Set ficticio B');
    INSERT INTO detalle_pedido VALUES (30, 100, 40), (31, 100, 41), (32, 101, 40);
  `);
}
