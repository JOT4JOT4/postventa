import { CaseStatus } from './CaseStatus';
import { useCaseList } from './use-case-list';
import './case-management.css';
import './case-list.css';

function formatDate(isoDate: string | null) {
  if (!isoDate) return 'Sin fecha registrada';
  const d = new Date(isoDate);
  return isNaN(d.getTime()) ? isoDate : d.toLocaleDateString('es-CL');
}

export function CaseList() {
  const { cases, loading, error, reload } = useCaseList();

  return (
    <main className="postventa-page">
      <header className="module-header">
        <strong>mini-ERP <span>/</span> Postventa</strong>
        <span className="module-label">Consulta de casos</span>
      </header>

      <div className="case-management-layout" aria-busy={loading}>
        <header className="case-list-intro">
          <p className="breadcrumb">POSTVENTA / CASOS</p>
          <h1>Casos de Postventa</h1>
          <p>Consulta los casos registrados, su tipo y su estado actual.</p>
        </header>

        {loading ? (
          <p className="loading-indicator">Cargando casos…</p>
        ) : error ? (
          <div className="error-panel" role="alert">
            <h2>Error al cargar los casos</h2>
            <p>{error}</p>
            <div className="error-actions">
              <button type="button" className="secondary-button case-list-action" onClick={() => void reload()}>
                Reintentar
              </button>
            </div>
          </div>
        ) : cases.length === 0 ? (
          <div className="case-list-empty">
            <p>Aún no hay casos registrados.</p>
            <a href="#/" className="case-link">Registrar una solicitud →</a>
          </div>
        ) : (
          <div className="case-table-wrapper">
            <table className="case-table">
              <caption>{cases.length === 1 ? '1 caso registrado' : `${cases.length} casos registrados`}</caption>
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Fecha de registro</th>
                  <th scope="col">Compra</th>
                  <th scope="col">Cliente</th>
                  <th scope="col"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {cases.map((item) => (
                  <tr key={item.id}>
                    <th scope="row">#{item.id}</th>
                    <td>{item.type ?? <span className="case-table-missing">Sin tipo registrado</span>}</td>
                    <td><CaseStatus status={item.status} live={false} /></td>
                    <td>{formatDate(item.createdAt)}</td>
                    <td>#{item.purchaseId}</td>
                    <td>#{item.customerId}</td>
                    <td>
                      <a href={`#/casos/${item.id}`} className="case-link" aria-label={`Ver detalle del caso #${item.id}`}>
                        Ver detalle
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
