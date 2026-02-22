import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentType } from '@prisma/client';

@Injectable()
export class ComplianceService {
    constructor(private prisma: PrismaService) { }

    async createDocument(organizationId: string, data: any) {
        // Validação básica se userId ou vehicleId existem, dependendo do tipo de documento
        if (!data.userId && !data.vehicleId) {
            throw new BadRequestException('Documento deve ser vinculado a um Motorista (userId) ou Veículo (vehicleId).');
        }

        return this.prisma.document.create({
            data: {
                organizationId,
                name: data.name,
                type: data.type as DocumentType,
                number: data.number,
                issueDate: data.issueDate ? new Date(data.issueDate) : null,
                expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
                fileUrl: data.fileUrl,
                fileType: data.fileType,
                userId: data.userId || null,
                vehicleId: data.vehicleId || null,
            },
        });
    }

    async getDocuments(organizationId: string, filters: any = {}) {
        return this.prisma.document.findMany({
            where: {
                organizationId,
                ...(filters.userId && { userId: filters.userId }),
                ...(filters.vehicleId && { vehicleId: filters.vehicleId }),
                ...(filters.type && { type: filters.type as DocumentType }),
            },
            include: {
                user: { select: { name: true, cpf: true } },
                vehicle: { select: { plate: true, model: true } }
            },
            orderBy: {
                expiryDate: 'asc' // Prioriza mostrar os que vão vencer primeiro
            }
        });
    }

    async getComplianceAlerts(organizationId: string, vehicleId?: string, driverId?: string) {
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        // Buscar documentos vencidos ou a vencer em 30 dias vinculados ao veículo ou motorista
        const documents = await this.prisma.document.findMany({
            where: {
                organizationId,
                OR: [
                    { vehicleId: vehicleId ? vehicleId : undefined },
                    { userId: driverId ? driverId : undefined }
                ],
                expiryDate: {
                    lte: thirtyDaysFromNow // Documentos que vencem até 30 dias
                }
            },
            include: { user: true, vehicle: true }
        });

        const alerts = documents.map(doc => {
            const isExpired = doc.expiryDate && new Date(doc.expiryDate) < today;
            return {
                id: doc.id,
                name: doc.name,
                type: doc.type,
                expiryDate: doc.expiryDate,
                isExpired,
                severity: isExpired ? 'CRITICAL' : 'WARNING',
                owner: doc.userId ? doc.user?.name : doc.vehicle?.plate
            };
        });

        return alerts;
    }
}
