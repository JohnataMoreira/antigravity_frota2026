import { Module } from '@nestjs/common';
import { TyresService } from './tyres.service';
import { TyresController } from './tyres.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [TyresController],
    providers: [TyresService],
})
export class TyresModule { }
