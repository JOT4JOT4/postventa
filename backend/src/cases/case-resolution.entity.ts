import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { RequestEntity } from '../requests/request.entity';

@Entity('postventa_resolucion')
export class CaseResolutionEntity {
  @PrimaryColumn({ name: 'id_reclamo', type: 'integer' })
  caseId!: number;

  @OneToOne(() => RequestEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_reclamo' })
  case!: RequestEntity;

  @Column({ name: 'resolucion', type: 'varchar', length: 4000 })
  resolution!: string;

  @Column({ name: 'fecha_resolucion', type: 'timestamptz', default: () => 'now()' })
  resolvedAt!: Date;
}
