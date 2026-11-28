import { BadRequestException } from '@nestjs/common';
import { assertRefundAllowedForType, assertReturnAllowedForType } from '../../src/cases/case-actions';
import { RequestType } from '../../src/requests/request.types';

describe('Mapeo de acciones habilitadas según tipo de solicitud', () => {
  it('permite devolución para Reclamo, Cambio, Devolución y casos legados sin tipo', () => {
    for (const type of [RequestType.Complaint, RequestType.Exchange, RequestType.Return, null]) {
      expect(() => assertReturnAllowedForType(type)).not.toThrow();
    }
  });

  it('rechaza devolución física en casos de tipo Reembolso', () => {
    expect(() => assertReturnAllowedForType(RequestType.Refund)).toThrow(BadRequestException);
  });

  it('rechaza reembolso en casos de tipo Cambio', () => {
    expect(() => assertRefundAllowedForType(RequestType.Exchange, true)).toThrow(BadRequestException);
  });

  it('exige registrar primero la devolución antes del reembolso en casos de tipo Devolución', () => {
    expect(() => assertRefundAllowedForType(RequestType.Return, false)).toThrow(BadRequestException);
    expect(() => assertRefundAllowedForType(RequestType.Return, true)).not.toThrow();
  });

  it('permite reembolso en Reclamo, Reembolso y casos legados sin tipo sin devolución previa', () => {
    for (const type of [RequestType.Complaint, RequestType.Refund, null]) {
      expect(() => assertRefundAllowedForType(type, false)).not.toThrow();
    }
  });
});
