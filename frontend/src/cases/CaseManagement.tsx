import { CaseStatus } from './CaseStatus';
import { CaseHistory } from './CaseHistory';
import { useCaseManagement } from './use-case-management';
import { CaseStatusValue, STATUS_TRANSITIONS } from './case-api';
import './case-management.css';

interface CaseManagementProps {
  caseId: number;
  onBack?: () => void;
}

export function CaseManagement({ caseId, onBack }: CaseManagementProps) {
  const {
    caseDetail,
    history,
    loading,
    busy,
    error,
    successMessage,
    description,
    setDescription,
    selectedStatus,
    setSelectedStatus,
    statusNote,
    setStatusNote,
    resolutionText,
    setResolutionText,
    saveStatusAndDetails,
    registerResolution,
    reload,
  } = useCaseManagement(caseId);

  if (loading) {
    return (
      <main className="postventa-page">
        <header className="module-header">
          <strong>mini-ERP <span>/</span> Postventa</strong>
          <span className="module-label">Gestión de reclamos</span>
        </header>
        <div className="case-management-layout">
          <p className="loading-indicator">Cargando información del caso #{caseId}…</p>
        </div>
      </main>
    );
  }

  if (error && !caseDetail) {
    return (
      <main className="postventa-page">
        <header className="module-header">
          <strong>mini-ERP <span>/</span> Postventa</strong>
          <span className="module-label">Gestión de reclamos</span>
        </header>
        <div className="case-management-layout">
          <div className="error-panel" role="alert">
            <h2>Error al cargar el caso</h2>
            <p>{error}</p>
            <div className="error-actions">
              <button className="secondary-button" onClick={() => void reload()}>
                Reintentar
              </button>
              {onBack && (
                <button className="secondary-button" onClick={onBack}>
                  Volver a solicitudes
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!caseDetail) return null;

  const currentStatus = caseDetail.status;
  const isTerminal = currentStatus === 'Rechazado' || currentStatus === 'Cerrado';
  const allowedNextStatuses = STATUS_TRANSITIONS[currentStatus] ?? [];
  const statusOptions: CaseStatusValue[] = Array.from(
    new Set([currentStatus, ...allowedNextStatuses]),
  );
  const hasResolution = Boolean(caseDetail.resolution);

  return (
    <main className="postventa-page">
      <header className="module-header">
        <strong>mini-ERP <span>/</span> Postventa</strong>
        <span className="module-label">Gestión de reclamos</span>
      </header>

      <div className="case-management-layout">
        <div className="case-top-bar">
          {onBack && (
            <button
              type="button"
              className="back-button"
              onClick={onBack}
              aria-label="Volver a solicitudes"
            >
              ← Volver a solicitudes
            </button>
          )}
          <span className="breadcrumb">POSTVENTA / CASO #{caseDetail.id}</span>
        </div>

        <header className="case-header">
          <div className="case-header-main">
            <h1>Caso #{caseDetail.id}</h1>
            <CaseStatus status={caseDetail.status} size="large" />
          </div>
          <p className="case-meta">
            Compra asociada: <strong>#{caseDetail.purchaseId}</strong> · Cliente: <strong>#{caseDetail.customerId}</strong>
            {caseDetail.createdAt && (
              <> · Registrado el: <span>{new Date(caseDetail.createdAt).toLocaleDateString('es-CL')}</span></>
            )}
          </p>
        </header>

        {error && <div role="alert" className="form-error">{error}</div>}
        {successMessage && <div role="status" className="form-success">{successMessage}</div>}

        <div className="case-grid">
          <div className="case-main-content">
            {/* 1. Datos Generales (Lectura) */}
            <section className="case-card" aria-labelledby="general-info-heading">
              <h2 id="general-info-heading" className="card-title">
                <span>01</span> Información general
              </h2>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Tipo de solicitud</span>
                  <span className="info-value readonly-tag" title="Lectura - HU-03 fuera del alcance">
                    {caseDetail.type ?? 'Reclamo'}
                  </span>
                  <small className="field-hint">Definido en el registro inicial</small>
                </div>
                <div className="info-item">
                  <span className="info-label">Motivo original</span>
                  <p className="info-value reason-box">{caseDetail.reason}</p>
                </div>
                {caseDetail.items.length > 0 && (
                  <div className="info-item full-width">
                    <span className="info-label">Productos involucrados</span>
                    <ul className="items-list">
                      {caseDetail.items.map((itemId) => (
                        <li key={itemId} className="item-pill">
                          Detalle compra #{itemId}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>

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
                    <label htmlFor="case-status-note">Nota del cambio (opcional)</label>
                    <textarea
                      id="case-status-note"
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

            {/* 4. Resolución final */}
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
                    para dar por concluida la atención y alimentar el cálculo de tiempo medio de resolución (MTTR).
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
          </div>

          {/* Lateral History */}
          <div className="case-sidebar-column">
            <CaseHistory history={history} />
          </div>
        </div>
      </div>
    </main>
  );
}
