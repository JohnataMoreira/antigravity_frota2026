import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttachmentType } from '@prisma/client';

@Injectable()
export class AttachmentsService {
    constructor(private prisma: PrismaService) { }

    async createAttachment(data: {
        organizationId: string;
        checklistId?: string;
        incidentId?: string;
        journeyId?: string;
        url: string;
        type?: AttachmentType;
        mimeType?: string;
        originalName?: string;
        size?: number;
    }) {
        return this.prisma.attachment.create({
            data,
        });
    }

    async getByChecklist(checklistId: string) {
        return this.prisma.attachment.findMany({
            where: { checklistId },
        });
    }

    async getByIncident(incidentId: string) {
        return this.prisma.attachment.findMany({
            where: { incidentId },
        });
    }

    async getByJourney(journeyId: string) {
        return this.prisma.attachment.findMany({
            where: { journeyId },
        });
    }

    async deleteAttachment(id: string, organizationId: string) {
        return this.prisma.attachment.delete({
            where: { id, organizationId },
        });
    }
}
