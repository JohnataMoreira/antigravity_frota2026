import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class StartJourneyDto {
    @IsNotEmpty()
    @IsUUID()
    vehicleId!: string;

    @IsNotEmpty()
    @IsInt()
    @Min(0)
    startKm!: number;

    // Optional initial location
    @IsOptional()
    lat?: number;

    @IsOptional()
    lng?: number;
}

export class EndJourneyDto {
    @IsNotEmpty()
    @IsInt()
    @Min(0)
    endKm!: number;

    @IsOptional()
    lat?: number;

    @IsOptional()
    lng?: number;
}
