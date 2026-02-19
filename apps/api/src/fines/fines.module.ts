import { Module } from '@nestjs/common';
import { FinesService } from './fines.service';
import { FinesController } from './fines.controller';

@Module({
    controllers: [FinesController],
    providers: [FinesService],
    exports: [FinesService],
})
export class FinesModule { }
