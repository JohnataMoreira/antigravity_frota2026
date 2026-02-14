/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    UseGuards,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('storage')
export class StorageController {
    constructor(private readonly storageService: StorageService) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async upload(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
                    new FileTypeValidator({ fileType: '.(png|jpeg|jpg|pdf)' }),
                ],
            }),
        )
        file: any,
    ) {
        try {
            const url = await this.storageService.upload(file);
            return { url };
        } catch {
            // Fallback or generic error
            return { success: false, message: 'Upload failed' };
        }
    }
}
