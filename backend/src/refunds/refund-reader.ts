import { EntityManager } from 'typeorm';
import { RequestEntity } from '../requests/request.entity';
import { RefundEntity } from './refund.entity';

export interface RefundSummary {
  id: number;
  caseId: number;
  purchaseId: number;
  customerId: number;
  amount: string;
  status: string;
  requestedAt: Date;
}

export function readRefunds(manager: EntityManager, caseId: number): Promise<RefundSummary[]> {
  return manager.createQueryBuilder(RefundEntity, 'refund')
    .innerJoin(RequestEntity, 'case', 'case.id = refund.caseId')
    .select('refund.id', 'id').addSelect('refund.caseId', 'caseId')
    .addSelect('case.purchaseId', 'purchaseId').addSelect('case.customerId', 'customerId')
    .addSelect('refund.amount', 'amount').addSelect('refund.status', 'status')
    .addSelect('refund.requestedAt', 'requestedAt')
    .where('refund.caseId = :caseId', { caseId }).getRawMany<RefundSummary>();
}
