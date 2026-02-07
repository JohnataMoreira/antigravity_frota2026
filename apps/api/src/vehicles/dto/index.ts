import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, Min } from 'class-validator';
import { VehicleType, VehicleStatus } from '@prisma/client';

export class CreateVehicleDto {
    @IsNotEmpty()
    @IsString()
    plate!: string;

    @IsNotEmpty()
    @IsString()
    model!: string;

    @IsOptional()
    @IsString()
    brand?: string;

    @IsOptional()
    @IsNumber()
    year?: number;

    @IsEnum(VehicleType)
    type!: VehicleType;

    @IsNumber()
    @Min(0)
    currentKm!: number;

    @IsOptional()
    @IsUrl()
    photoUrl?: string;
}

export class UpdateVehicleDto {
    @IsOptional()
    @IsString()
    model?: string;

    @IsOptional()
    @IsString()
    brand?: string;

    @IsOptional()
    @IsEnum(VehicleStatus)
    status?: VehicleStatus;

    @IsOptional()
    @IsUrl()
    photoUrl?: string;

    // Km updating is usually done via Journeys, but Admins might need manual fix
    @IsOptional()
    @IsNumber()
    @Min(0)
    currentKm?: number;
}
