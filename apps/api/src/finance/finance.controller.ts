import { Controller, Get, Post, Body, Param, Query, UseGuards, Patch } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CreateTransactionDto, ConfirmPaymentDto, TransactionFilterDto } from './dto/finance.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
    constructor(private readonly financeService: FinanceService) { }

    @Get('overview')
    async getOverview(@GetUser('organizationId') organizationId: string, @Query() filters: any) {
        return this.financeService.getOverview(organizationId, filters);
    }

    @Get('transactions')
    async getTransactions(@GetUser('organizationId') organizationId: string, @Query() filters: TransactionFilterDto) {
        return this.financeService.getTransactions(organizationId, filters);
    }

    @Post('transactions')
    async createTransaction(@GetUser('organizationId') organizationId: string, @Body() dto: CreateTransactionDto) {
        return this.financeService.createTransaction({ ...dto, organizationId });
    }

    @Patch('transactions/:id/confirm')
    async confirmPayment(@Param('id') id: string, @Body() dto: ConfirmPaymentDto) {
        return this.financeService.confirmPayment(id, {
            ...dto,
            paymentDate: new Date(dto.paymentDate)
        });
    }
}
