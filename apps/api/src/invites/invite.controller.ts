import { Controller, Post, Get, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { InviteService } from './invite.service';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';

@Controller('invites')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InviteController {
    constructor(private readonly inviteService: InviteService) { }

    @Post()
    @Roles(Role.ADMIN)
    create(@Body() body: { email: string; role?: Role }) {
        return this.inviteService.createInvite(body.email, body.role);
    }

    @Get()
    @Roles(Role.ADMIN)
    findAll() {
        return this.inviteService.findAll();
    }

    @Public()
    @Get('validate/:token')
    validate(@Param('token') token: string) {
        return this.inviteService.validateToken(token);
    }

    @Delete(':id')
    @Roles(Role.ADMIN)
    cancel(@Param('id') id: string) {
        return this.inviteService.cancelInvite(id);
    }
}
