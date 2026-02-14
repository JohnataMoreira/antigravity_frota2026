import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;

    constructor(private configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get('MAIL_HOST') || 'smtp.mailtrap.io',
            port: Number(this.configService.get('MAIL_PORT')) || 2525,
            auth: {
                user: this.configService.get('MAIL_USER'),
                pass: this.configService.get('MAIL_PASS'),
            },
        });
    }

    async sendMail(to: string, subject: string, html: string, attachments?: any[]) {
        try {
            await this.transporter.sendMail({
                from: `"Frota2026 Admin" <${this.configService.get('MAIL_FROM') || 'no-reply@frota2026.com.br'}>`,
                to,
                subject,
                html,
                attachments,
            });
        } catch (error) {
            console.error('Email Delivery Failed:', error);
        }
    }
}
