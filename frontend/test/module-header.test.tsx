import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModuleHeader } from '../src/layout/ModuleHeader';

describe('Cabecera compartida de Postventa', () => {
  it.each(['registration', 'cases'] as const)('identifica la sección activa %s y mantiene destinos existentes', activeSection => {
    render(<ModuleHeader activeSection={activeSection} />);
    expect(screen.getByRole('link', { name: 'LesGo · Inicio de Postventa' })).toHaveAttribute('href', '#/');
    const registration = screen.getByRole('link', { name: 'Registrar solicitud' });
    const cases = screen.getByRole('link', { name: 'Casos' });
    expect(registration).toHaveAttribute('href', '#/');
    expect(cases).toHaveAttribute('href', '#/casos');
    const active = activeSection === 'registration' ? registration : cases;
    const inactive = activeSection === 'registration' ? cases : registration;
    expect(active).toHaveAttribute('aria-current', 'page');
    expect(inactive).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('navigation', { name: 'Secciones de Postventa' })).toContainElement(active);
  });

  it('no marca una sección activa para una ruta inexistente', () => {
    render(<ModuleHeader activeSection={null} />);
    expect(screen.getByRole('link', { name: 'Casos' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Registrar solicitud' })).not.toHaveAttribute('aria-current');
  });

  it('permite saltar al contenido con teclado sin cambiar la ruta por hash', async () => {
    window.history.replaceState(null, '', '/#/casos');
    render(<><ModuleHeader activeSection="cases" /><main id="main-content" tabIndex={-1}>Casos registrados</main></>);
    const user = userEvent.setup();
    await user.tab();
    expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('main')).toHaveFocus();
    expect(window.location.hash).toBe('#/casos');
  });
});
