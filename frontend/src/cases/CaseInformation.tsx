import { CaseDetail } from './case-api';
export function CaseInformation({ caseDetail }: { caseDetail: CaseDetail }) {
  return (

            <section className="case-card" aria-labelledby="general-info-heading">
              <h2 id="general-info-heading" className="card-title">
                <span>01</span> Información general
              </h2>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Tipo de solicitud</span>
                  <span className="info-value readonly-tag" title="Tipo seleccionado al registrar la solicitud">
                    {caseDetail.type ?? 'Sin tipo registrado'}
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

  );
}
