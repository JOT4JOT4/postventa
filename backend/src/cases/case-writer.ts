import {
  BadRequestException, ConflictException, HttpException, NotFoundException, ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { RequestEntity } from '../requests/request.entity';
import { CaseHistoryEntity } from './case-history.entity';
import { CaseResolutionEntity } from './case-resolution.entity';
import { CaseStatus, TERMINAL_STATUSES } from './case.types';
import { UpdateCaseStatusDto } from './update-case-status.dto';
import { ResolveCaseDto } from './resolve-case.dto';
import { loadCaseDetail } from './case-detail';
import { validateCaseUpdate } from './case-rules';

export class CaseWriter {
  constructor(private readonly db: DataSource) {}

  private async lockCase(manager: EntityManager, id: number) {
    const row = await manager.findOne(RequestEntity, {
      where: { id }, lock: { mode: 'pessimistic_write' },
    });
    if (!row) throw new NotFoundException('El caso indicado no existe.');
    return row;
  }

  async updateStatus(id: number, dto: UpdateCaseStatusDto) {
    try {
      return await this.db.transaction(async manager => {
        const row = await this.lockCase(manager, id);
        const previous = row.status as CaseStatus;
        validateCaseUpdate(previous, dto.status, dto.note);
        row.status = dto.status;
        if (dto.description !== undefined) row.description = dto.description;
        if (dto.reason !== undefined) row.reason = dto.reason;
        await manager.save(RequestEntity, row);
        if (previous !== dto.status) {
          await manager.save(CaseHistoryEntity, manager.create(CaseHistoryEntity, {
            caseId: id, previousStatus: previous, newStatus: dto.status,
            note: dto.note?.trim() ?? null, changedAt: new Date(),
          }));
        }
        return loadCaseDetail(manager, id);
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new ServiceUnavailableException('No fue posible actualizar el caso. Inténtalo nuevamente más tarde.');
    }
  }

  async resolve(id: number, dto: ResolveCaseDto) {
    try {
      return await this.db.transaction(async manager => {
        const row = await this.lockCase(manager, id);
        if (!TERMINAL_STATUSES.includes(row.status as CaseStatus)) {
          throw new BadRequestException('Solo se puede registrar la resolución cuando el caso está en estado "Rechazado" o "Cerrado".');
        }
        if (await manager.exists(CaseResolutionEntity, { where: { caseId: id } })) {
          throw new ConflictException('El caso ya tiene una resolución registrada.');
        }
        const resolution = await manager.save(CaseResolutionEntity, manager.create(CaseResolutionEntity, {
          caseId: id, resolution: dto.resolution, resolvedAt: new Date(),
        }));
        return { caseId: id, resolution: resolution.resolution, resolvedAt: resolution.resolvedAt };
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new ServiceUnavailableException('No fue posible registrar la resolución. Inténtalo nuevamente más tarde.');
    }
  }
}
