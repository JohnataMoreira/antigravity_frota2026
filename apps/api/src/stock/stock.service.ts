import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StockService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.stockItem.findMany({
            orderBy: { name: 'asc' },
        });
    }

    async create(dto: any) {
        return this.prisma.stockItem.create({
            data: {
                name: dto.name,
                description: dto.description,
                category: dto.category,
                sku: dto.sku,
                unit: dto.unit,
                minQuantity: dto.minQuantity,
                currentQuantity: 0,
                averageCost: 0,
            } as any,
        });
    }

    async registerMovement(dto: { stockItemId: string; type: 'IN' | 'OUT'; quantity: number; unitCost?: number; reason?: string; referenceId?: string; userId?: string }) {
        return this.prisma.$transaction(async (tx) => {
            const item = await tx.stockItem.findUnique({ where: { id: dto.stockItemId } });
            if (!item) throw new NotFoundException('Item não encontrado');

            const movement = await tx.stockMovement.create({
                data: {
                    stockItemId: dto.stockItemId,
                    type: dto.type,
                    quantity: dto.quantity,
                    unitCost: dto.unitCost,
                    reason: dto.reason,
                    referenceId: dto.referenceId,
                    userId: dto.userId,
                },
            });

            // Update current quantity and average cost (if IN)
            let newQuantity = item.currentQuantity;
            let newAvgCost = item.averageCost;

            if (dto.type === 'IN') {
                const totalValue = (item.currentQuantity * item.averageCost) + (dto.quantity * (dto.unitCost || 0));
                newQuantity += dto.quantity;
                newAvgCost = newQuantity > 0 ? totalValue / newQuantity : 0;
            } else {
                newQuantity -= dto.quantity;
            }

            await tx.stockItem.update({
                where: { id: dto.stockItemId },
                data: {
                    currentQuantity: newQuantity,
                    averageCost: newAvgCost
                },
            });

            return movement;
        });
    }

    async getAlerts() {
        return this.prisma.stockItem.findMany({
            where: {
                currentQuantity: { lte: this.prisma.stockItem.fields.minQuantity as any }
            }
        });
    }
}
