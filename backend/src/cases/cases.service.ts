import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CaseHistoryEntity } from './case-history.entity';
import { CaseResolutionEntity } from './case-resolution.entity';
import { CaseStatus, STATUS_TRANSITIONS, TERMINAL_STATUSES } from './case.types';
import { ResolveCaseDto } from './resolve-case.dto';
import { UpdateCaseStatusDto } from './update-case-status.dto';
import { RequestEntity } from '../requests/request.entity';
import { RequestItemEntity } from '../requests/request-item.entity';
import { RequestRegistrationEntity } from '../requests/request-registration.entity';

@Injectable()
export class CasesService {
  constructor(private readonly dataSource: DataSource) { }

  /** Lista los casos registrados con su tipo y estado, del más reciente al más antiguo. */
  async findAll() {
    try {
      const rows: {
        id: number; type: string | null; status: string; createdAt: Date | null;
        purchaseId: number; customerId: number;
      }[] = await this.dataSource.manager
        .createQueryBuilder(RequestEntity, 'r')
        .leftJoin(RequestRegistrationEntity, 'reg', 'reg.requestId = r.id')
        .select('r.id', 'id')
        .addSelect('reg.type', 'type')
        .addSelect('r.status', 'status')
        .addSelect('reg.createdAt', 'createdAt')
        .addSelect('r.purchaseId', 'purchaseId')
        .addSelect('r.customerId', 'customerId')
        .orderBy('reg.createdAt', 'DESC', 'NULLS LAST')
        .addOrderBy('r.id', 'DESC')
        .getRawMany();
      return rows.map((row) => ({
        id: row.id,
        type: row.type ?? null,
        status: row.status,
        createdAt: row.createdAt ?? null,
        purchaseId: row.purchaseId,
        customerId: row.customerId,
      }));
    } catch {
      throw new ServiceUnavailableException(
        'No fue posible consultar los casos. Inténtalo nuevamente más tarde.',
      );
    }
  }

  /** Carga el detalle completo de un caso  */
  async findById(id: number) {
    try {
      const caseRow = await this.dataSource.manager.findOneBy(RequestEntity, { id });
      if (!caseRow) throw new NotFoundException('El caso indicado no existe.');

      const registration = await this.dataSource.manager.findOneBy(
        RequestRegistrationEntity, { requestId: id },
      );
      const items = await this.dataSource.manager.findBy(RequestItemEntity, { requestId: id });
      const resolution = await this.dataSource.manager.findOneBy(
        CaseResolutionEntity, { caseId: id },
      );

      return this.buildDetail(caseRow, registration, items, resolution);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new ServiceUnavailableException(
        'No fue posible consultar el caso. Inténtalo nuevamente más tarde.',
      );
    }
  }

  /** Actualiza estado y/o descripción del caso; registra entrada en historial si el estado cambia. */
  async updateStatus(id: number, dto: UpdateCaseStatusDto) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const caseRow = await manager.findOneBy(RequestEntity, { id });
        if (!caseRow) throw new NotFoundException('El caso indicado no existe.');

        const currentStatus = caseRow.status as CaseStatus;
        const newStatus = dto.status;
        const statusChanged = currentStatus !== newStatus;

        if (statusChanged) {
          const allowed = STATUS_TRANSITIONS[currentStatus];
          if (!allowed) {
            throw new BadRequestException(
              `El estado "${currentStatus}" es terminal y no permite transiciones.`,
            );
          }
          if (!allowed.includes(newStatus)) {
            throw new BadRequestException(
              `No se puede cambiar de "${currentStatus}" a "${newStatus}".`,
            );
          }
          caseRow.status = newStatus;
        }

        if (dto.description !== undefined) caseRow.description = dto.description;
        if (dto.reason !== undefined) caseRow.reason = dto.reason;

        await manager.save(RequestEntity, caseRow);

        if (statusChanged) {
          await manager.save(
            CaseHistoryEntity,
            manager.create(CaseHistoryEntity, {
              caseId: id,
              previousStatus: currentStatus,
              newStatus,
              note: dto.note ?? null,
            }),
          );
        }

        const registration = await manager.findOneBy(RequestRegistrationEntity, { requestId: id });
        const items = await manager.findBy(RequestItemEntity, { requestId: id });
        const resolution = await manager.findOneBy(CaseResolutionEntity, { caseId: id });

        return this.buildDetail(caseRow, registration, items, resolution);
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new ServiceUnavailableException(
        'No fue posible actualizar el caso. Inténtalo nuevamente más tarde.',
      );
    }
  }

  /** Registra la resolución final; solo permitida en estados terminales y una única vez. */
  async resolve(id: number, dto: ResolveCaseDto) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const caseRow = await manager.findOneBy(RequestEntity, { id });
        if (!caseRow) throw new NotFoundException('El caso indicado no existe.');

        if (!TERMINAL_STATUSES.includes(caseRow.status as CaseStatus)) {
          throw new BadRequestException(
            `Solo se puede registrar la resolución cuando el caso está en estado "${TERMINAL_STATUSES.join('" o "')}".`,
          );
        }

        const existing = await manager.findOneBy(CaseResolutionEntity, { caseId: id });
        if (existing) throw new ConflictException('El caso ya tiene una resolución registrada.');

        const resolution = await manager.save(
          CaseResolutionEntity,
          manager.create(CaseResolutionEntity, { caseId: id, resolution: dto.resolution }),
        );

        return { caseId: resolution.caseId, resolution: resolution.resolution, resolvedAt: resolution.resolvedAt };
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new ServiceUnavailableException(
        'No fue posible registrar la resolución. Inténtalo nuevamente más tarde.',
      );
    }
  }

  /** Devuelve el historial de cambios de estado del caso */
  async getHistory(id: number) {
    try {
      const exists = await this.dataSource.manager.exists(RequestEntity, { where: { id } });
      if (!exists) throw new NotFoundException('El caso indicado no existe.');

      return this.dataSource.manager
        .createQueryBuilder(CaseHistoryEntity, 'h')
        .where('h.caseId = :id', { id })
        .orderBy('h.changedAt', 'ASC')
        .addOrderBy('h.id', 'ASC')
        .getMany()
        .then((rows) =>
          rows.map((r) => ({
            previousStatus: r.previousStatus,
            newStatus: r.newStatus,
            note: r.note,
            changedAt: r.changedAt,
          })),
        );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new ServiceUnavailableException(
        'No fue posible obtener el historial. Inténtalo nuevamente más tarde.',
      );
    }
  }

  private buildDetail(
    caseRow: RequestEntity,
    registration: RequestRegistrationEntity | null,
    items: RequestItemEntity[],
    resolution: CaseResolutionEntity | null,
  ) {
    return {
      id: caseRow.id,
      purchaseId: caseRow.purchaseId,
      customerId: caseRow.customerId,
      reason: caseRow.reason,
      description: caseRow.description ?? null,
      status: caseRow.status,
      type: registration?.type ?? null,
      createdAt: registration?.createdAt ?? null,
      items: items.map((i) => i.purchaseItemId),
      resolution: resolution
        ? { text: resolution.resolution, resolvedAt: resolution.resolvedAt }
        : null,
    };
  }
}
