import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

import { ReportsCronService } from './reports-cron.service';
import { ReportsExportService } from './reports-export.service';

@Module({
    controllers: [ReportsController],
    providers: [ReportsService, ReportsCronService, ReportsExportService],
})
export class ReportsModule { }
