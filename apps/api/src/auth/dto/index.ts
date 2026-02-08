import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
    @IsEmail()
    email!: string;

    @IsNotEmpty()
    @IsString()
    password!: string;
}

export class RegisterDto {
    @IsEmail()
    email!: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    password!: string;

    @IsNotEmpty()
    @IsString()
    name!: string;
}

export class RegisterOrgDto {
    @IsNotEmpty()
    @IsString()
    firstName!: string;

    @IsNotEmpty()
    @IsString()
    lastName!: string;

    @IsNotEmpty()
    @IsString()
    orgName!: string;

    @IsOptional()
    @IsString()
    document?: string;

    @IsEmail()
    email!: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    password!: string;
}
