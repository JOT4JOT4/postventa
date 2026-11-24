import { INestApplication } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { AuthService } from '../../src/auth/auth.service';
import { UserRole } from '../../src/auth/auth.types';

export const authenticatedTestProviders = [
  {
    provide: AuthService,
    useValue: {
      validateToken: () => ({
        user: { id: 'test-admin', name: 'Administrador de prueba', role: UserRole.Administrator },
        expiresAt: 4102444800,
      }),
    },
  },
];

export function installAuthenticatedTestSession(app: INestApplication): void {
  app.use((request: Request, _response: Response, next: NextFunction) => {
    request.headers.cookie ??= 'postventa_session=test-admin-session';
    next();
  });
}
