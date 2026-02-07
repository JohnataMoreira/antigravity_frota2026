import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
    private s3Client: S3Client;
    private bucketName: string;
    private readonly logger = new Logger(StorageService.name);

    constructor(private configService: ConfigService) {
        this.bucketName = this.configService.get('STORAGE_BUCKET', 'frota2026-photos');

        // Config for MinIO (local) or S3 (prod)
        const endpoint = this.configService.get('STORAGE_ENDPOINT', 'http://localhost:9000');
        const region = this.configService.get('STORAGE_REGION', 'us-east-1');
        const accessKeyId = this.configService.get('MINIO_ROOT_USER', 'admin');
        const secretAccessKey = this.configService.get('MINIO_ROOT_PASSWORD', 'password');

        this.s3Client = new S3Client({
            region,
            endpoint,
            forcePathStyle: true, // Needed for MinIO
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });
    }

    async upload(file: Express.Multer.File, folder: string = 'uploads'): Promise<string> {
        const fileId = uuidv4();
        const extension = file.originalname.split('.').pop();
        const fileName = `${folder}/${fileId}.${extension}`;

        try {
            await this.s3Client.send(
                new PutObjectCommand({
                    Bucket: this.bucketName,
                    Key: fileName,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                    ACL: 'public-read', // Depends on bucket policy
                }),
            );

            // Return URL
            const endpoint = this.configService.get('STORAGE_ENDPOINT', 'http://localhost:9000');
            // If localhost, we might need a public URL different from internal docker URL.
            // For MVP, assuming internal is fine or we construct public URL.
            return `${endpoint}/${this.bucketName}/${fileName}`;
        } catch (error) {
            this.logger.error(`Failed to upload file: ${error}`);
            throw error;
        }
    }
}
