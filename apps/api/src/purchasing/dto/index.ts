import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested, IsUUID, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PurchaseOrderStatus } from '@prisma/client';

export class CreateSupplierDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsOptional()
    document?: string;

    @IsString()
    @IsOptional()
    category?: string;

    @IsString()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    phone?: string;
}

export class CreatePurchaseOrderItemDto {
    @IsString()
    @IsOptional()
    inventoryItemId?: string;

    @IsString()
    @IsNotEmpty()
    description!: string;

    @IsNumber()
    @IsNotEmpty()
    quantity!: number;

    @IsNumber()
    @IsOptional()
    unitPrice?: number;
}

export class CreatePurchaseOrderDto {
    @IsString()
    @IsOptional()
    supplierId?: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreatePurchaseOrderItemDto)
    items!: CreatePurchaseOrderItemDto[];
}

export class ApprovePurchaseOrderDto {
    @IsNumber()
    @IsOptional()
    totalValue?: number;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class UpdateOrderStatusDto {
    @IsEnum(PurchaseOrderStatus)
    status!: PurchaseOrderStatus;
}
