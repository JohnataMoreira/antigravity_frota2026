import { Module } from '@nestjs/common';
import { JourneysService } from './journeys.service';
import { JourneysController } from './journeys.controller';
import { MaintenanceModule } from '../maintenance/maintenance.module';

@Module({
    imports: [MaintenanceModule],
    controllers: [JourneysController],
    providers: [JourneysService],
})
export class JourneysModule { }
