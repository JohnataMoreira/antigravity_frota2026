import { IsNotEmpty, IsNumber, IsString, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFuelDto {
    @ApiProperty({ description: 'ID do veículo', example: 'uuid-do-veiculo' })
    @IsNotEmpty()
    @IsUUID()
    vehicleId!: string;

    @ApiPropertyOptional({ description: 'ID da jornada associada', example: 'uuid-da-jornada' })
    @IsOptional()
    @IsUUID()
    journeyId?: string;

    @ApiProperty({ description: 'Quilometragem no momento do abastecimento', example: 45000 })
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    km!: number;

    @ApiProperty({ description: 'Quantidade de litros', example: 50.5 })
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    liters!: number;

    @ApiProperty({ description: 'Valor total pago', example: 300.75 })
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    totalValue!: number;

    @ApiProperty({ description: 'Preço por litro', example: 5.95 })
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    pricePerLiter!: number;

    @ApiPropertyOptional({ description: 'Tipo de combustível', example: 'GASOLINE' })
    @IsOptional()
    @IsString()
    fuelType?: string;

    @ApiPropertyOptional({ description: 'Método de pagamento', example: 'CREDIT_CARD' })
    @IsOptional()
    @IsString()
    paymentMethod?: string;

    @ApiPropertyOptional({ description: 'Provedor de pagamento', example: 'Ipiranga' })
    @IsOptional()
    @IsString()
    paymentProvider?: string;

    @ApiPropertyOptional({ description: 'Url da foto do comprovante', example: 'https://storage...' })
    @IsOptional()
    @IsString()
    photoUrl?: string;

    @ApiPropertyOptional({ description: 'Notas adicionais', example: 'Tanque cheio' })
    @IsOptional()
    @IsString()
    notes?: string;
}
