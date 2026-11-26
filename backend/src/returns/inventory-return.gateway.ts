import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { parseSchemaName, qualifyTable } from '../database/schema-config';

export type ReceptionStatus = 'Pendiente de recepción' | 'Recibida apta' | 'Recibida con daño';

export interface ReturnWarehouse {
  id: number;
  name: string;
  address: string;
}

export interface InventoryReturnMovement {
  operationType: string;
  recordedAt: string;
  warehouseId: number;
  warehouseName: string | null;
  quantity: number;
}

export interface ReturnReception {
  status: ReceptionStatus;
  warehouseId: number | null;
  warehouseName: string | null;
  quantity: number | null;
  recordedAt: string | null;
  movements: InventoryReturnMovement[];
}

export abstract class InventoryReturnGateway {
  abstract findReturnWarehouse(manager?: EntityManager): Promise<ReturnWarehouse | null>;
  abstract findReceptionByReturnId(returnId: number, manager?: EntityManager): Promise<ReturnReception>;
}

export function summarizeReception(movements: InventoryReturnMovement[]): ReturnReception {
  if (!movements.length) {
    return {
      status: 'Pendiente de recepción',
      warehouseId: null,
      warehouseName: null,
      quantity: null,
      recordedAt: null,
      movements: [],
    };
  }
  const primary = movements.find(item => item.operationType === 'DEVOLUCION') ?? movements[0];
  const damaged = movements.some(item => item.operationType === 'AJUSTE');
  return {
    status: damaged ? 'Recibida con daño' : 'Recibida apta',
    warehouseId: primary.warehouseId,
    warehouseName: primary.warehouseName,
    quantity: primary.quantity,
    recordedAt: primary.recordedAt,
    movements,
  };
}

interface RawMovementRow {
  operationType: string;
  recordedAt: Date | string;
  warehouseId: number;
  warehouseName: string | null;
  quantity: number;
}

@Injectable()
export class DatabaseInventoryReturnGateway extends InventoryReturnGateway {
  private readonly schema: string | undefined;

  constructor(private readonly db: DataSource) {
    super();
    this.schema = parseSchemaName(process.env.INVENTORY_SCHEMA, 'INVENTORY_SCHEMA');
  }

  async findReturnWarehouse(manager?: EntityManager): Promise<ReturnWarehouse | null> {
    const runner = manager ?? this.db.manager;
    const warehouses = qualifyTable('inv_bodegas', this.schema);
    const rows: ReturnWarehouse[] = await runner.query(
      `SELECT id_bodega AS id, nombre_bodega AS name, ubicacion_fisica AS address
       FROM ${warehouses}
       ORDER BY CASE WHEN id_bodega = 1 THEN 0 ELSE 1 END, id_bodega ASC
       LIMIT 1`,
    );
    return rows[0] ?? null;
  }

  async findReceptionByReturnId(returnId: number, manager?: EntityManager): Promise<ReturnReception> {
    const runner = manager ?? this.db.manager;
    const movementsTable = qualifyTable('inv_movimiento', this.schema);
    const detailsTable = qualifyTable('inv_detalles_movimiento', this.schema);
    const warehousesTable = qualifyTable('inv_bodegas', this.schema);
    const rows: RawMovementRow[] = await runner.query(
      `SELECT m.tipo_operacion AS "operationType",
              m.fecha_registro AS "recordedAt",
              d.id_bodega AS "warehouseId",
              b.nombre_bodega AS "warehouseName",
              d.cantidad AS quantity
       FROM ${movementsTable} m
       JOIN ${detailsTable} d ON d.id_movimiento = m.id_movimiento
       LEFT JOIN ${warehousesTable} b ON b.id_bodega = d.id_bodega
       WHERE m.id_devolucion = $1
       ORDER BY m.id_movimiento ASC, d.id_detalle ASC`,
      [returnId],
    );
    const movements: InventoryReturnMovement[] = rows.map(row => ({
      operationType: row.operationType,
      recordedAt: row.recordedAt instanceof Date ? row.recordedAt.toISOString() : String(row.recordedAt),
      warehouseId: Number(row.warehouseId),
      warehouseName: row.warehouseName ?? null,
      quantity: Number(row.quantity),
    }));
    return summarizeReception(movements);
  }
}
