import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    UseGuards,
    Body,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../storage/storage.service';
import { AttachmentsService } from './attachments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { AttachmentType } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('attachments')
export class AttachmentsController {
    constructor(
        private readonly storageService: StorageService,
        private readonly attachmentsService: AttachmentsService,
    ) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async upload(
        @UploadedFile() file: any,
        @Body() body: {
            type?: AttachmentType;
            checklistId?: string;
            incidentId?: string;
            journeyId?: string;
        },
        @GetUser() user: any,
    ) {
        if (!file) {
            throw new BadRequestException('File is required');
        }

        // Upload to storage (S3/MinIO/Local)
        const url = await this.storageService.upload(file);

        // Save metadata in database
        const attachment = await this.attachmentsService.createAttachment({
            organizationId: user.organizationId,
            checklistId: body.checklistId,
            incidentId: body.incidentId,
            journeyId: body.journeyId,
            url,
            type: body.type || 'IMAGE',
            mimeType: file.mimetype,
            originalName: file.originalname,
            size: file.size,
        });

        return attachment;
    }
}
