import { HttpException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RequestEntity } from '../requests/request.entity';
import { RequestRegistrationEntity } from '../requests/request-registration.entity';
import { CaseHistoryEntity } from './case-history.entity';
import { loadCaseDetail } from './case-detail';

export class CaseReader {
  constructor(private readonly db: DataSource) {}

  async findAll() {
    try {
      return await this.db.manager.createQueryBuilder(RequestEntity, 'r')
        .leftJoin(RequestRegistrationEntity, 'reg', 'reg.requestId = r.id')
        .select('r.id', 'id').addSelect('reg.type', 'type')
        .addSelect('r.status', 'status').addSelect('reg.createdAt', 'createdAt')
        .addSelect('r.purchaseId', 'purchaseId').addSelect('r.customerId', 'customerId')
        .orderBy('reg.createdAt', 'DESC', 'NULLS LAST').addOrderBy('r.id', 'DESC')
        .getRawMany<{
          id: number; type: string | null; status: string; createdAt: Date | null;
          purchaseId: number; customerId: number;
        }>();
    } catch {
      throw new ServiceUnavailableException('No fue posible consultar los casos. Inténtalo nuevamente más tarde.');
    }
  }

  async findById(id: number) {
    try { return await loadCaseDetail(this.db.manager, id); }
    catch (error) {
      if (error instanceof HttpException) throw error;
      throw new ServiceUnavailableException('No fue posible consultar el caso. Inténtalo nuevamente más tarde.');
    }
  }

  async getHistory(id: number) {
    try {
      if (!await this.db.manager.exists(RequestEntity, { where: { id } })) {
        throw new NotFoundException('El caso indicado no existe.');
      }
      const rows = await this.db.manager.createQueryBuilder(CaseHistoryEntity, 'h')
        .where('h.caseId = :id', { id }).orderBy('h.changedAt', 'ASC')
        .addOrderBy('h.id', 'ASC').getMany();
      return rows.map(row => ({
        previousStatus: row.previousStatus, newStatus: row.newStatus,
        note: row.note, changedAt: row.changedAt,
      }));
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new ServiceUnavailableException('No fue posible obtener el historial. Inténtalo nuevamente más tarde.');
    }
  }
}
