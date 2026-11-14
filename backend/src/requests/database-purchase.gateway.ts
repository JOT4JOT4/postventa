import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { Purchase, PurchaseGateway } from './request.types';

@Injectable()
export class DatabasePurchaseGateway extends PurchaseGateway {
  constructor(private readonly dataSource: DataSource) { super(); }

  async findById(id: number, transaction?: EntityManager): Promise<Purchase | null> {
    const manager = transaction ?? this.dataSource.manager;
    try {
      const sales: { id: number; orderId: number; customerId: number; customerName: string }[] =
        await manager.query(`
          SELECT v.id_venta AS id, p.id_pedido AS "orderId",
                 c.id_cliente AS "customerId", c.nombre AS "customerName"
          FROM venta v
          JOIN pedido p ON p.id_pedido = v.id_pedido
          JOIN cliente c ON c.id_cliente = p.id_cliente
          WHERE v.id_venta = $1
          ${transaction ? 'FOR SHARE OF v, p, c' : ''}
        `, [id]);
      if (!sales.length) return null;
      const sale = sales[0];
      const items: Purchase['items'] = await manager.query(`
        SELECT d.id_detalle_ped AS id, pr.id_producto AS "productId",
               pr.nombre_set AS "productName"
        FROM detalle_pedido d
        JOIN inv_producto pr ON pr.id_producto = d.id_producto
        WHERE d.id_pedido = $1
        ORDER BY d.id_detalle_ped
        ${transaction ? 'FOR SHARE OF d, pr' : ''}
      `, [sale.orderId]);
      return { id: sale.id, customer: { id: sale.customerId, name: sale.customerName }, items };
    } catch {
      throw new ServiceUnavailableException(
        'No fue posible consultar la compra. Verifica la disponibilidad de los datos compartidos del ERP.',
      );
    }
  }
}
