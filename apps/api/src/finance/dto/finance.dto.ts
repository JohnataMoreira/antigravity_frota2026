import { IsString, IsNumber, IsEnum, IsDateString, IsOptional, IsUUID } from 'class-validator';
import { TransactionType, TransactionStatus, PaymentMethod } from '@prisma/client';

export class CreateTransactionDto {
    @IsString()
    description!: string;

    @IsNumber()
    amount!: number;

    @IsEnum(TransactionType)
    @IsOptional()
    type?: TransactionType;

    @IsEnum(TransactionStatus)
    @IsOptional()
    status?: TransactionStatus;

    @IsString()
    category!: string;

    @IsDateString()
    dueDate!: string;

    @IsOptional()
    @IsDateString()
    paymentDate?: string;

    @IsOptional()
    @IsEnum(PaymentMethod)
    paymentMethod?: PaymentMethod;

    @IsOptional()
    @IsUUID()
    supplierId?: string;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class ConfirmPaymentDto {
    @IsDateString()
    paymentDate!: string;

    @IsEnum(PaymentMethod)
    paymentMethod!: PaymentMethod;

    @IsOptional()
    @IsString()
    attachmentUrl?: string;
}

export class TransactionFilterDto {
    @IsOptional()
    @IsEnum(TransactionStatus)
    status?: TransactionStatus;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsDateString()
    start?: string;

    @IsOptional()
    @IsDateString()
    end?: string;
}
