import { useEffect, useState } from 'react';
import { CaseList } from './cases/CaseList';
import { CaseManagement } from './cases/CaseManagement';
import { RegistrationForm } from './requests/RegistrationForm';
import { ModuleHeader } from './layout/ModuleHeader';

type Route =
  | { name: 'registration' }
  | { name: 'cases' }
  | { name: 'case'; id: number }
  | { name: 'not-found' };

const MAX_CASE_ID = 2147483647;

function parseCaseId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return id >= 1 && id <= MAX_CASE_ID ? id : null;
}

function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, '').replace(/\/+$/, '');
  if (path === '') return { name: 'registration' };
  if (path === '/casos') return { name: 'cases' };
  const match = /^\/casos\/([^/]+)$/.exec(path);
  const id = match ? parseCaseId(match[1]) : null;
  return id !== null ? { name: 'case', id } : { name: 'not-found' };
}

/** Convierte los enlaces anteriores `?caseId=N` (HU-04) en la ruta `#/casos/N`. */
function initialRoute(): Route {
  const url = new URL(window.location.href);
  const legacyId = parseCaseId(url.searchParams.get('caseId') ?? '');
  if (legacyId !== null) {
    url.searchParams.delete('caseId');
    url.hash = `#/casos/${legacyId}`;
    window.history.replaceState(window.history.state, '', url.toString());
  }
  return parseRoute(window.location.hash);
}

function navigate(hash: string) {
  window.location.hash = hash;
}

function App() {
  const [route, setRoute] = useState<Route>(initialRoute);

  useEffect(() => {
    const onHashChange = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const section = route.name === 'registration' ? 'registration' : route.name === 'not-found' ? null : 'cases';
  return (
    <div className="app-shell">
      <ModuleHeader activeSection={section} />
      {route.name === 'registration' && (
        <RegistrationForm onNavigateToCase={(id) => navigate(`#/casos/${id}`)} />
      )}
      {route.name === 'cases' && <CaseList />}
      {route.name === 'case' && (
        <CaseManagement key={route.id} caseId={route.id} onBack={() => navigate('#/casos')} />
      )}
      {route.name === 'not-found' && (
        <main id="main-content" tabIndex={-1} className="postventa-page">
          <div className="not-found-page">
            <h1>Página no encontrada</h1>
            <p>La dirección indicada no corresponde a ninguna sección ni caso válido.</p>
            <a href="#/casos" className="case-link">Ir a la lista de casos →</a>
          </div>
        </main>
      )}
    </div>
  );
}

export default App;
