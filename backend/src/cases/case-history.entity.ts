import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RequestEntity } from '../requests/request.entity';

@Entity({ name: 'historial', schema: 'postventa' })
export class CaseHistoryEntity {
  @PrimaryGeneratedColumn('identity', { name: 'id_historial' })
  id!: number;

  @Column({ name: 'id_reclamo', type: 'integer' })
  caseId!: number;

  @ManyToOne(() => RequestEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_reclamo' })
  case!: RequestEntity;

  @Column({ name: 'estado_anterior', type: 'varchar', length: 20, nullable: true })
  previousStatus!: string | null;

  @Column({ name: 'estado_nuevo', type: 'varchar', length: 20 })
  newStatus!: string;

  @Column({ name: 'nota', type: 'varchar', length: 2000, nullable: true })
  note!: string | null;

  @Column({ name: 'fecha_cambio', type: 'timestamptz', default: () => 'now()' })
  changedAt!: Date;
}
