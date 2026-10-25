import type { Purchase } from './request-api';

interface Props {
  purchaseId: string;
  purchase: Purchase | null;
  selected: number[];
  disabled: boolean;
  onChange: (id: string) => void;
  onLoad: () => void;
  onToggle: (id: number) => void;
}

export function PurchaseFields(props: Props) {
  return (
    <section aria-labelledby="purchase-heading" className="registration-section">
      <h2 id="purchase-heading"><span>01</span> Venta asociada</h2>
      <p className="field-help">El cliente y los productos se obtienen de la venta original.</p>
      <label htmlFor="purchase-id">Identificador de venta</label>
      <div className="purchase-search">
        <input id="purchase-id" type="number" min="1" max="2147483647" step="1"
          value={props.purchaseId} disabled={props.disabled}
          onChange={(event) => props.onChange(event.target.value)} placeholder="Ingresa el número de venta" />
        <button type="button" className="secondary-button" disabled={props.disabled}
          onClick={props.onLoad}>Cargar compra</button>
      </div>
      {props.purchase && (
        <>
          <div className="customer-summary">
            <span>Cliente de la venta</span>
            <strong>{props.purchase.customer.name}</strong>
            <small>Identificador: {props.purchase.customer.id}</small>
          </div>
          <fieldset disabled={props.disabled}>
            <legend>Productos involucrados <small>(selecciona al menos uno)</small></legend>
            {props.purchase.items.length === 0 && <p>Esta compra no tiene productos disponibles.</p>}
            {props.purchase.items.map((item) => (
              <label className="product-option" key={item.id}>
                <input type="checkbox" checked={props.selected.includes(item.id)}
                  onChange={() => props.onToggle(item.id)} />
                <span>{item.productName}<small>Producto {item.productId} · Línea {item.id}</small></span>
              </label>
            ))}
          </fieldset>
        </>
      )}
    </section>
  );
}
