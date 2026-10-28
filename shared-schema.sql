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
-- Maestros mínimos ficticios para la demostración local; no representan datos reales.
INSERT INTO cliente(id_cliente, nombre)
SELECT 19+n, 'Cliente ficticio ' || n FROM generate_series(1,10) AS n ON CONFLICT DO NOTHING;
INSERT INTO pedido(id_pedido, id_cliente)
SELECT 99+n, 19+n FROM generate_series(1,10) AS n ON CONFLICT DO NOTHING;
INSERT INTO venta(id_venta, id_pedido)
SELECT 9+n, 99+n FROM generate_series(1,10) AS n ON CONFLICT DO NOTHING;
INSERT INTO inv_producto(id_producto, nombre_set)
SELECT 39+n, 'Set ficticio ' || n FROM generate_series(1,10) AS n ON CONFLICT DO NOTHING;
INSERT INTO detalle_pedido(id_detalle_ped, id_pedido, id_producto)
SELECT 29+n, 100+((n-1)/2), 40+((n-1)%10)
FROM generate_series(1,20) AS n ON CONFLICT DO NOTHING;
