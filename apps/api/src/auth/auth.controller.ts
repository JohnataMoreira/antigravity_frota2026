import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterOrgDto } from './dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    // Endpoint to bootstrap the first organization
    @Post('register-org')
    @HttpCode(HttpStatus.CREATED)
    registerOrg(@Body() dto: RegisterOrgDto) {
        return this.authService.registerOrg(dto);
    }
}
