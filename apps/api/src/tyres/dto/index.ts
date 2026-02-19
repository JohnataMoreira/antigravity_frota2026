import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { TyreStatus } from '@prisma/client';

export class CreateTyreDto {
    @IsString()
    @IsNotEmpty()
    identifier!: string; // Fogo / ID unico

    @IsString()
    @IsNotEmpty()
    brand!: string;

    @IsString()
    @IsNotEmpty()
    model!: string;

    @IsString()
    @IsNotEmpty()
    size!: string;

    @IsString()
    @IsOptional()
    dot?: string;

    @IsNumber()
    @IsOptional()
    initialCost?: number;

    @IsNumber()
    @IsOptional()
    initialKm?: number;
}

export class InstallTyreDto {
    @IsString()
    @IsNotEmpty()
    vehicleId!: string;

    @IsNumber()
    @IsNotEmpty()
    axle!: number;

    @IsString()
    @IsNotEmpty()
    position!: string; // Ex: L, R, LI, RI, LE, RE

    @IsNumber()
    @IsNotEmpty()
    km!: number; // KM do veiculo no momento da instalacao
}

export class RecordMeasurementDto {
    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    @Max(40)
    treadDepth!: number; // mm

    @IsNumber()
    @IsOptional()
    pressure?: number;

    @IsNumber()
    @IsNotEmpty()
    km!: number; // KM do pneu/veiculo no momento
}

export class TyreRotationDto {
    @IsString()
    @IsNotEmpty()
    vehicleId!: string;

    @IsNumber()
    @IsNotEmpty()
    axle!: number;

    @IsString()
    @IsNotEmpty()
    position!: string;

    @IsNumber()
    @IsNotEmpty()
    km!: number;
}
