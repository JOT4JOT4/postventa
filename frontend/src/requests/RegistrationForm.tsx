import { REQUEST_TYPES } from './request-api';
import { PurchaseFields } from './PurchaseFields';
import { useRegistration } from './use-registration';
import './registration.css';

export function RegistrationForm() {
  const form = useRegistration();
  const locked = form.busy || Boolean(form.result);
  return (
    <main className="postventa-page">
      <header className="module-header"><strong>mini-ERP <span>/</span> Postventa</strong>
        <span className="module-label">Registro de solicitudes</span></header>
      <div className="registration-layout">
        <header className="page-intro">
          <p className="eyebrow">POSTVENTA / NUEVA SOLICITUD</p>
          <h1>Registrar solicitud</h1>
          <p>Inicia un caso asociado a una compra e identifica los productos involucrados.</p>
          <div className="initial-status">Estado inicial <strong>Abierto</strong></div>
        </header>
        <form className="registration-card" aria-label="Registro de solicitud de Postventa"
          aria-busy={form.busy} onSubmit={(event) => { event.preventDefault(); void form.submit(); }}>
          <PurchaseFields purchaseId={form.purchaseId} purchase={form.purchase}
            selected={form.selected} disabled={locked} onChange={form.changePurchase}
            onLoad={() => void form.loadPurchase()} onToggle={form.toggleItem} />
          <section className="registration-section" aria-labelledby="request-heading">
            <h2 id="request-heading"><span>02</span> Detalle de la solicitud</h2>
            <fieldset disabled={locked}>
              <legend>Tipo de solicitud</legend>
              <div className="request-types">
                {REQUEST_TYPES.map((type) => (
                  <label key={type} className={form.type === type ? 'type-option selected' : 'type-option'}>
                    <input type="radio" name="request-type" value={type} required
                      checked={form.type === type} onChange={() => form.setType(type)} />{type}
                  </label>
                ))}
              </div>
            </fieldset>
            <label htmlFor="request-reason">Motivo de la solicitud</label>
            <textarea id="request-reason" required maxLength={2000} rows={5} disabled={locked}
              value={form.reason} onChange={(event) => form.setReason(event.target.value)}
              placeholder="Explica el motivo de la solicitud." aria-describedby="reason-help" />
            <p id="reason-help" className="field-help">{form.reason.length}/2000 caracteres.</p>
          </section>
          {form.error && <p role="alert" className="form-error">{form.error}</p>}
          {form.result && <div role="status" className="form-success">
            <strong>Solicitud registrada: {form.result.id}</strong>
            <span>Estado: {form.result.status}. Compra: {form.result.purchaseId}.</span>
          </div>}
          <footer className="form-footer">
            <p>Los campos de la solicitud son obligatorios.</p>
            <button className="primary-button" type="submit" disabled={locked || !form.purchase}>
              {form.busy ? 'Procesando…' : form.result ? 'Solicitud registrada' : 'Registrar solicitud'}
            </button>
          </footer>
        </form>
      </div>
    </main>
  );
}
