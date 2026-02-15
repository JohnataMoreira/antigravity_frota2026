import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateIncidentDto {
    @ApiPropertyOptional({ description: 'ID da jornada associada' })
    @IsOptional()
    @IsUUID()
    journeyId?: string;

    @ApiProperty({ description: 'ID do veículo' })
    @IsNotEmpty()
    @IsUUID()
    vehicleId!: string;

    @ApiProperty({ description: 'Descrição detalhada do incidente', example: 'Pneu furado na BR-101' })
    @IsNotEmpty()
    @IsString()
    description!: string;

    @ApiPropertyOptional({ description: 'Severidade do incidente', example: 'MEDIUM', enum: ['LOW', 'MEDIUM', 'HIGH'] })
    @IsOptional()
    @IsString()
    severity?: string; // LOW, MEDIUM, HIGH

    @ApiPropertyOptional({ description: 'URL da foto do incidente' })
    @IsOptional()
    @IsString()
    photoUrl?: string;

    @ApiPropertyOptional({ description: 'Latitude do incidente' })
    @IsOptional()
    @IsString()
    lat?: string;

    @ApiPropertyOptional({ description: 'Longitude do incidente' })
    @IsOptional()
    @IsString()
    lng?: string;
}
