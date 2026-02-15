import { IsString, IsOptional, IsNumber, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInventoryItemDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name!: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    sku?: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    category!: string;

    @ApiProperty({ default: 'UN' })
    @IsString()
    @IsOptional()
    unit?: string;

    @ApiProperty({ default: 0 })
    @IsNumber()
    @IsOptional()
    minQuantity?: number;

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    price?: number;
}
