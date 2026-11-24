import { createHmac, timingSafeEqual } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthSession, UserRole } from './auth.types';

interface JwtHeader {
  alg?: unknown;
}

interface JwtClaims {
  sub?: unknown;
  name?: unknown;
  preferred_username?: unknown;
  role?: unknown;
  exp?: unknown;
  nbf?: unknown;
  iss?: unknown;
  aud?: unknown;
}

@Injectable()
export class AuthService {
  constructor(private readonly config: ConfigService) {}

  validateToken(token: string): AuthSession {
    const secret = this.config.getOrThrow<string>('SSO_JWT_SECRET');
    if (Buffer.byteLength(secret, 'utf8') < 32) {
      throw new Error('SSO_JWT_SECRET debe contener al menos 32 bytes.');
    }

    const parts = token.split('.');
    if (parts.length !== 3 || parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part))) {
      throw new UnauthorizedException('La sesión no es válida.');
    }

    const [encodedHeader, encodedClaims, encodedSignature] = parts;
    const header = this.decodeJson<JwtHeader>(encodedHeader);
    const claims = this.decodeJson<JwtClaims>(encodedClaims);
    if (!header || header.alg !== 'HS256' || !claims) {
      throw new UnauthorizedException('La sesión no es válida.');
    }

    const receivedSignature = Buffer.from(encodedSignature, 'base64url');
    const expectedSignature = createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedClaims}`)
      .digest();
    if (
      receivedSignature.length !== expectedSignature.length ||
      !timingSafeEqual(receivedSignature, expectedSignature)
    ) {
      throw new UnauthorizedException('La sesión no es válida.');
    }

    const now = Math.floor(Date.now() / 1000);
    if (
      typeof claims.sub !== 'string' ||
      !claims.sub.trim() ||
      claims.sub.length > 255 ||
      typeof claims.exp !== 'number' ||
      !Number.isFinite(claims.exp) ||
      claims.exp <= now ||
      (claims.nbf !== undefined &&
        (typeof claims.nbf !== 'number' || !Number.isFinite(claims.nbf) || claims.nbf > now))
    ) {
      throw new UnauthorizedException('La sesión no es válida o ha expirado.');
    }

    const issuer = this.config.get<string>('SSO_JWT_ISSUER');
    const audience = this.config.get<string>('SSO_JWT_AUDIENCE');
    const audienceMatches = audience !== undefined && (
      typeof claims.aud === 'string'
        ? claims.aud === audience
        : Array.isArray(claims.aud) && claims.aud.includes(audience)
    );
    const role = Object.values(UserRole).find((candidate) => candidate === claims.role);
    if (
      (issuer && claims.iss !== issuer) ||
      (audience && !audienceMatches) ||
      !role
    ) {
      throw new UnauthorizedException('La sesión no es válida.');
    }

    const name =
      typeof claims.name === 'string'
        ? claims.name
        : typeof claims.preferred_username === 'string'
          ? claims.preferred_username
          : claims.sub;

    return {
      user: {
        id: claims.sub,
        name: name.slice(0, 255),
        role,
      },
      expiresAt: claims.exp,
    };
  }

  private decodeJson<T>(segment: string): T | null {
    try {
      return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8')) as T;
    } catch {
      return null;
    }
  }
}
