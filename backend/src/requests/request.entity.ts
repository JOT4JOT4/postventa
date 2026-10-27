import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { INITIAL_STATUS } from './request.types';

@Entity('reclamo')
export class RequestEntity {
  @PrimaryGeneratedColumn('identity', { name: 'id_reclamo' })
  id!: number;

  @Column({ name: 'id_venta', type: 'integer' })
  purchaseId!: number;

  @Column({ name: 'id_cliente', type: 'integer' })
  customerId!: number;

  @Column({ name: 'motivo', type: 'varchar', length: 2000 })
  reason!: string;

  @Column({ name: 'estado', type: 'varchar', length: 20, default: INITIAL_STATUS })
  status!: string;
}
