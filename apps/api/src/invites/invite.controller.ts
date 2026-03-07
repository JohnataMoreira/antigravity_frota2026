import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { InviteService } from './invite.service';
import { GetUser } from '../auth/get-user.decorator';

@Controller('invites')
export class InviteController {
    constructor(private inviteService: InviteService) { }

    @Post()
    create(@GetUser() user: any, @Body() body: { email: string; role: string }) {
        return this.inviteService.create(user.organizationId, body.email, body.role);
    }

    @Get()
    findAll(@GetUser() user: any) {
        return this.inviteService.findAll(user.organizationId);
    }

    @Get(':token')
    findByToken(@Param('token') token: string) {
        return this.inviteService.findByToken(token);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.inviteService.remove(id);
    }
}
