import { IsNumber, IsNotEmpty, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum MovementType {
    IN = 'IN',
    OUT = 'OUT'
}

export enum MovementReason {
    PURCHASE = 'PURCHASE',
    MAINTENANCE = 'MAINTENANCE',
    ADJUSTMENT = 'ADJUSTMENT'
}

export class StockMovementDto {
    @ApiProperty({ enum: MovementType })
    @IsEnum(MovementType)
    type!: MovementType;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    quantity!: number;

    @ApiProperty({ enum: MovementReason })
    @IsEnum(MovementReason)
    reason!: MovementReason;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    maintenanceId?: string;
}
