import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
    constructor(private readonly financeService: FinanceService) { }

    @Get('overview')
    async getOverview(@Request() req: any) {
        return this.financeService.getOverview(req.user.organizationId);
    }
}
