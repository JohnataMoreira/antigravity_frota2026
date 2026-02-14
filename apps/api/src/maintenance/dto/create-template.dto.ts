import { IsEnum, IsNotEmpty, IsNumber, IsString, IsArray } from 'class-validator';
import { VehicleType } from '@prisma/client';

export class CreateMaintenanceTemplateDto {
    @IsNotEmpty()
    @IsString()
    name!: string;

    @IsNotEmpty()
    @IsString()
    type!: string; // PREVENTIVE, CORRECTIVE

    @IsArray()
    @IsEnum(VehicleType, { each: true })
    vehicleTypes!: VehicleType[];

    @IsNumber()
    averageDurationDays!: number;
}
