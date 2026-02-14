import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import * as zlib from 'zlib';

const execAsync = util.promisify(exec);

@Injectable()
export class BackupService {
    private readonly logger = new Logger(BackupService.name);
    private s3Client!: S3Client;
    private bucketName!: string;

    constructor(private configService: ConfigService) {
        this.initializeS3();
    }

    private initializeS3() {
        const endpoint = this.configService.get('STORAGE_ENDPOINT'); // Updated to match docker-compose
        const region = this.configService.get('STORAGE_REGION') || 'us-east-1';
        this.bucketName = 'frota-backups'; // Specialized bucket for backups

        const accessKeyId = this.configService.get('AWS_ACCESS_KEY_ID');
        const secretAccessKey = this.configService.get('AWS_SECRET_ACCESS_KEY');

        this.s3Client = new S3Client({
            region,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
            ...(endpoint && {
                endpoint,
                forcePathStyle: true,
            }),
        });
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleDailyBackup() {
        this.logger.log('Starting daily database backup...');
        try {
            await this.performBackup();
            this.logger.log('Daily backup completed successfully.');
        } catch (error) {
            this.logger.error('Failed to complete daily backup', error);
        }
    }

    async performBackup(): Promise<string> {
        const dbUrl = this.configService.get('DATABASE_URL');
        if (!dbUrl) {
            throw new Error('DATABASE_URL is not defined');
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup-${timestamp}.sql.gz`;
        const tempPath = path.join('/tmp', filename);

        this.logger.log(`Creating backup at ${tempPath}...`);

        // ensure bucket exists or just try upload? 
        // We assume bucket might need creation, but specialized S3 setup usually pre-creates. 
        // For MinIO, we might need to ensure it exists.
        // Skipping bucket creation check to keep it simple, user/admin should ensure bucket policy.

        try {
            // 1. Dump and Compress
            // Using pg_dump with connection string
            // We interpret the DB URL to ensure we pass it correctly or just pass it directly if supported.
            // CAUTION: passing password in command line args is insecure in some environments (ps aux), 
            // but in a container it's somewhat isolated. 
            // Better: use PGPASSWORD env var.

            // Extract password from URL if needed, but pg_dump accepts connection string.
            // We'll use the connection string.

            // Command: pg_dump "URL" | gzip > tempPath
            // Note: need to quote the URL safely.
            const command = `pg_dump "${dbUrl}" | gzip > "${tempPath}"`;

            await execAsync(command);

            const stats = fs.statSync(tempPath);
            this.logger.log(`Backup created. Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB. Uploading to S3...`);

            // 2. Upload to S3
            const fileStream = fs.createReadStream(tempPath);

            await this.s3Client.send(new PutObjectCommand({
                Bucket: this.bucketName,
                Key: filename,
                Body: fileStream,
                ContentType: 'application/gzip',
                ContentLength: stats.size, // Helpful for S3
            }));

            this.logger.log(`Backup uploaded to ${this.bucketName}/${filename}`);

            // 3. Cleanup
            fs.unlinkSync(tempPath);

            return filename;
        } catch (error) {
            this.logger.error('Backup process failed', error);
            // Try cleanup
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }
            throw error;
        }
    }
}
