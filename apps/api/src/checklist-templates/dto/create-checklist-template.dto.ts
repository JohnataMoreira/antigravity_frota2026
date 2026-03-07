import { IsString, IsArray, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChecklistTemplateDto {
    @ApiProperty({ example: 'Checklist de Saída' })
    @IsString()
    name!: string;

    @ApiProperty({ example: 'Itens básicos para conferência na saída do veículo', required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ example: ['Nível de Óleo', 'Calibragem de Pneus', 'Lataria'] })
    @IsArray()
    @IsString({ each: true })
    items!: string[];

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
