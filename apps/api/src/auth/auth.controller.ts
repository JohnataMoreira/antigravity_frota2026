import { Body, Controller, Post, Get, Request, Response, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto, RegisterOrgDto } from './dto';
import { Public } from './public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { GoogleAuthGuard } from './google-auth.guard';
import { UserRequest } from './user-request.interface';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private config: ConfigService
    ) { }

    @Public()
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @Post('login')
    @HttpCode(HttpStatus.OK)
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    // Endpoint to bootstrap the first organization
    @Public()
    @Post('register-org')
    @HttpCode(HttpStatus.CREATED)
    registerOrg(@Body() dto: RegisterOrgDto) {
        return this.authService.registerOrg(dto);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    getProfile(@Request() req: UserRequest) {
        return this.authService.getProfile(req.user.userId);
    }

    @Post('logout-all')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    logoutAll(@Request() req: UserRequest) {
        return this.authService.logoutAll(req.user.userId, req.user.organizationId);
    }

    @Public()
    @Get('google')
    @UseGuards(GoogleAuthGuard)
    async googleAuth(@Request() _req: any) { }

    @Public()
    @Get('google/callback')
    @UseGuards(GoogleAuthGuard)
    async googleAuthRedirect(@Request() req: any, @Response() res: any) {
        const result = await this.authService.validateGoogleUser(req.user);
        // Redirect to frontend with token
        const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:5173');
        const userJson = encodeURIComponent(JSON.stringify(result.user));
        return res.redirect(`${frontendUrl}/login?token=${result.access_token}&user=${userJson}`);
    }
}
