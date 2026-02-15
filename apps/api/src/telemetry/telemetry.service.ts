import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LocationsGateway } from '../locations/locations.gateway';
import { IngestTelemetryDto } from './dto/ingest-telemetry.dto';
import { RouteMonitorService } from './route-monitor.service';

@Injectable()
export class TelemetryService {
    constructor(
        private prisma: PrismaService,
        private locationsGateway: LocationsGateway,
        private routeMonitor: RouteMonitorService
    ) { }

    async ingest(vehicleId: string, organizationId: string, data: IngestTelemetryDto) {
        return (this.prisma as any).$transaction(async (tx: any) => {
            const vehicle = await tx.vehicle.findFirst({
                where: { id: vehicleId, organizationId }
            });

            if (!vehicle) throw new NotFoundException('Veículo não encontrado');

            // 1. Gravar registro histórico
            const record = await tx.telemetryRecord.create({
                data: {
                    ...data,
                    vehicleId
                }
            });

            // 2. Verificar Jornada Ativa e Desvios (v2.7)
            const activeJourney = await tx.journey.findFirst({
                where: { vehicleId, status: 'IN_PROGRESS' },
                include: { organization: { include: { geofences: { where: { isActive: true } } } } }
            });

            let isDeviated = false;
            if (activeJourney && data.latitude && data.longitude) {
                // Check Planned Route
                if (activeJourney.plannedRoute) {
                    const distance = this.routeMonitor.getDistanceFromRoute(
                        [data.latitude, data.longitude],
                        activeJourney.plannedRoute as any
                    );
                    if (distance > (activeJourney.allowedDeviation || 500)) {
                        isDeviated = true;
                    }
                }

                // Check Geofences
                const geofences = activeJourney.organization?.geofences || [];
                for (const gf of geofences) {
                    const isInside = this.routeMonitor.isPointInsideGeofence(
                        [data.latitude, data.longitude],
                        gf
                    );
                    // Lógica simplificada: se a geofence for "Área Proibida", e estiver dentro, desvia.
                    // Para MVP, vamos considerar apenas desvio de rota planejada.
                }

                if (isDeviated !== activeJourney.isDeviated) {
                    await tx.journey.update({
                        where: { id: activeJourney.id },
                        data: { isDeviated }
                    });
                }
            }

            // 3. Atualizar status atual do veículo
            const updatedVehicle = await tx.vehicle.update({
                where: { id: vehicleId },
                data: {
                    currentKm: data.odometer ? Math.floor(data.odometer) : vehicle.currentKm,
                    fuelLevel: data.fuelLevel !== undefined ? data.fuelLevel : vehicle.fuelLevel,
                }
            });

            // 4. Notificar front-end via WebSocket (LocationsGateway)
            this.locationsGateway.server.to(`org_${organizationId}`).emit('vehicleUpdate', {
                vehicleId,
                plate: vehicle.plate,
                latitude: data.latitude,
                longitude: data.longitude,
                speed: data.speed,
                fuelLevel: updatedVehicle.fuelLevel,
                currentKm: updatedVehicle.currentKm,
                engineStatus: data.engineStatus,
                isDeviated, // Informar desvio
                timestamp: record.timestamp
            });

            return record;
        });
    }

    async getHistory(vehicleId: string, organizationId: string, limit = 100) {
        return (this.prisma as any).telemetryRecord.findMany({
            where: { vehicleId, vehicle: { organizationId } },
            orderBy: { timestamp: 'desc' },
            take: limit
        });
    }
}
