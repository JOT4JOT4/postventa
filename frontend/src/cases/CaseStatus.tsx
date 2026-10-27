import { CaseStatusValue } from './case-api';

interface CaseStatusProps {
  status: CaseStatusValue | string;
  size?: 'normal' | 'large';
}

export function CaseStatus({ status, size = 'normal' }: CaseStatusProps) {
  const normalizedClass = `status-badge status-${status.toLowerCase().replace(/\s+/g, '-')} status-${size}`;

  return (
    <span className={normalizedClass} role="status">
      {status}
    </span>
  );
}
