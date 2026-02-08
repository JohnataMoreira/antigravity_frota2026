import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    HttpCode,
    HttpStatus
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { GetUser } from '../auth/get-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    @Roles('ADMIN')
    @HttpCode(HttpStatus.CREATED)
    create(
        @Body() createUserDto: CreateUserDto,
        @GetUser('orgId') orgId: string,
    ) {
        return this.usersService.create(createUserDto, orgId);
    }

    @Get()
    findAll(@GetUser('orgId') orgId: string) {
        return this.usersService.findAll(orgId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @GetUser('orgId') orgId: string) {
        return this.usersService.findOne(id, orgId);
    }

    @Patch(':id')
    @Roles('ADMIN')
    update(
        @Param('id') id: string,
        @Body() updateUserDto: UpdateUserDto,
        @GetUser('orgId') orgId: string,
    ) {
        return this.usersService.update(id, updateUserDto, orgId);
    }

    @Delete(':id')
    @Roles('ADMIN')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id') id: string, @GetUser('orgId') orgId: string) {
        return this.usersService.remove(id, orgId);
    }
}
