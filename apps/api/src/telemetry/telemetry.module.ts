import { Module } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { TelemetryController } from './telemetry.controller';
import { LocationsModule } from '../locations/locations.module';

@Module({
    imports: [LocationsModule],
    controllers: [TelemetryController],
    providers: [TelemetryService],
    exports: [TelemetryService]
})
export class TelemetryModule { }
