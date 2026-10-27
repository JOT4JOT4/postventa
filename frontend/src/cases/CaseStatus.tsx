import { CaseStatusValue } from './case-api';

interface CaseStatusProps {
  status: CaseStatusValue | string;
  size?: 'normal' | 'large';
  /** Anuncia el estado como región viva; desactivar en listados con muchos badges. */
  live?: boolean;
}

export function CaseStatus({ status, size = 'normal', live = true }: CaseStatusProps) {
  const normalizedClass = `status-badge status-${status.toLowerCase().replace(/\s+/g, '-')} status-${size}`;

  return (
    <span className={normalizedClass} role={live ? 'status' : undefined}>
      {status}
    </span>
  );
}
