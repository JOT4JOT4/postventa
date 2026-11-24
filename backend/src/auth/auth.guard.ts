import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { AuthenticatedUser } from './auth.types';

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.readSessionCookie(request.headers.cookie);
    if (!token) {
      throw new UnauthorizedException('Inicia sesión desde el módulo principal para acceder a Postventa.');
    }
    request.user = this.auth.validateToken(token).user;
    return true;
  }

  private readSessionCookie(cookieHeader?: string): string | null {
    const prefix = 'postventa_session=';
    const cookie = cookieHeader?.split(';').map((part) => part.trim())
      .find((part) => part.startsWith(prefix));
    if (!cookie) return null;
    try {
      return decodeURIComponent(cookie.slice(prefix.length));
    } catch {
      return null;
    }
  }
}
