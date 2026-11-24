import { useEffect, useRef, useState } from 'react';
import { AuthenticatedUser, closeSession, initializeSession } from './auth/auth-api';
import { CaseList } from './cases/CaseList';
import { CaseManagement } from './cases/CaseManagement';
import { RegistrationForm } from './requests/RegistrationForm';

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
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const sessionPromise = useRef<Promise<AuthenticatedUser> | null>(null);

  useEffect(() => {
    const onHashChange = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    let active = true;
    sessionPromise.current ??= initializeSession();
    void sessionPromise.current.then(
      (authenticatedUser) => {
        if (active) {
          setUser(authenticatedUser);
          setAuthLoading(false);
        }
      },
      (error: unknown) => {
        if (active) {
          setAuthError(error instanceof Error ? error.message : 'No fue posible validar el acceso.');
          setAuthLoading(false);
        }
      },
    );
    return () => {
      active = false;
    };
  }, []);

  const logout = async () => {
    try {
      await closeSession();
      setUser(null);
      setAuthError('Sesión cerrada. Inicia sesión desde el módulo principal para volver a entrar.');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'No fue posible cerrar la sesión.');
    }
  };

  if (authLoading) {
    return (
      <main className="postventa-page">
        <header className="module-header"><strong>mini-ERP <span>/</span> Postventa</strong></header>
        <p className="mx-auto max-w-xl px-6 py-12 text-center" role="status">Validando acceso…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="postventa-page">
        <header className="module-header"><strong>mini-ERP <span>/</span> Postventa</strong></header>
        <section className="mx-auto max-w-xl px-6 py-12 text-center" role="alert">
          <h1 className="mb-3 text-2xl font-bold">Acceso a Postventa</h1>
          <p>{authError ?? 'Inicia sesión desde el módulo principal y vuelve a entrar mediante el enlace de Postventa.'}</p>
          {authError && <p className="mt-3">Inicia sesión desde el módulo principal y vuelve a entrar mediante el enlace de Postventa.</p>}
        </section>
      </main>
    );
  }

  const section = route.name === 'registration' ? 'registration' : route.name === 'not-found' ? null : 'cases';
  const linkClass = (active: boolean) =>
    `rounded px-3 py-1.5 font-semibold text-[#d8deea] hover:bg-white/10 hover:text-white ` +
    `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8fb3f5] ` +
    (active ? 'bg-white/15 text-white' : '');

  return (
    <>
      <nav aria-label="Secciones de Postventa" className="flex flex-wrap gap-2 bg-[#16203a] px-[5vw] py-2 text-sm">
        <a href="#/" className={linkClass(section === 'registration')}
          aria-current={section === 'registration' ? 'page' : undefined}>
          Registrar solicitud
        </a>
        <a href="#/casos" className={linkClass(section === 'cases')}
          aria-current={section === 'cases' ? 'page' : undefined}>
          Casos
        </a>
        <span className="ml-auto self-center text-[#d8deea]" aria-label="Usuario autenticado">
          {user.name} · {user.role}
        </span>
        <button type="button" className={linkClass(false)} onClick={() => void logout()}>
          Salir
        </button>
      </nav>
      {authError && <p className="bg-red-50 px-[5vw] py-2 text-sm text-red-800" role="alert">{authError}</p>}
      {route.name === 'registration' && (
        <RegistrationForm onNavigateToCase={(id) => navigate(`#/casos/${id}`)} />
      )}
      {route.name === 'cases' && <CaseList />}
      {route.name === 'case' && (
        <CaseManagement key={route.id} caseId={route.id} canManage={user.role !== 'Operador'}
          onBack={() => navigate('#/casos')} />
      )}
      {route.name === 'not-found' && (
        <main className="postventa-page">
          <header className="module-header">
            <strong>mini-ERP <span>/</span> Postventa</strong>
          </header>
          <div className="mx-auto max-w-xl px-6 py-12 text-center">
            <h1 className="mb-3 text-2xl font-bold">Página no encontrada</h1>
            <p className="mb-6 text-[#566176]">La dirección indicada no corresponde a ninguna sección ni caso válido.</p>
            <a href="#/casos" className="case-link">Ir a la lista de casos →</a>
          </div>
        </main>
      )}
    </>
  );
}

export default App;
