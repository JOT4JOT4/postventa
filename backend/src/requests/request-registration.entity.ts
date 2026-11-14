import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { RequestEntity } from './request.entity';
import { RequestType } from './request.types';

@Entity('postventa_registro')
export class RequestRegistrationEntity {
  @PrimaryColumn({ name: 'id_reclamo', type: 'integer' })
  requestId!: number;

  @OneToOne(() => RequestEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_reclamo' })
  request!: RequestEntity;

  @Column({ name: 'tipo', type: 'varchar', length: 20 })
  type!: RequestType;

  @CreateDateColumn({ name: 'fecha_registro', type: 'timestamptz' })
  createdAt!: Date;
}
