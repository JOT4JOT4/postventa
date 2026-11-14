import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { RequestEntity } from '../requests/request.entity';

@Entity('devolucion')
@Unique('uq_devolucion_caso', ['caseId'])
export class ReturnEntity {
  @PrimaryGeneratedColumn('identity', { name: 'id_devolucion' })
  id!: number;

  @Column({ name: 'id_reclamo', type: 'integer' })
  caseId!: number;

  @ManyToOne(() => RequestEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_reclamo' })
  case!: RequestEntity;

  @Column({ name: 'id_detalle_ped', type: 'integer' })
  purchaseItemId!: number;

  @Column({ name: 'id_producto', type: 'integer' })
  productId!: number;

  @Column({ name: 'cantidad', type: 'integer' })
  quantity!: number;

  @Column({ name: 'fecha_devolucion', type: 'date' })
  returnDate!: string;

  @Column({ name: 'motivo', type: 'text' })
  reason!: string;
}
