import { Module } from '@nestjs/common';
import { TyresController } from './tyres.controller';
import { TyresService } from './tyres.service';

@Module({
    controllers: [TyresController],
    providers: [TyresService],
    exports: [TyresService]
})
export class TyresModule { }
