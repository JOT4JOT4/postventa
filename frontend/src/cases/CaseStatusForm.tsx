import { useCaseManagement } from './use-case-management';
type Management = ReturnType<typeof useCaseManagement>;
import { CaseStatusValue, STATUS_TRANSITIONS } from './case-api';
export function CaseStatusForm({ management }: { management: Management }) {
  const { caseDetail, busy, description, setDescription, selectedStatus, setSelectedStatus,
    statusNote, setStatusNote, saveStatusAndDetails } = management;
  if (!caseDetail) return null;
  const currentStatus = caseDetail.status;
  const isTerminal = currentStatus === 'Rechazado' || currentStatus === 'Cerrado';
  const allowedNextStatuses = STATUS_TRANSITIONS[currentStatus] ?? [];
  const statusOptions: CaseStatusValue[] = [currentStatus, ...allowedNextStatuses];
  return <>
            {/* 2. Descripción / Detalle del reclamo */}
            <section className="case-card" aria-labelledby="description-heading">
              <h2 id="description-heading" className="card-title">
                <span>02</span> Detalle del problema reportado
              </h2>
              <p className="section-desc">
                Complementa o edita la descripción del reclamo proporcionada por el cliente.
              </p>
              <div className="field-group">
                <label htmlFor="case-description">Descripción del reclamo</label>
                <textarea
                  id="case-description"
                  rows={4}
                  maxLength={4000}
                  disabled={busy || isTerminal}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Escribe el detalle completo de la falla, reclamo o problema informado…"
                />
                <p className="char-count">{description.length}/4000 caracteres</p>
              </div>
            </section>

            {/* 3. Gestión del Estado */}
            <section className="case-card" aria-labelledby="status-management-heading">
              <h2 id="status-management-heading" className="card-title">
                <span>03</span> Actualización de estado
              </h2>
              {isTerminal ? (
                <div className="terminal-status-notice">
                  <p>
                    El caso se encuentra en estado terminal <strong>{caseDetail.status}</strong>.
                    No se permiten transiciones adicionales de estado.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void saveStatusAndDetails();
                  }}
                  className="status-form"
                >
                  <div className="field-group">
                    <label htmlFor="case-status-select">Nuevo estado</label>
                    <select
                      id="case-status-select"
                      value={selectedStatus}
                      disabled={busy}
                      onChange={(e) => setSelectedStatus(e.target.value as CaseStatusValue)}
                    >
                      {statusOptions.map((st) => (
                        <option key={st} value={st}>
                          {st} {st === currentStatus ? '(Estado actual)' : ''}
                        </option>
                      ))}
                    </select>
                    <small className="field-hint">
                      Transiciones permitidas desde {currentStatus}:{' '}
                      {allowedNextStatuses.length > 0
                        ? allowedNextStatuses.join(', ')
                        : 'Ninguna (estado terminal)'}
                    </small>
                  </div>

                  <div className="field-group">
                    <label htmlFor="case-status-note">{selectedStatus === 'Rechazado' ? 'Motivo del rechazo' : 'Nota del cambio (opcional)'}</label>
                    <textarea
                      id="case-status-note"
                      required={selectedStatus === 'Rechazado'}
                      rows={2}
                      maxLength={2000}
                      disabled={busy}
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="Motivo o justificación del cambio de estado para la bitácora…"
                    />
                    <p className="char-count">{statusNote.length}/2000 caracteres</p>
                  </div>

                  <div className="card-actions">
                    <button
                      type="submit"
                      className="primary-button"
                      disabled={busy || (selectedStatus === currentStatus && description === (caseDetail.description ?? ''))}
                    >
                      {busy ? 'Guardando…' : 'Guardar y actualizar'}
                    </button>
                  </div>
                </form>
              )}
            </section>

  </>;
}
