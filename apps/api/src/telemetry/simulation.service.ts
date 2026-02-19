import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { TelemetryService } from './telemetry.service';

@Injectable()
export class SimulationService {
    private readonly logger = new Logger(SimulationService.name);

    constructor(
        private prisma: PrismaService,
        private telemetryService: TelemetryService
    ) { }

    @Cron(CronExpression.EVERY_MINUTE)
    async handleSimulation() {
        // Find all journeys in progress
        const activeJourneys = await this.prisma.journey.findMany({
            where: { status: 'IN_PROGRESS' },
            include: { vehicle: true }
        });

        if (activeJourneys.length === 0) return;

        this.logger.log(`Simulando telemetria para ${activeJourneys.length} jornadas ativas...`);

        for (const journey of activeJourneys) {
            // Get last telemetry record to continue movement
            const lastRecord = await this.prisma.telemetryRecord.findFirst({
                where: { vehicleId: journey.vehicleId },
                orderBy: { timestamp: 'desc' }
            });

            // Base position: if no telemetry, use a default near São Paulo or journey start
            let lat = lastRecord?.latitude || -23.5505;
            let lng = lastRecord?.longitude || -46.6333;
            let km = lastRecord?.odometer || journey.startKm;

            // Generate small random movement (approx 50-200 meters)
            const latVar = (Math.random() - 0.5) * 0.002;
            const lngVar = (Math.random() - 0.5) * 0.002;

            lat += latVar;
            lng += lngVar;
            km += 0.1 + (Math.random() * 0.2); // +100 to 300 meters

            // Ingest simulated data
            await this.telemetryService.ingest(
                journey.vehicleId,
                journey.organizationId,
                {
                    latitude: lat,
                    longitude: lng,
                    speed: 40 + Math.random() * 40,
                    odometer: km,
                    fuelLevel: Math.max(0, journey.vehicle.fuelLevel - (Math.random() * 0.1)),
                    engineStatus: true
                }
            );
        }
    }
}
