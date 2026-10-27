import { CaseHistoryEntry } from './case-api';

interface CaseHistoryProps {
  history: CaseHistoryEntry[];
}

export function CaseHistory({ history }: CaseHistoryProps) {
  function formatDate(isoDate: string) {
    try {
      const d = new Date(isoDate);
      if (isNaN(d.getTime())) return isoDate;
      return d.toLocaleString('es-CL', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
    } catch {
      return isoDate;
    }
  }

  return (
    <aside className="case-history-sidebar" aria-labelledby="history-heading">
      <h3 id="history-heading">Historial del caso</h3>
      {history.length === 0 ? (
        <p className="history-empty">No hay eventos registrados en el historial.</p>
      ) : (
        <ol className="history-timeline">
          {history.map((entry, index) => {
            const isInitial = !entry.previousStatus;
            return (
              <li key={index} className="history-item">
                <div className="history-marker" aria-hidden="true" />
                <div className="history-content">
                  <div className="history-transition">
                    {isInitial ? (
                      <span className="history-tag initial">Caso registrado: {entry.newStatus}</span>
                    ) : (
                      <span className="history-tag">
                        <strong>{entry.previousStatus}</strong> → <strong>{entry.newStatus}</strong>
                      </span>
                    )}
                  </div>
                  <time className="history-date" dateTime={entry.changedAt}>
                    {formatDate(entry.changedAt)}
                  </time>
                  {entry.note && <p className="history-note">{entry.note}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </aside>
  );
}
