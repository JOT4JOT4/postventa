import { useReturn } from './use-return';

type ReturnFormState = ReturnType<typeof useReturn>;

export function ReturnForm({ form }: { form: ReturnFormState }) {
  const selected = form.products.find(item => String(item.purchaseItemId) === form.purchaseItemId);
  return (
    <form className="return-form" onSubmit={event => { event.preventDefault(); void form.submit(); }}>
      <div className="field-group">
        <label htmlFor="return-product">Producto a devolver</label>
        <select id="return-product" required disabled={form.busy} value={form.purchaseItemId}
          onChange={event => form.setPurchaseItemId(event.target.value)} aria-describedby="return-product-help">
          <option value="">Selecciona un producto</option>
          {form.products.map(item => <option key={item.purchaseItemId} value={item.purchaseItemId}
            disabled={item.availableQuantity === 0}>
            {item.productName} (#{item.productId}) · Línea #{item.purchaseItemId}
          </option>)}
        </select>
        <small id="return-product-help">Solo se incluyen las líneas de compra asociadas al caso.
          {selected && ` Compradas: ${selected.purchasedQuantity}; aún no devueltas: ${selected.availableQuantity}.`}
        </small>
      </div>
      <div className="return-input-grid">
        <div className="field-group">
          <label htmlFor="return-quantity">Cantidad a devolver</label>
          <input id="return-quantity" type="text" inputMode="numeric" required maxLength={10}
            value={form.quantity} disabled={form.busy} onChange={event => form.setQuantity(event.target.value)} />
        </div>
        <div className="field-group">
          <label htmlFor="return-date">Fecha de devolución</label>
          <input id="return-date" type="date" required value={form.returnDate} disabled={form.busy}
            onChange={event => form.setReturnDate(event.target.value)} />
        </div>
      </div>
      <div className="field-group">
        <label htmlFor="return-reason">Motivo de devolución</label>
        <textarea id="return-reason" required rows={3} maxLength={2000} value={form.reason}
          disabled={form.busy} onChange={event => form.setReason(event.target.value)} />
      </div>
      <div className="card-actions"><button type="submit" className="primary-button" disabled={form.busy}>
        Registrar devolución
      </button></div>
    </form>
  );
}
