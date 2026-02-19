import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { DocumentType } from '@prisma/client';

export class UploadDocumentDto {
    @ApiProperty({ enum: DocumentType })
    @IsEnum(DocumentType)
    type!: DocumentType;

    @ApiProperty()
    @IsString()
    name!: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    number?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    issueDate?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    expiryDate?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    userId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    vehicleId?: string;
}

export class UpdateDocumentDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    number?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    expiryDate?: string;
}
