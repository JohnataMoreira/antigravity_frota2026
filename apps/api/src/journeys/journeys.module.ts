import { Module } from '@nestjs/common';
import { JourneysService } from './journeys.service';
import { JourneysController } from './journeys.controller';
import { MaintenanceModule } from '../maintenance/maintenance.module';
import { ComplianceModule } from '../compliance/compliance.module';

@Module({
    imports: [],
    controllers: [JourneysController],
    providers: [JourneysService],
})
export class JourneysModule { }
