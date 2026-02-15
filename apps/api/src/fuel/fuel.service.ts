import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFuelDto } from './dto/create-fuel.dto';
import { FuelType, PaymentMethod } from '@prisma/client';

@Injectable()
export class FuelService {
    constructor(private prisma: PrismaService) { }

    async create(data: CreateFuelDto & { organizationId: string; driverId: string }) {
        return this.prisma.$transaction(async (tx) => {
            const entry = await tx.fuelEntry.create({
                data: {
                    ...data,
                    fuelType: data.fuelType as FuelType,
                    paymentMethod: data.paymentMethod as PaymentMethod,
                    date: new Date()
                }
            });

            // Update vehicle current odometer if entry KM is higher
            const vehicle = await tx.vehicle.findUnique({ where: { id: data.vehicleId } });
            if (vehicle && data.km > vehicle.currentKm) {
                await tx.vehicle.update({
                    where: { id: data.vehicleId },
                    data: { currentKm: data.km }
                });
            }

            return entry;
        });
    }

    async findAll(organizationId: string, filters: { vehicleId?: string; driverId?: string; startDate?: string; endDate?: string } = {}) {
        const { vehicleId, driverId, startDate, endDate } = filters;

        const where: any = { organizationId };

        if (vehicleId) where.vehicleId = vehicleId;
        if (driverId) where.driverId = driverId;

        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate);
            if (endDate) where.date.lte = new Date(endDate);
        }

        return this.prisma.fuelEntry.findMany({
            where,
            orderBy: { date: 'desc' },
            include: {
                vehicle: { select: { plate: true, model: true } },
                driver: { select: { name: true } }
            }
        });
    }

    async getStats(organizationId: string, vehicleId?: string) {
        const where = { organizationId, ...(vehicleId ? { vehicleId } : {}) };

        const entries = await this.prisma.fuelEntry.findMany({
            where,
            orderBy: { date: 'asc' },
            include: {
                vehicle: { select: { plate: true, model: true } },
                driver: { select: { name: true } }
            }
        });

        if (entries.length === 0) {
            return {
                avgKmL: 0,
                avgCostKm: 0,
                totalSpent: 0,
                totalLiters: 0,
                byVehicle: [],
                byDriver: [],
                trends: []
            };
        }

        const totalSpent = entries.reduce((acc: number, e: any) => acc + (e.totalValue || 0), 0);
        const totalLiters = entries.reduce((acc: number, e: any) => acc + (e.liters || 0), 0);

        // Calculate rankings
        const vehicleRanking = new Map<string, { plate: string, model: string, spent: number, count: number }>();
        const driverRanking = new Map<string, { name: string, spent: number, count: number }>();

        entries.forEach(e => {
            const v = vehicleRanking.get(e.vehicleId) || { plate: e.vehicle?.plate || '', model: e.vehicle?.model || '', spent: 0, count: 0 };
            v.spent += e.totalValue;
            v.count += 1;
            vehicleRanking.set(e.vehicleId, v);

            const d = driverRanking.get(e.driverId) || { name: e.driver?.name || 'Desconhecido', spent: 0, count: 0 };
            d.spent += e.totalValue;
            d.count += 1;
            driverRanking.set(e.driverId, d);
        });

        // Trends (By Month)
        const monthsRanking = new Map<string, { name: string, spent: number }>();
        entries.forEach(e => {
            const month = new Date(e.date).toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
            const m = monthsRanking.get(month) || { name: month, spent: 0 };
            m.spent += e.totalValue;
            monthsRanking.set(month, m);
        });

        const firstEntry = entries[0];
        const lastEntry = entries[entries.length - 1];
        const sortedByKm = [...entries].sort((a: any, b: any) => a.km - b.km);
        const distance = sortedByKm[sortedByKm.length - 1].km - sortedByKm[0].km;
        const litersForDistance = sortedByKm.slice(1).reduce((acc: number, e: any) => acc + (e.liters || 0), 0);

        return {
            avgKmL: litersForDistance > 0 ? (distance / litersForDistance).toFixed(2) : 0,
            avgCostKm: distance > 0 ? (totalSpent / distance).toFixed(2) : 0,
            totalSpent,
            totalLiters,
            totalDistance: distance,
            byVehicle: Array.from(vehicleRanking.values()).sort((a, b) => b.spent - a.spent).slice(0, 5),
            byDriver: Array.from(driverRanking.values()).sort((a, b) => b.count - a.count).slice(0, 5),
            trends: Array.from(monthsRanking.values()).slice(-6)
        };
    }
}
