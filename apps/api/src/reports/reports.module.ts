import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

import { ReportsCronService } from './reports-cron.service';

@Module({
    controllers: [ReportsController],
    providers: [ReportsService, ReportsCronService],
})
export class ReportsModule { }
