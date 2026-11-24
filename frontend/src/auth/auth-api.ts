export type UserRole = 'Administrador' | 'Coordinador' | 'Operador';

export interface AuthenticatedUser {
  id: string;
  name: string;
  role: UserRole;
}

const apiUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

async function authRequest<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiUrl}/auth/${path}`, {
      ...options,
      credentials: 'include',
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor de Postventa.');
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { message?: string | string[] };
    throw new Error(Array.isArray(body.message) ? body.message.join(' ') :
      body.message ?? 'No fue posible validar el acceso a Postventa.');
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function initializeSession(): Promise<AuthenticatedUser> {
  const url = new URL(window.location.href);
  const token = url.searchParams.get('sso_token');
  if (token) {
    url.searchParams.delete('sso_token');
    window.history.replaceState(window.history.state, '', url.toString());
    return authRequest<AuthenticatedUser>('session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
  }
  return authRequest<AuthenticatedUser>('me');
}

export function closeSession(): Promise<void> {
  return authRequest<void>('logout', { method: 'POST' });
}
