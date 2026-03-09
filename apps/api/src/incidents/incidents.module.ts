import { Module } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { IncidentsController } from './incidents.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WebNotificationsModule } from '../notifications/notifications.module';
import { LocationsModule } from '../locations/locations.module';

@Module({
    imports: [PrismaModule, WebNotificationsModule, LocationsModule],
    controllers: [IncidentsController],
    providers: [IncidentsService],
    exports: [IncidentsService],
})
export class IncidentsModule { }
