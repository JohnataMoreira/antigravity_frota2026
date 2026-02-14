import { IsNotEmpty, IsOptional, IsString, IsEnum, IsUUID } from 'class-validator';

export class CreateIncidentDto {
    @IsOptional()
    @IsUUID()
    journeyId?: string;

    @IsNotEmpty()
    @IsUUID()
    vehicleId!: string;

    @IsNotEmpty()
    @IsString()
    description!: string;

    @IsOptional()
    @IsString()
    severity?: string; // LOW, MEDIUM, HIGH

    @IsOptional()
    @IsString()
    photoUrl?: string;
}
