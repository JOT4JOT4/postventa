import { useRef, useState } from 'react';
import { findPurchase, registerRequest } from './request-api';
import type { Purchase, RegisteredRequest, RequestType } from './request-api';

export function useRegistration() {
  const [purchaseId, setPurchaseId] = useState('');
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [type, setType] = useState<RequestType | ''>('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<RegisteredRequest | null>(null);
  const operation = useRef(false);

  function changePurchase(value: string) {
    setPurchaseId(value);
    setPurchase(null);
    setSelected([]);
    setResult(null);
    setError('');
  }

  async function loadPurchase() {
    if (operation.current) return;
    const id = Number(purchaseId);
    if (!Number.isInteger(id) || id < 1 || id > 2147483647) {
      setError('Ingresa un identificador de compra válido.');
      return;
    }
    operation.current = true;
    setBusy(true);
    setError('');
    setPurchase(null);
    setSelected([]);
    setResult(null);
    try {
      setPurchase(await findPurchase(id));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'No se pudo verificar la compra.');
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }

  function toggleItem(id: number) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function submit() {
    if (operation.current || result) return;
    if (!purchase || selected.length === 0 || !type || !reason.trim()) {
      setError('Verifica la compra, selecciona al menos un producto, el tipo y escribe el motivo.');
      return;
    }
    operation.current = true;
    setBusy(true);
    setError('');
    try {
      setResult(await registerRequest({
        purchaseId: purchase.id, purchaseItemIds: selected, type, reason: reason.trim(),
      }));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'No se pudo registrar la solicitud.');
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }

  return {
    purchaseId, changePurchase, purchase, selected, toggleItem, type, setType,
    reason, setReason, busy, error, result, loadPurchase, submit,
  };
}
