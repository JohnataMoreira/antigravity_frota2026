import { Module } from '@nestjs/common';
import { InviteService } from './invite.service';
import { InviteController } from './invite.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../common/mail/mail.module';

@Module({
    imports: [PrismaModule, MailModule],
    controllers: [InviteController],
    providers: [InviteService],
    exports: [InviteService],
})
export class InviteModule { }
