import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { createHmac } from 'node:crypto';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AuthController } from '../../src/auth/auth.controller';
import { AuthGuard } from '../../src/auth/auth.guard';
import { AuthService } from '../../src/auth/auth.service';
import { RolesGuard } from '../../src/auth/roles.guard';
import { CasesController } from '../../src/cases/cases.controller';
import { CasesService } from '../../src/cases/cases.service';

const SECRET = 'a-test-secret-that-is-at-least-thirty-two-bytes';

function signToken(claims: Record<string, unknown>, secret = SECRET): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const signature = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

function roleToken(role: string) {
  return signToken({
    sub: 'user-123',
    name: 'Usuario de prueba',
    role,
    exp: Math.floor(Date.now() / 1000) + 300,
  });
}

describe('autenticación y permisos de Postventa', () => {
  let app: INestApplication;
  const cases = {
    findAll: jest.fn().mockResolvedValue([]),
    findById: jest.fn(),
    updateStatus: jest.fn().mockResolvedValue({ id: 1, status: 'En revisión' }),
    resolve: jest.fn(),
    getHistory: jest.fn(),
  };
  const config = {
    getOrThrow: (key: string) => {
      if (key === 'SSO_JWT_SECRET') return SECRET;
      throw new Error(`Missing config ${key}`);
    },
    get: () => undefined,
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController, CasesController],
      providers: [
        AuthService,
        AuthGuard,
        RolesGuard,
        { provide: ConfigService, useValue: config },
        { provide: CasesService, useValue: cases },
        { provide: DataSource, useValue: {} },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  beforeEach(() => jest.clearAllMocks());
  afterAll(async () => app.close());

  async function createSession(role: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/auth/session')
      .send({ token: roleToken(role) })
      .expect(200);
    const setCookie = response.headers['set-cookie'];
    const cookie = Array.isArray(setCookie) ? setCookie[0] : setCookie;
    if (!cookie) throw new Error('No se emitió la cookie de sesión.');
    return cookie.split(';')[0];
  }

  it('rechaza la consulta de casos sin sesión', async () => {
    await request(app.getHttpServer()).get('/postventa/solicitudes').expect(401);
    expect(cases.findAll).not.toHaveBeenCalled();
  });

  it('intercambia el token del login y expone la identidad de la sesión', async () => {
    const cookie = await createSession('Operador');
    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', cookie)
      .expect(200);
    expect(response.body).toEqual({ id: 'user-123', name: 'Usuario de prueba', role: 'Operador' });
    await request(app.getHttpServer())
      .get('/postventa/solicitudes')
      .set('Cookie', cookie)
      .expect(200);
  });

  it('impide que Operador modifique casos y permite la operación a Coordinador', async () => {
    const operatorCookie = await createSession('Operador');
    await request(app.getHttpServer())
      .patch('/postventa/solicitudes/1/estado')
      .set('Cookie', operatorCookie)
      .send({ status: 'En revisión' })
      .expect(403);
    expect(cases.updateStatus).not.toHaveBeenCalled();

    const coordinatorCookie = await createSession('Coordinador');
    await request(app.getHttpServer())
      .patch('/postventa/solicitudes/1/estado')
      .set('Cookie', coordinatorCookie)
      .send({ status: 'En revisión' })
      .expect(200);
    expect(cases.updateStatus).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['firma incorrecta', signToken({
      sub: 'user-123', role: 'Administrador', exp: Math.floor(Date.now() / 1000) + 300,
    }, 'another-test-secret-that-is-at-least-thirty-two-bytes')],
    ['rol desconocido', roleToken('Invitado')],
    ['token expirado', signToken({
      sub: 'user-123', role: 'Administrador', exp: Math.floor(Date.now() / 1000) - 1,
    })],
  ])('rechaza un token con %s', async (_label, token) => {
    await request(app.getHttpServer())
      .post('/auth/session')
      .send({ token })
      .expect(401);
  });
});
