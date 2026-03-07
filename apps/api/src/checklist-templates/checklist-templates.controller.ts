import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ChecklistTemplatesService } from './checklist-templates.service';
import { CreateChecklistTemplateDto, UpdateChecklistTemplateDto } from './dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('checklist-templates')
@ApiBearerAuth()
@Controller('checklist-templates')
export class ChecklistTemplatesController {
    constructor(private readonly checklistTemplatesService: ChecklistTemplatesService) { }

    @Post()
    @ApiOperation({ summary: 'Criar um novo modelo de checklist' })
    create(@Body() createChecklistTemplateDto: CreateChecklistTemplateDto) {
        return this.checklistTemplatesService.create(createChecklistTemplateDto);
    }

    @Get()
    @ApiOperation({ summary: 'Listar todos os modelos de checklist da organização' })
    findAll() {
        return this.checklistTemplatesService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obter detalhes de um modelo de checklist' })
    findOne(@Param('id') id: string) {
        return this.checklistTemplatesService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Atualizar um modelo de checklist' })
    update(@Param('id') id: string, @Body() updateChecklistTemplateDto: UpdateChecklistTemplateDto) {
        return this.checklistTemplatesService.update(id, updateChecklistTemplateDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Remover um modelo de checklist' })
    remove(@Param('id') id: string) {
        return this.checklistTemplatesService.remove(id);
    }
}
