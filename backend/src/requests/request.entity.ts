import { Column, Entity, PrimaryColumn } from 'typeorm';
import { INITIAL_STATUS } from './request.types';

@Entity({ name: 'reclamo', schema: 'postventa' })
export class RequestEntity {
  @PrimaryColumn({ name: 'id_reclamo', type: 'integer' })
  id!: number;

  @Column({ name: 'id_venta', type: 'integer' })
  purchaseId!: number;

  @Column({ name: 'id_cliente', type: 'integer' })
  customerId!: number;

  @Column({ name: 'motivo', type: 'varchar', length: 2000 })
  reason!: string;

  @Column({ name: 'estado', type: 'varchar', length: 20, default: INITIAL_STATUS })
  status!: string;

  description!: string | null;
}
