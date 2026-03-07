import { Controller, Get, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { UserRequest } from '../../auth/user-request.interface';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Alertas')
@ApiBearerAuth()
@Controller('alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
    constructor(private prisma: PrismaService) { }

    @Get()
    @ApiOperation({ summary: 'Listar alertas não resolvidos' })
    async findAll(@Request() req: UserRequest) {
        return this.prisma.alert.findMany({
            where: {
                organizationId: req.user.organizationId,
                resolved: false,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    @Patch(':id/resolve')
    @ApiOperation({ summary: 'Marcar alerta como resolvido' })
    async resolve(@Param('id') id: string, @Request() req: UserRequest) {
        return this.prisma.alert.update({
            where: {
                id,
                organizationId: req.user.organizationId,
            },
            data: {
                resolved: true,
            },
        });
    }
}
