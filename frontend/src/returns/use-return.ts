import { useRef, useState } from 'react';
import { createReturn, getReturns } from './return-api';
import type { ProductReturn, ReturnProduct, ReturnReception, ReturnWarehouse } from './return-api';
import { isReturnDate, today } from './return-validation';

const PENDING_RECEPTION: ReturnReception = {
  status: 'Pendiente de recepción',
  warehouseId: null,
  warehouseName: null,
  quantity: null,
  recordedAt: null,
  movements: [],
};

export function useReturn(caseId: number) {
  const [record, setRecord] = useState<ProductReturn | null>(null);
  const [products, setProducts] = useState<ReturnProduct[]>([]);
  const [warehouse, setWarehouse] = useState<ReturnWarehouse | null>(null);
  const [reception, setReception] = useState<ReturnReception | null>(null);
  const [purchaseItemId, setPurchaseItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [returnDate, setReturnDate] = useState(today);
  const [reason, setReason] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);

  async function operation(action: () => Promise<void>) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try { await action(); }
    catch (failure) {
      setError(failure instanceof Error ? failure.message : 'No fue posible acceder a las devoluciones.');
    } finally { inFlight.current = false; setBusy(false); }
  }

  function load() {
    return operation(async () => {
      const data = await getReturns(caseId);
      setRecord(data.returns[0] ?? null);
      setProducts(data.products);
      setWarehouse(data.warehouse ?? null);
      setReception(data.reception ?? null);
      setLoaded(true);
    });
  }

  async function submit() {
    if (record || !loaded) return;
    const product = products.find(item => String(item.purchaseItemId) === purchaseItemId);
    if (!product) { setError('Selecciona un producto asociado al caso.'); return; }
    if (!/^[1-9]\d{0,9}$/.test(quantity) || Number(quantity) > 2147483647) {
      setError('Ingresa una cantidad entera mayor que cero.'); return;
    }
    if (Number(quantity) > product.availableQuantity) {
      setError('La cantidad supera las unidades compradas aún no devueltas. Actualiza la consulta.'); return;
    }
    if (!isReturnDate(returnDate)) { setError('Ingresa una fecha de devolución válida.'); return; }
    if (!reason.trim() || reason.trim().length > 2000) {
      setError('El motivo debe contener entre 1 y 2000 caracteres.'); return;
    }
    return operation(async () => {
      const created = await createReturn(caseId, {
        purchaseItemId: product.purchaseItemId,
        quantity: Number(quantity),
        returnDate,
        reason: reason.trim(),
      });
      setRecord(created);
      setReception(PENDING_RECEPTION);
    });
  }

  return {
    record, products, warehouse, reception, purchaseItemId, setPurchaseItemId, quantity, setQuantity,
    returnDate, setReturnDate, reason, setReason, loaded, busy, error, load, submit,
  };
}
