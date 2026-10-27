import { useEffect, useState } from 'react';
import { CaseManagement } from './cases/CaseManagement';
import { RegistrationForm } from './requests/RegistrationForm';

function getCaseIdFromUrl(): number | null {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('caseId');
  if (!raw) return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function App() {
  const [caseId, setCaseId] = useState<number | null>(getCaseIdFromUrl);

  useEffect(() => {
    const onPopState = () => {
      setCaseId(getCaseIdFromUrl());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigateToCase = (id: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('caseId', String(id));
    window.history.pushState({}, '', url.toString());
    setCaseId(id);
  };

  const navigateToRegistration = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('caseId');
    window.history.pushState({}, '', url.toString());
    setCaseId(null);
  };

  if (caseId !== null) {
    return <CaseManagement caseId={caseId} onBack={navigateToRegistration} />;
  }

  return <RegistrationForm onNavigateToCase={navigateToCase} />;
}

export default App;
