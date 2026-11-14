import { ReturnForm } from './ReturnForm';
import { useReturn } from './use-return';
import './return.css';

interface Props { caseId: number; status: string }

export function ReturnSection({ caseId, status }: Props) {
  const form = useReturn(caseId);
  const record = form.record;
  return (
    <section className="case-card return-card" aria-labelledby="return-heading" aria-busy={form.busy}>
      <h2 id="return-heading" className="card-title"><span>06</span> Devolución de producto</h2>
      <p className="section-desc">Registra la devolución autorizada del caso con sus antecedentes.
        La recepción en bodega y el movimiento de inventario se gestionan por separado.</p>
      <button type="button" className="secondary-button" disabled={form.busy} onClick={() => void form.load()}>
        {form.busy ? 'Procesando devolución…' : form.loaded ? 'Actualizar devolución' : 'Consultar devolución'}
      </button>
      {form.error && <p role="alert" className="form-error">{form.error}</p>}
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
      </div> : form.loaded && status === 'Aprobado' ? (
        form.products.some(item => item.availableQuantity > 0) ? <ReturnForm form={form} /> :
          <p className="return-notice">No hay productos del caso con unidades disponibles para devolver.</p>
      ) : form.loaded ? <p className="return-notice">No hay devolución registrada. Solo puede registrarse cuando el caso esté aprobado.</p> : null}
    </section>
  );
}
