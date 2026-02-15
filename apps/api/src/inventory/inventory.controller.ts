import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from './dto/create-item.dto';
import { StockMovementDto } from './dto/stock-movement.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) { }

    @Get()
    @ApiOperation({ summary: 'Listar todos os itens do inventário' })
    findAll(@Request() req: any) {
        return this.inventoryService.findAll(req.user.organizationId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obter detalhes de um item' })
    findOne(@Param('id') id: string, @Request() req: any) {
        return this.inventoryService.findOne(id, req.user.organizationId);
    }

    @Post()
    @ApiOperation({ summary: 'Criar novo item no inventário' })
    create(@Request() req: any, @Body() data: CreateInventoryItemDto) {
        return this.inventoryService.create(req.user.organizationId, data);
    }

    @Post(':id/movements')
    @ApiOperation({ summary: 'Registrar movimentação de estoque (entrada/saída)' })
    registerMovement(
        @Param('id') id: string,
        @Request() req: any,
        @Body() data: StockMovementDto
    ) {
        return this.inventoryService.registerMovement(id, req.user.organizationId, data);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Remover item do inventário' })
    remove(@Param('id') id: string, @Request() req: any) {
        return this.inventoryService.remove(id, req.user.organizationId);
    }
}
