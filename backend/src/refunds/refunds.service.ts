import {
  BadRequestException, ConflictException, HttpException, Injectable,
  NotFoundException, ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RequestEntity } from '../requests/request.entity';
import { RequestRegistrationEntity } from '../requests/request-registration.entity';
import { RequestType } from '../requests/request.types';
import { assertRefundAllowedForType } from '../cases/case-actions';
import { CaseStatus } from '../cases/case.types';
import { ReturnEntity } from '../returns/return.entity';
import { CreateRefundDto } from './create-refund.dto';
import { RefundEntity } from './refund.entity';
import { readRefunds } from './refund-reader';

@Injectable()
export class RefundsService {
  constructor(private readonly db: DataSource) {}

  private async operation<T>(action: () => Promise<T>): Promise<T> {
    try { return await action(); }
    catch (error) {
      if (error instanceof HttpException) throw error;
      throw new ServiceUnavailableException('No fue posible acceder a los reembolsos. Inténtalo nuevamente más tarde.');
    }
  }

  findForCase(caseId: number) {
    return this.operation(async () => {
      if (!await this.db.manager.exists(RequestEntity, { where: { id: caseId } })) {
        throw new NotFoundException('El caso indicado no existe.');
      }
      return readRefunds(this.db.manager, caseId);
    });
  }

  create(caseId: number, input: CreateRefundDto) {
    return this.operation(() => this.db.transaction(async manager => {
      const caseRecord = await manager.findOne(RequestEntity, {
        where: { id: caseId }, lock: { mode: 'pessimistic_write' },
      });
      if (!caseRecord) throw new NotFoundException('El caso indicado no existe.');
      if (caseRecord.status !== CaseStatus.Approved) {
        throw new BadRequestException('Solo se puede solicitar un reembolso para un caso aprobado.');
      }
      const registration = await manager.findOne(RequestRegistrationEntity, { where: { requestId: caseId } });
      const hasReturn = registration?.type === RequestType.Return
        ? await manager.exists(ReturnEntity, { where: { caseId } })
        : false;
      assertRefundAllowedForType(registration?.type ?? null, hasReturn);
      if (await manager.exists(RefundEntity, { where: { caseId } })) {
        throw new ConflictException('El caso ya tiene una solicitud de reembolso registrada.');
      }
      await manager.save(RefundEntity, manager.create(RefundEntity, { caseId, amount: input.amount }));
      return (await readRefunds(manager, caseId))[0];
    }));
  }
}
