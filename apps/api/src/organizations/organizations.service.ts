import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
    constructor(private prisma: PrismaService) { }

    async getMe(organizationId: string) {
        const org = await this.prisma.organization.findUnique({
            where: { id: organizationId },
        });

        if (!org) {
            throw new NotFoundException('Organização não encontrada');
        }

        return org;
    }

    async updateMe(organizationId: string, updateDto: UpdateOrganizationDto) {
        return this.prisma.organization.update({
            where: { id: organizationId },
            data: updateDto,
        });
    }
}
