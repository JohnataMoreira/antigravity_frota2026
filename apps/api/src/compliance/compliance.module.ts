console.log('[DEBUG] Loading ComplianceModule file...');
import { Module, Global } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { ComplianceController } from './compliance.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [ComplianceController],
  providers: [ComplianceService],
  exports: [ComplianceService], // Exported for use in Journeys Module
})
export class ComplianceModule { }
