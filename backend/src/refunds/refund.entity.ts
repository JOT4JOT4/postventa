import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { RequestEntity } from '../requests/request.entity';

@Entity('reembolso')
@Unique('uq_reembolso_caso', ['caseId'])
export class RefundEntity {
  @PrimaryGeneratedColumn('identity', { name: 'id_reembolso' })
  id!: number;

  @Column({ name: 'id_reclamo', type: 'integer' })
  caseId!: number;

  @OneToOne(() => RequestEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_reclamo' })
  case!: RequestEntity;

  @Column({ name: 'monto_reembolsado', type: 'numeric', precision: 15, scale: 2 })
  amount!: string;

  @Column({ name: 'estado', type: 'varchar', length: 20, default: 'Pendiente' })
  status!: string;

  @CreateDateColumn({ name: 'fecha_solicitud', type: 'timestamptz' })
  requestedAt!: Date;
}
