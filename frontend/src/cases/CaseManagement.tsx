import { CaseStatus } from './CaseStatus';
import { CaseHistory } from './CaseHistory';
import { useCaseManagement } from './use-case-management';
import { CaseInformation } from './CaseInformation';
import { CaseStatusForm } from './CaseStatusForm';
import { CaseResolutionForm } from './CaseResolutionForm';
import './case-management.css';

interface CaseManagementProps {
  caseId: number;
  onBack?: () => void;
}

export function CaseManagement({ caseId, onBack }: CaseManagementProps) {
  const management = useCaseManagement(caseId);
  const { caseDetail, history, loading, error, successMessage, reload } = management;

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
            <CaseInformation caseDetail={caseDetail} />
            <CaseStatusForm management={management} />
            <CaseResolutionForm management={management} />
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
