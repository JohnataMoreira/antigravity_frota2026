import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PurchaseOrderStatus } from '@prisma/client';
import { CreateSupplierDto, CreatePurchaseOrderDto, ApprovePurchaseOrderDto, UpdateOrderStatusDto } from './dto';

import { FinanceService } from '../finance/finance.service';

@Injectable()
export class PurchasingService {
    constructor(
        private prisma: PrismaService,
        private finance: FinanceService
    ) { }

    // Suppliers
    async createSupplier(organizationId: string, dto: CreateSupplierDto) {
        return this.prisma.supplier.create({
            data: { ...dto, organizationId }
        });
    }

    async getSuppliers(organizationId: string) {
        return this.prisma.supplier.findMany({
            where: { organizationId },
            orderBy: { name: 'asc' }
        });
    }

    // Purchase Orders
    async createOrder(organizationId: string, requesterId: string, dto: CreatePurchaseOrderDto) {
        return this.prisma.purchaseOrder.create({
            data: {
                organizationId,
                requesterId,
                supplierId: dto.supplierId,
                notes: dto.notes,
                status: PurchaseOrderStatus.REQUESTED,
                items: {
                    create: dto.items
                }
            },
            include: { items: true, requester: { select: { name: true } } }
        });
    }

    async getOrders(organizationId: string, status?: PurchaseOrderStatus) {
        return this.prisma.purchaseOrder.findMany({
            where: { organizationId, status },
            include: {
                items: true,
                requester: { select: { name: true } },
                supplier: { select: { name: true } },
                approver: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getOrderById(organizationId: string, id: string) {
        const order = await this.prisma.purchaseOrder.findFirst({
            where: { id, organizationId },
            include: {
                items: { include: { inventoryItem: true } },
                requester: { select: { name: true } },
                supplier: true,
                approver: { select: { name: true } }
            }
        });
        if (!order) throw new NotFoundException('Order not found');
        return order;
    }

    async approveOrder(organizationId: string, id: string, approverId: string, dto: ApprovePurchaseOrderDto) {
        const order = await this.getOrderById(organizationId, id);
        if (order.status !== PurchaseOrderStatus.REQUESTED && order.status !== PurchaseOrderStatus.QUOTING) {
            throw new ForbiddenException('Only requested or quoting orders can be approved');
        }

        return this.prisma.purchaseOrder.update({
            where: { id },
            data: {
                status: PurchaseOrderStatus.APPROVED,
                approverId,
                totalValue: dto.totalValue,
                notes: dto.notes ? `${order.notes}\nApprove notes: ${dto.notes}` : order.notes
            }
        });
    }

    async completeOrder(organizationId: string, id: string) {
        const order = await this.getOrderById(organizationId, id);
        if (order.status !== PurchaseOrderStatus.APPROVED) {
            throw new ForbiddenException('Only approved orders can be completed');
        }

        return this.prisma.$transaction(async (tx) => {
            // Update items quantity in inventory
            for (const item of order.items) {
                if (item.inventoryItemId) {
                    await tx.inventoryItem.update({
                        where: { id: item.inventoryItemId },
                        data: {
                            currentQuantity: { increment: item.quantity },
                            price: item.unitPrice || undefined
                        }
                    });

                    await tx.stockMovement.create({
                        data: {
                            inventoryItemId: item.inventoryItemId,
                            type: 'IN',
                            quantity: item.quantity,
                            reason: 'PURCHASE',
                            notes: `Order #${order.id.split('-')[0]}`
                        }
                    });
                }
            }

            // Create financial transaction
            if (order.totalValue) {
                await tx.financialTransaction.create({
                    data: {
                        organizationId: order.organizationId,
                        amount: order.totalValue,
                        description: `Compra: Pedido #${order.id.split('-')[0]}`,
                        category: 'PURCHASE',
                        type: 'EXPENSE',
                        status: 'PENDING',
                        dueDate: new Date(), // Set to today or configurable
                        supplierId: order.supplierId,
                        purchaseOrderId: order.id
                    }
                });
            }

            return tx.purchaseOrder.update({
                where: { id },
                data: { status: PurchaseOrderStatus.COMPLETED }
            });
        });
    }

    async cancelOrder(organizationId: string, id: string) {
        const order = await this.getOrderById(organizationId, id);
        if (order.status === PurchaseOrderStatus.COMPLETED) {
            throw new ForbiddenException('Completed orders cannot be canceled');
        }

        return this.prisma.purchaseOrder.update({
            where: { id },
            data: { status: PurchaseOrderStatus.CANCELED }
        });
    }
}
