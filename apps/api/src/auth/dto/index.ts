import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';

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
    @Matches(/^(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})$|^(\d{14})$/, {
        message: 'Invalid CNPJ format (XX.XXX.XXX/XXXX-XX or 14 digits)',
    })
    document?: string;

    @IsEmail()
    email!: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    password!: string;
}

export class RegisterInviteDto {
    @IsNotEmpty()
    @IsString()
    token!: string;

    @IsNotEmpty()
    @IsString()
    name!: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    password!: string;
}
