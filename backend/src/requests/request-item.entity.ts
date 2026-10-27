import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { RequestEntity } from './request.entity';

@Entity('postventa_registro_producto')
@Unique('uq_registro_linea', ['requestId', 'purchaseItemId'])
export class RequestItemEntity {
  @PrimaryGeneratedColumn('identity', { name: 'id_registro_producto' })
  id!: number;

  @Column({ name: 'id_reclamo', type: 'integer' })
  requestId!: number;

  @ManyToOne(() => RequestEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_reclamo' })
  request!: RequestEntity;

  @Column({ name: 'id_detalle_ped', type: 'integer' })
  purchaseItemId!: number;
}
