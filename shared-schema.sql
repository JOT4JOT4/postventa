CREATE TABLE IF NOT EXISTS cliente (id_cliente integer PRIMARY KEY, nombre text NOT NULL);
CREATE TABLE IF NOT EXISTS pedido (
  id_pedido integer PRIMARY KEY,
  id_cliente integer NOT NULL REFERENCES cliente(id_cliente)
);
CREATE TABLE IF NOT EXISTS venta (
  id_venta integer PRIMARY KEY,
  id_pedido integer NOT NULL REFERENCES pedido(id_pedido)
);
CREATE TABLE IF NOT EXISTS inv_producto (id_producto integer PRIMARY KEY, nombre_set text NOT NULL);
CREATE TABLE IF NOT EXISTS detalle_pedido (
  id_detalle_ped integer PRIMARY KEY,
  id_pedido integer NOT NULL REFERENCES pedido(id_pedido),
  id_producto integer NOT NULL REFERENCES inv_producto(id_producto)
);
INSERT INTO cliente VALUES (20, 'Cliente ficticio de prueba'), (21, 'Otro cliente ficticio') ON CONFLICT DO NOTHING;
INSERT INTO pedido VALUES (100, 20), (101, 21), (102, 20) ON CONFLICT DO NOTHING;
INSERT INTO venta VALUES (10, 100), (11, 101), (12, 102) ON CONFLICT DO NOTHING;
INSERT INTO inv_producto VALUES (40, 'Set ficticio A'), (41, 'Set ficticio B') ON CONFLICT DO NOTHING;
INSERT INTO detalle_pedido VALUES (30, 100, 40), (31, 100, 41), (32, 101, 40) ON CONFLICT DO NOTHING;
