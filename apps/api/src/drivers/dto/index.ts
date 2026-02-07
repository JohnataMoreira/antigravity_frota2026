import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateDriverDto {
    @IsNotEmpty()
    @IsString()
    name!: string;

    @IsEmail()
    email!: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    password!: string;

    @IsNotEmpty()
    @IsString()
    licenseNumber!: string;
}
