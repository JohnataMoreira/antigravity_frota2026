import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  Version,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import {
  LocalAuthGuard,
  JwtAuthGuard,
  JwtRefreshGuard,
  GoogleAuthGuard,
} from './guards';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // REGISTRO
  // ─────────────────────────────────────────────────────────────
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ login: { ttl: 900000, limit: 3 } }) // Max 3 cadastros por 15min por IP
  @ApiOperation({ summary: 'Criar nova conta' })
  async register(@Body() dto: RegisterDto) {
    const user = await this.usersService.create(dto);
    return {
      message: 'Conta criada com sucesso',
      userId: user.id,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // LOGIN LOCAL
  // ─────────────────────────────────────────────────────────────
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ login: { ttl: 900000, limit: 5 } }) // 5 tentativas por 15min
  @ApiOperation({ summary: 'Login com email e senha' })
  async login(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() _dto: LoginDto, // Anotado apenas para Swagger/validação
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const { accessToken, refreshToken } = await this.authService.login(
      req.user as User,
      ip,
    );

    this.setRefreshTokenCookie(res, refreshToken);
    return { accessToken };
  }

  // ─────────────────────────────────────────────────────────────
  // GOOGLE OAUTH
  // ─────────────────────────────────────────────────────────────
  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Iniciar login com Google' })
  googleAuth() {
    // O Passport redireciona automaticamente para o Google
    // Este método nunca é executado diretamente
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Callback do Google OAuth' })
  async googleCallback(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const { accessToken, refreshToken } = await this.authService.googleLogin(
      req.user,
      ip,
    );

    this.setRefreshTokenCookie(res, refreshToken);

    // Redireciona para o frontend com o access token
    // Em produção, prefira passar via cookie seguro em vez da URL
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    return res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}`);
  }

  // ─────────────────────────────────────────────────────────────
  // REFRESH TOKEN
  // ─────────────────────────────────────────────────────────────
  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('refresh_token')
  @ApiOperation({ summary: 'Renovar access token usando refresh token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user as any;
    const { accessToken, refreshToken } = await this.authService.refreshTokens(
      user.sub,
      user.refreshToken,
    );

    // Emite novo refresh token (rotação)
    this.setRefreshTokenCookie(res, refreshToken);
    return { accessToken };
  }

  // ─────────────────────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Encerrar sessão' })
  async logout(
    @CurrentUser() user: User,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;
    await this.authService.logout(user.id, refreshToken);

    // Remove o cookie do cliente
    res.clearCookie('refresh_token', this.getCookieOptions());
    return { message: 'Sessão encerrada com sucesso' };
  }

  // ─────────────────────────────────────────────────────────────
  // PERFIL DO USUÁRIO AUTENTICADO
  // ─────────────────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter dados do usuário autenticado' })
  getMe(@CurrentUser() user: User) {
    // Retorna apenas campos seguros — nunca senha ou hashes
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      provider: user.provider,
      picture: user.picture,
      lastLoginAt: user.lastLoginAt,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // HELPERS PRIVADOS
  // ─────────────────────────────────────────────────────────────
  private setRefreshTokenCookie(res: Response, token: string): void {
    res.cookie('refresh_token', token, this.getCookieOptions());
  }

  private getCookieOptions() {
    const isProd = this.configService.get('NODE_ENV') === 'production';
    return {
      httpOnly: true,    // Inacessível ao JavaScript — previne XSS
      secure: isProd,    // HTTPS apenas em produção
      sameSite: 'strict' as const, // Previne CSRF
      path: '/v1/auth',  // Cookie válido APENAS em rotas de auth — princípio do menor privilégio
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias em ms
    };
  }
}
