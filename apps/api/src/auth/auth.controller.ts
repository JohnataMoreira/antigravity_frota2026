import { Body, Controller, Post, Get, Request, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterOrgDto } from './dto';
import { Public } from './public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Public()
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
    getProfile(@Request() req: any) {
        return this.authService.getProfile(req.user.sub);
    }
}
