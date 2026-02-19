import { Module } from '@nestjs/common';
import { PurchasingService } from './purchasing.service';
import { PurchasingController } from './purchasing.controller';
import { FinanceModule } from '../finance/finance.module';

@Module({
    imports: [FinanceModule],
    controllers: [PurchasingController],
    providers: [PurchasingService],
    exports: [PurchasingService],
})
export class PurchasingModule { }
