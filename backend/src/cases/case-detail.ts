import { NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { RequestEntity } from '../requests/request.entity';
import { RequestRegistrationEntity } from '../requests/request-registration.entity';
import { RequestItemEntity } from '../requests/request-item.entity';
import { CaseResolutionEntity } from './case-resolution.entity';

export async function loadCaseDetail(manager: EntityManager, id: number) {
  const row = await manager.findOneBy(RequestEntity, { id });
  if (!row) throw new NotFoundException('El caso indicado no existe.');
  const registration = await manager.findOneBy(RequestRegistrationEntity, { requestId: id });
  const items = await manager.findBy(RequestItemEntity, { requestId: id });
  const resolution = await manager.findOneBy(CaseResolutionEntity, { caseId: id });
  return {
    id: row.id, purchaseId: row.purchaseId, customerId: row.customerId,
    reason: row.reason, description: row.description ?? null, status: row.status,
    type: registration?.type ?? null, createdAt: registration?.createdAt ?? null,
    items: items.map(item => item.purchaseItemId),
    resolution: resolution ? { text: resolution.resolution, resolvedAt: resolution.resolvedAt } : null,
  };
}
