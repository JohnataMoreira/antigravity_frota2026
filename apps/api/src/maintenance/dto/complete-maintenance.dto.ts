import { IsNotEmpty, IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteMaintenanceDto {
    @ApiProperty({ description: 'Custo total da manutenção', example: 450.50 })
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    cost!: number;

    @ApiProperty({ description: 'Quilometragem no momento da execução', example: 50100 })
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    lastKm!: number;

    @ApiPropertyOptional({ description: 'Observações sobre o serviço executado' })
    @IsOptional()
    @IsString()
    notes?: string;
}
