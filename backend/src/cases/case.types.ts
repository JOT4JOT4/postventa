export enum CaseStatus {
  Open = 'Abierto',
  InReview = 'En revisión',
  Approved = 'Aprobado',
  Rejected = 'Rechazado',
  Closed = 'Cerrado',
}

export const STATUS_TRANSITIONS: Partial<Record<CaseStatus, CaseStatus[]>> = {
  [CaseStatus.Open]: [CaseStatus.InReview, CaseStatus.Rejected],
  [CaseStatus.InReview]: [CaseStatus.Approved, CaseStatus.Rejected, CaseStatus.Closed],
  [CaseStatus.Approved]: [CaseStatus.Closed],
};

export const TERMINAL_STATUSES: CaseStatus[] = [CaseStatus.Rejected, CaseStatus.Closed];
