import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { RequestEntity } from './request.entity';

@Entity('detalle_peticion')
@Unique('uq_peticion_linea', ['requestId', 'purchaseItemId'])
export class RequestItemEntity {
  @PrimaryGeneratedColumn('identity', { name: 'id_detalle_peticion' })
  id!: number;

  @Column({ name: 'id_peticion', type: 'integer' })
  requestId!: number;

  @ManyToOne(() => RequestEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_peticion' })
  request!: RequestEntity;

  @Column({ name: 'id_detalle_pedido', type: 'integer' })
  purchaseItemId!: number;
}
