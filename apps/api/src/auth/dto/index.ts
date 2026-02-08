import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
    @IsEmail()
    email!: string;

    @IsNotEmpty()
    @IsString()
    password!: string;

    @IsNotEmpty()
    @IsString()
    document!: string;
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
    orgName!: string;

    @IsNotEmpty()
    @IsString()
    document!: string;

    @IsNotEmpty()
    @IsString()
    adminName!: string;

    @IsEmail()
    adminEmail!: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    password!: string;
}
