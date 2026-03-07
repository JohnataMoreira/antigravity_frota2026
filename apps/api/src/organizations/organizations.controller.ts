import {
    Controller,
    Get,
    Patch,
    Body,
    UseGuards,
    Request,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { StorageService } from '../storage/storage.service';

@ApiTags('organizations')
@ApiBearerAuth()
@Controller('organizations')
export class OrganizationsController {
    constructor(
        private readonly organizationsService: OrganizationsService,
        private readonly storageService: StorageService,
    ) { }

    @Get('me')
    @ApiOperation({ summary: 'Obter dados da minha organização' })
    getMe(@Request() req: any) {
        return this.organizationsService.getMe(req.user.organizationId);
    }

    @Patch('me')
    @ApiOperation({ summary: 'Atualizar dados da minha organização' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('logo'))
    async updateMe(
        @Request() req: any,
        @Body() updateDto: UpdateOrganizationDto,
        @UploadedFile() file?: any,
    ) {
        if (file) {
            const logoUrl = await this.storageService.upload(file);
            updateDto.logoUrl = logoUrl;
        }

        return this.organizationsService.updateMe(req.user.organizationId, updateDto);
    }
}
