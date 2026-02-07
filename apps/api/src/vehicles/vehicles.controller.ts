import { Controller, Get, Post, Body, Patch, Param, Delete, Request } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto';

@Controller('vehicles')
export class VehiclesController {
    constructor(private readonly vehiclesService: VehiclesService) { }

    @Post()
    create(@Request() req: any, @Body() createVehicleDto: CreateVehicleDto) {
        return this.vehiclesService.create(req.user.organizationId, createVehicleDto);
    }

    @Get()
    findAll(@Request() req: any) {
        return this.vehiclesService.findAll(req.user.organizationId);
    }

    @Get(':id')
    findOne(@Request() req: any, @Param('id') id: string) {
        return this.vehiclesService.findOne(req.user.organizationId, id);
    }

    @Patch(':id')
    update(@Request() req: any, @Param('id') id: string, @Body() updateVehicleDto: UpdateVehicleDto) {
        return this.vehiclesService.update(req.user.organizationId, id, updateVehicleDto);
    }

    @Delete(':id')
    remove(@Request() req: any, @Param('id') id: string) {
        return this.vehiclesService.remove(req.user.organizationId, id);
    }
}
