import { ReturnForm } from './ReturnForm';
import type { ReceptionStatus } from './return-api';
import { useReturn } from './use-return';
import './return.css';

interface Props {
  caseId: number;
  status: string;
  stepNumber?: string;
  requirement?: 'required' | 'optional';
}

function receptionBadgeClass(status: ReceptionStatus): string {
  if (status === 'Recibida apta') return 'return-badge apt';
  if (status === 'Recibida con daño') return 'return-badge damaged';
  return 'return-badge pending';
}

function formatReceptionDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
}

export function ReturnSection({ caseId, status, stepNumber = '05', requirement }: Props) {
  const form = useReturn(caseId);
  const record = form.record;
  const reception = form.reception;
  return (
    <section className="case-card return-card" aria-labelledby="return-heading" aria-busy={form.busy}>
      <h2 id="return-heading" className="card-title">
        <span>{stepNumber}</span> Devolución de producto
        {requirement && (
          <small className={`action-requirement ${requirement}`}>
            {requirement === 'required' ? 'Obligatorio' : 'Opcional'}
          </small>
        )}
      </h2>
      <p className="section-desc">Registra la devolución autorizada del caso y consulta la evidencia de recepción
        física registrada por Inventario.</p>
      <button type="button" className="secondary-button" disabled={form.busy} onClick={() => void form.load()}>
        {form.busy ? 'Procesando devolución…' : form.loaded ? 'Actualizar devolución' : 'Consultar devolución'}
      </button>
      {form.error && <p role="alert" className="form-error">{form.error}</p>}
      {form.loaded && form.warehouse && (
        <div className="return-inventory-box">
          <strong>Bodega de envío</strong>
          <p>{form.warehouse.name} (#{form.warehouse.id}) · {form.warehouse.address}</p>
        </div>
      )}
      {form.loaded && record ? <div className="return-summary">
        <p role="status">Devolución #{record.id} registrada</p>
        <dl className="info-grid">
          <div><dt>Producto devuelto</dt><dd>{record.productName} (#{record.productId})</dd></div>
          <div><dt>Cantidad</dt><dd>{record.quantity}</dd></div>
          <div><dt>Fecha de devolución</dt><dd><time dateTime={record.returnDate}>
            {record.returnDate.split('-').reverse().join('-')}
          </time></dd></div>
          <div><dt>Caso original</dt><dd>#{record.caseId}</dd></div>
          <div><dt>Compra original</dt><dd>#{record.purchaseId} · Línea #{record.purchaseItemId}</dd></div>
          <div><dt>Cliente</dt><dd>#{record.customerId}</dd></div>
        </dl>
        <p className="return-reason"><strong>Motivo de devolución</strong><br />{record.reason}</p>
        {reception && (
          <div className="return-reception" aria-label="Recepción en Inventario">
            <div className="return-reception-header">
              <strong>Recepción en Inventario</strong>
              <span className={receptionBadgeClass(reception.status)}>{reception.status}</span>
            </div>
            {reception.status === 'Pendiente de recepción' ? (
              <p className="return-reception-detail">
                Aún no se registra la recepción física en bodega. Usa «Actualizar devolución» para verificar.
              </p>
            ) : (
              <dl className="info-grid return-reception-meta">
                <div>
                  <dt>Bodega receptora</dt>
                  <dd>{reception.warehouseName ?? `Bodega #${reception.warehouseId}`}
                    {reception.warehouseId !== null ? ` (#${reception.warehouseId})` : ''}</dd>
                </div>
                <div>
                  <dt>Cantidad recibida</dt>
                  <dd>{reception.quantity}</dd>
                </div>
                {reception.recordedAt && (
                  <div>
                    <dt>Fecha de recepción</dt>
                    <dd><time dateTime={reception.recordedAt}>{formatReceptionDate(reception.recordedAt)}</time></dd>
                  </div>
                )}
                <div>
                  <dt>Resultado en stock</dt>
                  <dd>{reception.status === 'Recibida apta'
                    ? 'Reingresada al stock disponible (DEVOLUCION)'
                    : 'Registrada con daño / merma (DEVOLUCION + AJUSTE)'}</dd>
                </div>
              </dl>
            )}
          </div>
        )}
      </div> : form.loaded && status === 'Aprobado' ? (
        form.products.some(item => item.availableQuantity > 0) ? <ReturnForm form={form} /> :
          <p className="return-notice">No hay productos del caso con unidades disponibles para devolver.</p>
      ) : form.loaded ? <p className="return-notice">No hay devolución registrada. Solo puede registrarse cuando el caso esté aprobado.</p> : null}
    </section>
  );
}
