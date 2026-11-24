export enum UserRole {
  Administrator = 'Administrador',
  Coordinator = 'Coordinador',
  Operator = 'Operador',
}

export const ALL_USER_ROLES = Object.values(UserRole);

export interface AuthenticatedUser {
  id: string;
  name: string;
  role: UserRole;
}

export interface AuthSession {
  user: AuthenticatedUser;
  expiresAt: number;
}
