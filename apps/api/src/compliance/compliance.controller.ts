import {
    Controller, Get, Post, Body, Param, Delete,
    Patch, Query, UseGuards, Request, UseInterceptors, UploadedFile
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ComplianceService } from './compliance.service';
import { UploadDocumentDto, UpdateDocumentDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';

@ApiTags('Conformidade e Documentos')
@Controller('compliance')
@UseGuards(JwtAuthGuard)
export class ComplianceController {
    constructor(private readonly complianceService: ComplianceService) { }

    @Post('upload')
    @ApiOperation({ summary: 'Fazer upload de um documento digital' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file'))
    upload(
        @Request() req: any,
        @UploadedFile() file: any,
        @Body() dto: UploadDocumentDto
    ) {
        return this.complianceService.uploadDocument(req.user.organizationId, dto, file);
    }

    @Get('documents')
    @ApiOperation({ summary: 'Listar documentos da organização' })
    findAll(@Request() req: any, @Query() query: any) {
        return this.complianceService.findAll(req.user.organizationId, query);
    }

    @Get('alerts')
    @ApiOperation({ summary: 'Obter alertas de documentos próximos ao vencimento' })
    getAlerts(@Request() req: any, @Query('days') days?: string) {
        return this.complianceService.getExpirations(req.user.organizationId, days ? parseInt(days) : 30);
    }

    @Delete('documents/:id')
    @ApiOperation({ summary: 'Deletar um documento' })
    remove(@Request() req: any, @Param('id') id: string) {
        return this.complianceService.remove(req.user.organizationId, id);
    }

    @Patch('documents/:id')
    @ApiOperation({ summary: 'Atualizar metadados de um documento' })
    update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateDocumentDto) {
        return this.complianceService.update(req.user.organizationId, id, dto);
    }
}
