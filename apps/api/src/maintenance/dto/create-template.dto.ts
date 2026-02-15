import { IsEnum, IsNotEmpty, IsNumber, IsString, IsArray } from 'class-validator';
import { VehicleType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMaintenanceTemplateDto {
    @ApiProperty({ description: 'Nome do catálogo/template', example: 'Troca de Óleo Padrão' })
    @IsNotEmpty()
    @IsString()
    name!: string;

    @ApiProperty({ description: 'Tipo da manutenção', enum: ['PREVENTIVE', 'CORRECTIVE'] })
    @IsNotEmpty()
    @IsString()
    type!: string; // PREVENTIVE, CORRECTIVE

    @ApiProperty({ description: 'Tipos de veículos compatíveis', enum: VehicleType, isArray: true })
    @IsArray()
    @IsEnum(VehicleType, { each: true })
    vehicleTypes!: VehicleType[];

    @ApiProperty({ description: 'Duração média estimada em dias', example: 1 })
    @IsNumber()
    averageDurationDays!: number;
}
