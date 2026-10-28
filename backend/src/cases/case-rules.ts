import { BadRequestException } from '@nestjs/common';
import { CaseStatus, STATUS_TRANSITIONS, TERMINAL_STATUSES } from './case.types';

export function validateCaseUpdate(current: CaseStatus, next: CaseStatus, note?: string): void {
  if (TERMINAL_STATUSES.includes(current)) {
    throw new BadRequestException(`El caso está en estado "${current}" y no permite modificaciones.`);
  }
  if (current !== next && !STATUS_TRANSITIONS[current]?.includes(next)) {
    throw new BadRequestException(`No se puede cambiar de "${current}" a "${next}".`);
  }
  if (next === CaseStatus.Rejected && (typeof note !== 'string' || !note.trim())) {
    throw new BadRequestException('Debes ingresar el motivo del rechazo.');
  }
}
