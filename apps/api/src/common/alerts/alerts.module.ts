import { Module } from '@nestjs/common';
import { AlertsProcessorService } from './alerts-processor.service';
import { AlertsController } from './alerts.controller';
import { WebNotificationsModule } from '../../notifications/notifications.module';

@Module({
    imports: [WebNotificationsModule],
    controllers: [AlertsController],
    providers: [AlertsProcessorService],
    exports: [AlertsProcessorService],
})
export class AlertsModule { }
