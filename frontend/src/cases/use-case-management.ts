import { useCallback, useEffect, useState } from 'react';
import {
  CaseDetail,
  CaseHistoryEntry,
  CaseStatusValue,
  getCase,
  getCaseHistory,
  resolveCase,
  updateStatus,
} from './case-api';

export function useCaseManagement(caseId: number) {
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [history, setHistory] = useState<CaseHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [description, setDescription] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<CaseStatusValue>('Abierto');
  const [statusNote, setStatusNote] = useState('');
  const [resolutionText, setResolutionText] = useState('');

  const loadCase = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [detail, hist] = await Promise.all([
        getCase(caseId),
        getCaseHistory(caseId),
      ]);
      setCaseDetail(detail);
      setHistory(hist);
      setDescription(detail.description ?? '');
      setSelectedStatus(detail.status);
      if (detail.resolution) {
        setResolutionText(detail.resolution.text);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el caso.');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    void loadCase();
  }, [loadCase]);

  const saveStatusAndDetails = async () => {
    if (!caseDetail) return;
    setBusy(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const updated = await updateStatus(caseId, {
        status: selectedStatus,
        description: description.trim() || undefined,
        note: statusNote.trim() || undefined,
      });
      setCaseDetail(updated);
      setSelectedStatus(updated.status);
      setStatusNote('');
      const updatedHist = await getCaseHistory(caseId);
      setHistory(updatedHist);
      setSuccessMessage('El caso ha sido actualizado correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el estado.');
    } finally {
      setBusy(false);
    }
  };

  const registerResolution = async () => {
    if (!caseDetail || !resolutionText.trim()) return;
    setBusy(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await resolveCase(caseId, { resolution: resolutionText.trim() });
      setCaseDetail((prev) =>
        prev
          ? {
              ...prev,
              resolution: {
                text: res.resolution,
                resolvedAt: res.resolvedAt,
              },
            }
          : prev,
      );
      setSuccessMessage('Resolución final registrada exitosamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar la resolución.');
    } finally {
      setBusy(false);
    }
  };

  return {
    caseDetail,
    history,
    loading,
    busy,
    error,
    successMessage,
    description,
    setDescription,
    selectedStatus,
    setSelectedStatus,
    statusNote,
    setStatusNote,
    resolutionText,
    setResolutionText,
    saveStatusAndDetails,
    registerResolution,
    reload: loadCase,
  };
}
