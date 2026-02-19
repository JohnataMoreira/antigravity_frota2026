import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { TyresService } from './tyres.service';
import { CreateTyreDto, InstallTyreDto, RecordMeasurementDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRequest } from '../auth/user-request.interface';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Pneus')
@UseGuards(JwtAuthGuard)
@Controller('tyres')
export class TyresController {
    constructor(private readonly tyresService: TyresService) { }

    @Post()
    create(@Request() req: UserRequest, @Body() dto: CreateTyreDto) {
        return this.tyresService.create(req.user.organizationId, dto);
    }

    @Get()
    findAll(@Request() req: UserRequest) {
        return this.tyresService.findAll(req.user.organizationId);
    }

    @Get(':id')
    findOne(@Request() req: UserRequest, @Param('id') id: string) {
        return this.tyresService.findOne(req.user.organizationId, id);
    }

    @Post(':id/install')
    install(@Request() req: UserRequest, @Param('id') id: string, @Body() dto: InstallTyreDto) {
        return this.tyresService.install(req.user.organizationId, id, dto);
    }

    @Post(':id/measure')
    measure(@Request() req: UserRequest, @Param('id') id: string, @Body() dto: RecordMeasurementDto) {
        return this.tyresService.recordMeasurement(req.user.organizationId, id, dto);
    }

    @Patch(':id/remove')
    remove(@Request() req: UserRequest, @Param('id') id: string, @Body() body: { km: number, notes?: string }) {
        return this.tyresService.remove(req.user.organizationId, id, body.km, body.notes);
    }
}
