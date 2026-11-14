import './module-header.css';

interface Props {
  activeSection: 'registration' | 'cases' | null;
}

export function ModuleHeader({ activeSection }: Props) {
  return (
    <header className="lesgo-header">
      <a className="skip-link" href="#main-content" onClick={event => {
        event.preventDefault();
        document.getElementById('main-content')?.focus();
      }}>Saltar al contenido</a>
      <div className="lesgo-header-inner">
        <a className="lesgo-brand" href="#/" aria-label="LesGo · Inicio de Postventa">
          <span className="lesgo-logo">LesGo</span>
          <span className="lesgo-module">ERP · POSTVENTA</span>
        </a>
        <nav className="lesgo-nav" aria-label="Secciones de Postventa">
          <a href="#/" aria-current={activeSection === 'registration' ? 'page' : undefined}>
            Registrar solicitud
          </a>
          <a href="#/casos" aria-current={activeSection === 'cases' ? 'page' : undefined}>Casos</a>
        </nav>
        <span className="lesgo-header-note">Atención después de la compra</span>
      </div>
      <div className="header-studs" aria-hidden="true" />
    </header>
  );
}
