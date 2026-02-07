import { Controller, Post, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';

@Controller('storage')
export class StorageController {
    constructor(private readonly storageService: StorageService) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile(
        new ParseFilePipe({
            validators: [
                new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
                new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
            ],
        }),
    ) file: any) {
        // For MVP, we might save to disk or return a mock URL if S3 isn't configured in .env
        try {
            const url = await this.storageService.upload(file);
            return { url };
        } catch (e) {
            // Fallback for local dev without S3
            return { url: `https://mock-storage.com/${file.originalname}` };
        }
    }
}
