import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LocationsGateway } from '../locations/locations.gateway';
import { IngestTelemetryDto } from './dto/ingest-telemetry.dto';

@Injectable()
export class TelemetryService {
    constructor(
        private prisma: PrismaService,
        private locationsGateway: LocationsGateway
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

            // 2. Atualizar status atual do veículo
            const updatedVehicle = await tx.vehicle.update({
                where: { id: vehicleId },
                data: {
                    currentKm: data.odometer ? Math.floor(data.odometer) : vehicle.currentKm,
                    fuelLevel: data.fuelLevel !== undefined ? data.fuelLevel : vehicle.fuelLevel,
                }
            });

            // 3. Notificar front-end via WebSocket (LocationsGateway)
            this.locationsGateway.server.to(`org_${organizationId}`).emit('vehicleUpdate', {
                vehicleId,
                plate: vehicle.plate,
                latitude: data.latitude,
                longitude: data.longitude,
                speed: data.speed,
                fuelLevel: updatedVehicle.fuelLevel,
                currentKm: updatedVehicle.currentKm,
                engineStatus: data.engineStatus,
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
