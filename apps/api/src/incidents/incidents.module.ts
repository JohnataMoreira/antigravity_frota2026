import { Module } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { IncidentsController } from './incidents.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../common/notifications/notification.module';
import { LocationsModule } from '../locations/locations.module';

@Module({
    imports: [PrismaModule, NotificationModule, LocationsModule],
    controllers: [IncidentsController],
    providers: [IncidentsService],
    exports: [IncidentsService],
})
export class IncidentsModule { }
