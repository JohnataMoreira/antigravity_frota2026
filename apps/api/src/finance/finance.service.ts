import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionStatus, TransactionType, PaymentMethod } from '@prisma/client';

@Injectable()
export class FinanceService {
    constructor(private prisma: PrismaService) { }

    async createTransaction(data: any) {
        return this.prisma.financialTransaction.create({
            data: {
                ...data,
                dueDate: new Date(data.dueDate),
                paymentDate: data.paymentDate ? new Date(data.paymentDate) : null
            }
        });
    }

    async createFromSource(source: {
        organizationId: string,
        amount: number,
        description: string,
        category: string,
        dueDate: Date,
        purchaseOrderId?: string,
        maintenanceId?: string,
        fuelEntryId?: string,
        supplierId?: string
    }) {
        return this.prisma.financialTransaction.create({
            data: {
                ...source,
                type: 'EXPENSE',
                status: 'PENDING'
            }
        });
    }

    async getTransactions(organizationId: string, filters: any = {}) {
        const { status, category, start, end, supplierId } = filters;

        return this.prisma.financialTransaction.findMany({
            where: {
                organizationId,
                ...(status && { status }),
                ...(category && { category }),
                ...(start && end && {
                    dueDate: { gte: new Date(start), lte: new Date(end) }
                }),
                ...(supplierId && { supplierId })
            },
            include: {
                supplier: { select: { name: true } },
                purchaseOrder: { select: { id: true } },
                maintenance: { select: { type: true } }
            },
            orderBy: { dueDate: 'asc' }
        });
    }

    async confirmPayment(id: string, paymentData: { paymentDate: Date, paymentMethod: PaymentMethod, attachmentUrl?: string }) {
        return this.prisma.financialTransaction.update({
            where: { id },
            data: {
                status: 'PAID',
                paymentDate: new Date(paymentData.paymentDate),
                paymentMethod: paymentData.paymentMethod,
                attachmentUrl: paymentData.attachmentUrl
            }
        });
    }

    async getOverview(organizationId: string, filters: any = {}) {
        const { start, end, vehicleId } = filters;

        const fuelDateFilter = start && end ? {
            date: { gte: new Date(start), lte: new Date(end) }
        } : {};

        const maintenanceDateFilter = start && end ? {
            performedAt: { gte: new Date(start), lte: new Date(end) }
        } : {};

        const transactionsDateFilter = start && end ? {
            dueDate: { gte: new Date(start), lte: new Date(end) }
        } : {};

        const [fuelExpenses, maintenanceExpenses, financialTransactions] = await Promise.all([
            this.prisma.fuelEntry.findMany({
                where: { organizationId, ...fuelDateFilter, ...(vehicleId && { vehicleId }) },
                select: { date: true, totalValue: true, fuelType: true, paymentMethod: true }
            }),
            this.prisma.maintenance.findMany({
                where: { organizationId, status: 'COMPLETED', ...maintenanceDateFilter, ...(vehicleId && { vehicleId }) },
                select: { performedAt: true, cost: true, type: true }
            }),
            this.prisma.financialTransaction.findMany({
                where: { organizationId, ...transactionsDateFilter }
            })
        ]);

        // Aggregate analysis...
        const totalFuel = fuelExpenses.reduce((acc, e) => acc + e.totalValue, 0);
        const totalMaintenance = maintenanceExpenses.reduce((acc, m) => acc + (m.cost || 0), 0);
        const totalOther = financialTransactions
            .filter(t => t.type === 'EXPENSE' && !t.maintenanceId && !t.fuelEntryId)
            .reduce((acc, t) => acc + t.amount, 0);

        return {
            summary: {
                totalFuel,
                totalMaintenance,
                totalOther,
                grandTotal: totalFuel + totalMaintenance + totalOther,
                pendingPayments: financialTransactions.filter(t => t.status === 'PENDING').length
            },
            recentExpenses: financialTransactions.slice(0, 10)
        };
    }
}
