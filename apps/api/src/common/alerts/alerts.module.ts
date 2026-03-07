import { Module } from '@nestjs/common';
import { AlertsProcessorService } from './alerts-processor.service';
import { AlertsController } from './alerts.controller';
import { NotificationModule } from '../notifications/notification.module';

@Module({
    imports: [NotificationModule],
    controllers: [AlertsController],
    providers: [AlertsProcessorService],
    exports: [AlertsProcessorService],
})
export class AlertsModule { }
