import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
    @IsNotEmpty()
    @IsString()
    name!: string;

    @IsEmail()
    email!: string;

    @IsNotEmpty()
    @MinLength(6)
    password!: string;

    @IsEnum(Role)
    role!: Role;

    @IsOptional()
    @IsString()
    licenseNumber?: string;

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
}
