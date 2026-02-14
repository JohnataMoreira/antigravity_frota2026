/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
    private s3Client: S3Client;
    private readonly logger = new Logger(StorageService.name);

    constructor(private configService: ConfigService) {
        const endpoint = this.configService.get('AWS_ENDPOINT');
        const forcePathStyle = this.configService.get('AWS_S3_FORCE_PATH_STYLE') === 'true';

        this.s3Client = new S3Client({
            region: this.configService.get('AWS_REGION'),
            credentials: {
                accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID') || '',
                secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY') || '',
            },
            // MinIO-specific configuration
            ...(endpoint && {
                endpoint,
                forcePathStyle, // Required for MinIO
            }),
        });

        this.logger.log(`Storage configured: ${endpoint ? 'MinIO' : 'AWS S3'}`);
    }

    async upload(file: any): Promise<string> {
        const fileExtension = file.originalname.split('.').pop();
        const fileName = `${uuidv4()}.${fileExtension}`;
        const bucketName = this.configService.get('AWS_S3_BUCKET');

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
        });

        try {
            await this.s3Client.send(command);

            // Check if using MinIO
            const endpoint = this.configService.get('AWS_ENDPOINT');
            if (endpoint) {
                // MinIO URL
                return `${endpoint}/${bucketName}/${fileName}`;
            } else {
                // AWS S3 URL
                return `https://${bucketName}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${fileName}`;
            }
        } catch (error) {
            this.logger.error('Error uploading file', error);
            throw error;
        }
    }
}
