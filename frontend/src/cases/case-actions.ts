import type { CaseStatusValue } from './case-api';

export type ActionRequirement = 'required' | 'optional' | 'hidden';

export interface CaseActionsPolicy {
  showReturn: boolean;
  returnRequirement: ActionRequirement;
  returnStepNumber: string;
  showRefund: boolean;
  refundRequirement: ActionRequirement;
  refundStepNumber: string;
  pendingNotice: string | null;
}

const ENABLED_STATUSES: ReadonlyArray<CaseStatusValue> = ['Aprobado', 'Cerrado'];
const PENDING_STATUSES: ReadonlyArray<CaseStatusValue> = ['Abierto', 'En revisión'];

function requirementsForType(type: string | null): {
  returnRequirement: ActionRequirement;
  refundRequirement: ActionRequirement;
  pendingActionsLabel: string;
} {
  switch (type) {
    case 'Cambio':
      return {
        returnRequirement: 'required',
        refundRequirement: 'hidden',
        pendingActionsLabel: 'la devolución física del producto original',
      };
    case 'Devolución':
      return {
        returnRequirement: 'required',
        refundRequirement: 'required',
        pendingActionsLabel: 'la devolución de producto y, posteriormente, la solicitud de reembolso',
      };
    case 'Reembolso':
      return {
        returnRequirement: 'hidden',
        refundRequirement: 'required',
        pendingActionsLabel: 'la solicitud de reembolso',
      };
    case 'Reclamo':
    default:
      return {
        returnRequirement: 'optional',
        refundRequirement: 'optional',
        pendingActionsLabel: 'la devolución de producto y/o la solicitud de reembolso (opcionales según evaluación)',
      };
  }
}

export function getCaseActionsPolicy(status: CaseStatusValue, type: string | null): CaseActionsPolicy {
  const { returnRequirement, refundRequirement, pendingActionsLabel } = requirementsForType(type);
  const canDisplay = ENABLED_STATUSES.includes(status);
  const showReturn = canDisplay && returnRequirement !== 'hidden';
  const showRefund = canDisplay && refundRequirement !== 'hidden';

  return {
    showReturn,
    returnRequirement,
    returnStepNumber: '05',
    showRefund,
    refundRequirement,
    refundStepNumber: showReturn ? '06' : '05',
    pendingNotice: PENDING_STATUSES.includes(status)
      ? `Al aprobar este caso se habilitará ${pendingActionsLabel}.`
      : null,
  };
}
