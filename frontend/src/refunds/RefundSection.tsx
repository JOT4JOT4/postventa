import { useRefund } from './use-refund';
import './refund.css';

interface Props {
  caseId: number;
  status: string;
}

export function RefundSection({ caseId, status }: Props) {
  const form = useRefund(caseId);
  const approved = status === 'Aprobado';
  return (
    <section className="case-card refund-card" aria-labelledby="refund-heading" aria-busy={form.busy}>
      <h2 id="refund-heading" className="card-title"><span>05</span> Solicitud de reembolso</h2>
      <p className="section-desc">Registra la solicitud asociada al caso. El registro queda pendiente de procesamiento.</p>
      <button type="button" className="secondary-button" disabled={form.busy} onClick={() => void form.load()}>
        {form.busy ? 'Procesando reembolso…' : form.loaded ? 'Actualizar reembolso' : 'Consultar reembolso'}
      </button>
      {form.error && <p role="alert" className="form-error">{form.error}</p>}
      {form.loaded && form.refund ? (
        <div className="refund-summary">
          <p role="status">Solicitud de reembolso #{form.refund.id} · <strong>{form.refund.status}</strong></p>
          <dl className="info-grid">
            <div><dt>Monto solicitado</dt><dd>{Number(form.refund.amount).toLocaleString('es-CL', {
              minimumFractionDigits: 2, maximumFractionDigits: 2,
            })}</dd></div>
            <div><dt>Caso</dt><dd>#{form.refund.caseId}</dd></div>
            <div><dt>Compra original</dt><dd>#{form.refund.purchaseId}</dd></div>
            <div><dt>Cliente</dt><dd>#{form.refund.customerId}</dd></div>
            <div><dt>Fecha de solicitud</dt><dd><time dateTime={form.refund.requestedAt}>
              {new Date(form.refund.requestedAt).toLocaleString('es-CL')}
            </time></dd></div>
          </dl>
        </div>
      ) : form.loaded && approved ? (
        <form className="refund-form" onSubmit={event => { event.preventDefault(); void form.submit(); }}>
          <div className="field-group">
            <label htmlFor="refund-amount">Monto a reembolsar</label>
            <input id="refund-amount" type="text" inputMode="decimal" required maxLength={16}
              value={form.amount} disabled={form.busy} aria-describedby="refund-amount-help"
              onChange={event => form.setAmount(event.target.value)} />
            <small id="refund-amount-help">Sin separador de miles; se admite punto o coma y hasta dos decimales.</small>
          </div>
          <div className="card-actions"><button type="submit" className="primary-button"
            disabled={form.busy || !form.amount.trim()}>Registrar solicitud de reembolso</button></div>
        </form>
      ) : form.loaded ? <p className="refund-notice">No hay reembolso registrado. Solo puede solicitarse cuando el caso esté aprobado.</p> : null}
    </section>
  );
}
