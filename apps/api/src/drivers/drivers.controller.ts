import { Controller, Get, Post, Body, Request } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto';

@Controller('drivers')
export class DriversController {
    constructor(private readonly driversService: DriversService) { }

    @Post()
    create(@Request() req: any, @Body() createDriverDto: CreateDriverDto) {
        return this.driversService.create(req.user.organizationId, createDriverDto);
    }

    @Get()
    findAll(@Request() req: any) {
        return this.driversService.findAll(req.user.organizationId);
    }
}
