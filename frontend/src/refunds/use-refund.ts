import { useRef, useState } from 'react';
import { createRefund, listRefunds } from './refund-api';
import type { Refund } from './refund-api';

export function useRefund(caseId: number) {
  const [refund, setRefund] = useState<Refund | null>(null);
  const [amount, setAmount] = useState('');
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
      setError(failure instanceof Error ? failure.message : 'No fue posible acceder al reembolso.');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  function load() {
    return operation(async () => {
      const rows = await listRefunds(caseId);
      setRefund(rows[0] ?? null);
      setLoaded(true);
    });
  }

  async function submit() {
    if (refund || !loaded) return;
    const normalized = amount.trim().replace(',', '.');
    if (!/^(?:[1-9]\d{0,12}(?:\.\d{1,2})?|0\.(?:0[1-9]|[1-9]\d?))$/.test(normalized)) {
      setError('Ingresa un monto positivo, sin separador de miles y con hasta dos decimales.');
      return;
    }
    return operation(async () => { setRefund(await createRefund(caseId, normalized)); });
  }

  return { refund, amount, setAmount, loaded, busy, error, load, submit };
}
