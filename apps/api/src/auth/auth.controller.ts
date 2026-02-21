import { Body, Controller, Post, Get, Request, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto, RegisterOrgDto } from './dto';
import { Public } from './public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UserRequest } from './user-request.interface';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Public()
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @Post('login')
    @HttpCode(HttpStatus.OK)
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Public()
    @Post('register-org')
    @HttpCode(HttpStatus.CREATED)
    registerOrg(@Body() dto: RegisterOrgDto) {
        return this.authService.registerOrg(dto);
    }

    @Public()
    @Post('register-invite')
    @HttpCode(HttpStatus.CREATED)
    registerInvite(@Body() dto: any) {
        return this.authService.registerWithInvite(dto);
    }

    @Public()
    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleAuth(@Request() req: any) { }

    @Public()
    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleAuthRedirect(@Request() req: any) {
        return this.authService.signSocialToken(req.user);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    getProfile(@Request() req: UserRequest) {
        return this.authService.getProfile(req.user.userId);
    }
}
