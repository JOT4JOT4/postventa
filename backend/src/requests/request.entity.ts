import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { INITIAL_STATUS, RequestType } from './request.types';

@Entity('peticion')
export class RequestEntity {
  @PrimaryGeneratedColumn('identity', { name: 'id_peticion' })
  id!: number;

  @Column({ name: 'id_venta', type: 'integer' })
  purchaseId!: number;

  @Column({ name: 'id_cliente', type: 'integer' })
  customerId!: number;

  @Column({ name: 'tipo', type: 'varchar', length: 20 })
  type!: RequestType;

  @Column({ name: 'motivo', type: 'varchar', length: 2000 })
  reason!: string;

  @Column({ name: 'estado', type: 'varchar', length: 20, default: INITIAL_STATUS })
  status!: string;

  @CreateDateColumn({ name: 'fecha_reclamo', type: 'timestamptz' })
  createdAt!: Date;
}
