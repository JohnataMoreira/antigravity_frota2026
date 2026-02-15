import { IsNumber, IsOptional, IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IngestTelemetryDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    latitude!: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    longitude!: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    speed?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    odometer?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    fuelLevel?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    rpm?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    voltage?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    engineStatus?: boolean;
}
