import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryItemDto } from './dto/create-item.dto';
import { StockMovementDto, MovementType } from './dto/stock-movement.dto';

@Injectable()
export class InventoryService {
    constructor(private prisma: PrismaService) { }

    async findAll(organizationId: string) {
        return this.prisma.inventoryItem.findMany({
            where: { organizationId },
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { movements: true }
                }
            }
        });
    }

    async findOne(id: string, organizationId: string) {
        const item = await this.prisma.inventoryItem.findFirst({
            where: { id, organizationId },
            include: {
                movements: {
                    orderBy: { createdAt: 'desc' },
                    take: 50
                }
            }
        });

        if (!item) throw new NotFoundException('Item não encontrado');
        return item;
    }

    async create(organizationId: string, data: CreateInventoryItemDto) {
        return this.prisma.inventoryItem.create({
            data: {
                ...data,
                organizationId,
                currentQuantity: 0
            }
        });
    }

    async registerMovement(itemId: string, organizationId: string, data: StockMovementDto) {
        return this.prisma.$transaction(async (tx) => {
            const item = await tx.inventoryItem.findFirst({
                where: { id: itemId, organizationId }
            });

            if (!item) throw new NotFoundException('Item não encontrado');

            const newQuantity = data.type === MovementType.IN
                ? item.currentQuantity + data.quantity
                : item.currentQuantity - data.quantity;

            // Optional: Prevent negative stock if business rule requires it
            // if (newQuantity < 0) throw new BadRequestException('Estoque insuficiente');

            const movement = await tx.stockMovement.create({
                data: {
                    ...data,
                    inventoryItemId: itemId
                }
            });

            await tx.inventoryItem.update({
                where: { id: itemId },
                data: { currentQuantity: newQuantity }
            });

            return movement;
        });
    }

    async remove(id: string, organizationId: string) {
        return this.prisma.inventoryItem.delete({
            where: { id, organizationId }
        });
    }
}
