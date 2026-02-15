import { Module } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { TelemetryController } from './telemetry.controller';
import { LocationsModule } from '../locations/locations.module';
import { RouteMonitorService } from './route-monitor.service';

@Module({
    imports: [LocationsModule],
    controllers: [TelemetryController],
    providers: [TelemetryService, RouteMonitorService],
    exports: [TelemetryService, RouteMonitorService]
})
export class TelemetryModule { }
