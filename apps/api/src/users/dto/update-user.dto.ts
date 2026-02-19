import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    @MinLength(6)
    password?: string;

    @IsOptional()
    @IsString()
    licenseNumber?: string;

    @IsOptional()
    @IsEnum(Role)
    role?: Role;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    cpf?: string;

    @IsOptional()
    @IsString()
    birthDate?: string;

    @IsOptional()
    @IsString()
    entryDate?: string;

    @IsOptional()
    @IsString()
    addressStreet?: string;

    @IsOptional()
    @IsString()
    addressNumber?: string;

    @IsOptional()
    @IsString()
    addressComplement?: string;

    @IsOptional()
    @IsString()
    addressNeighborhood?: string;

    @IsOptional()
    @IsString()
    addressCity?: string;

    @IsOptional()
    @IsString()
    addressState?: string;

    @IsOptional()
    @IsString()
    addressZipCode?: string;

    @IsOptional()
    @IsString()
    avatarUrl?: string;
}
