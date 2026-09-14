import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';
import { ACCESS_TOKEN_COOKIE } from './auth.constants.js';
import { AuthService } from './auth.service.js';
import { CurrentUserId } from './decorators/current-user.decorator.js';
import { Public } from './decorators/public.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { user, token } = await this.auth.register(dto);
    this.setAuthCookie(response, token);

    return user;
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { user, token } = await this.auth.login(dto);
    this.setAuthCookie(response, token);

    return user;
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie(ACCESS_TOKEN_COOKIE, this.cookieOptions());
  }

  @Get('me')
  me(@CurrentUserId() userId: string) {
    return this.auth.findById(userId);
  }

  private setAuthCookie(response: Response, token: string): void {
    response.cookie(ACCESS_TOKEN_COOKIE, token, {
      ...this.cookieOptions(),
      maxAge: this.config.getOrThrow<number>('jwtExpiresInSeconds') * 1000,
    });
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.getOrThrow<string>('nodeEnv') === 'production',
      path: '/',
    };
  }
}
