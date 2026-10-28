import { useCaseManagement } from './use-case-management';
type Management = ReturnType<typeof useCaseManagement>;
export function CaseResolutionForm({ management }: { management: Management }) {
  const { caseDetail, busy, resolutionText, setResolutionText, registerResolution } = management;
  if (!caseDetail) return null;
  const isTerminal = caseDetail.status === 'Rechazado' || caseDetail.status === 'Cerrado';
  const hasResolution = Boolean(caseDetail.resolution);
  return (

            <section className="case-card" aria-labelledby="resolution-heading">
              <h2 id="resolution-heading" className="card-title">
                <span>04</span> Resolución final
              </h2>

              {hasResolution && caseDetail.resolution ? (
                <div className="resolution-card resolved">
                  <div className="resolution-header">
                    <span className="resolution-badge">Resolución registrada</span>
                    <time dateTime={caseDetail.resolution.resolvedAt}>
                      {new Date(caseDetail.resolution.resolvedAt).toLocaleString('es-CL')}
                    </time>
                  </div>
                  <p className="resolution-text">{caseDetail.resolution.text}</p>
                </div>
              ) : isTerminal ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void registerResolution();
                  }}
                  className="resolution-form"
                >
                  <p className="section-desc">
                    El caso ha sido <strong>{caseDetail.status}</strong>. Registra la resolución final
                    para dejar constancia del resultado de la atención.
                  </p>
                  <div className="field-group">
                    <label htmlFor="resolution-text">Texto de resolución final</label>
                    <textarea
                      id="resolution-text"
                      required
                      rows={3}
                      maxLength={4000}
                      disabled={busy}
                      value={resolutionText}
                      onChange={(e) => setResolutionText(e.target.value)}
                      placeholder="Indica la solución acordada o causa de cierre/rechazo entregada al cliente…"
                    />
                    <p className="char-count">{resolutionText.length}/4000 caracteres</p>
                  </div>
                  <div className="card-actions">
                    <button
                      type="submit"
                      className="primary-button"
                      disabled={busy || !resolutionText.trim()}
                    >
                      {busy ? 'Registrando…' : 'Registrar resolución final'}
                    </button>
                  </div>
                </form>
              ) : (
                <p className="resolution-locked-note">
                  La resolución final se habilitará una vez que el caso sea derivado a un estado terminal
                  (<strong>Rechazado</strong> o <strong>Cerrado</strong>).
                </p>
              )}
            </section>
  );
}
