import { BadRequestException } from '@nestjs/common';
import { RequestType } from '../requests/request.types';

export function assertReturnAllowedForType(type: string | null): void {
  if (type === RequestType.Refund) {
    throw new BadRequestException(
      'Un caso de tipo Reembolso no requiere devolución física de producto.',
    );
  }
}

export function assertRefundAllowedForType(type: string | null, hasReturn: boolean): void {
  if (type === RequestType.Exchange) {
    throw new BadRequestException(
      'Un caso de tipo Cambio no admite solicitud de reembolso.',
    );
  }
  if (type === RequestType.Return && !hasReturn) {
    throw new BadRequestException(
      'Para un caso de tipo Devolución debes registrar primero la devolución del producto antes de solicitar el reembolso.',
    );
  }
}
