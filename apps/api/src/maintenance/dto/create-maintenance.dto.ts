import { IsNotEmpty, IsString, IsUUID, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MaintenanceType } from '@prisma/client';

export class CreateMaintenanceDto {
    @ApiProperty({ description: 'ID do veículo', example: 'uuid-do-veiculo' })
    @IsNotEmpty()
    @IsUUID()
    vehicleId!: string;

    @ApiProperty({ enum: MaintenanceType, description: 'Tipo de manutenção' })
    @IsNotEmpty()
    @IsEnum(MaintenanceType)
    type!: MaintenanceType;

    @ApiPropertyOptional({ description: 'Quilometragem da última manutenção', example: 40000 })
    @IsOptional()
    @IsNumber()
    lastKm?: number;

    @ApiProperty({ description: 'Quilometragem prevista para a manutenção', example: 50000 })
    @IsNotEmpty()
    @IsNumber()
    nextDueKm!: number;

    @ApiPropertyOptional({ description: 'Observações adicionais' })
    @IsOptional()
    @IsString()
    notes?: string;
}
