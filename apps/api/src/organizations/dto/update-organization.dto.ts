import { IsString, IsOptional, IsHexColor, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrganizationDto {
    @ApiPropertyOptional({ example: 'Nome da Empresa' })
    @IsString()
    @IsOptional()
    @MaxLength(100)
    name?: string;

    @ApiPropertyOptional({ example: '12.345.678/0001-90' })
    @IsString()
    @IsOptional()
    document?: string;

    @ApiPropertyOptional({ example: '#2563eb' })
    @IsString()
    @IsOptional()
    @IsHexColor()
    primaryColor?: string;

    @ApiPropertyOptional({ example: 'https://storage.com/logo.png' })
    @IsString()
    @IsOptional()
    logoUrl?: string;

    @ApiPropertyOptional({ example: 'Rua Exemplo, 123' })
    @IsString()
    @IsOptional()
    address?: string;

    @ApiPropertyOptional({ example: '(11) 98765-4321' })
    @IsString()
    @IsOptional()
    phone?: string;
}
