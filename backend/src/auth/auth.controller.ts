import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard, AuthenticatedRequest } from './auth.guard';
import { AuthService } from './auth.service';
import { CreateSessionDto } from './create-session.dto';

const SESSION_COOKIE = 'postventa_session';

function cookieOptions() {
  const secure = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure,
    sameSite: secure ? ('none' as const) : ('lax' as const),
    path: '/',
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('session')
  @HttpCode(200)
  createSession(
    @Body() input: CreateSessionDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = this.auth.validateToken(input.token);
    response.cookie(SESSION_COOKIE, input.token, {
      ...cookieOptions(),
      expires: new Date(session.expiresAt * 1000),
    });
    return session.user;
  }

  @Get('me')
  @UseGuards(AuthGuard)
  currentUser(@Req() request: AuthenticatedRequest) {
    return request.user;
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(SESSION_COOKIE, cookieOptions());
  }
}
