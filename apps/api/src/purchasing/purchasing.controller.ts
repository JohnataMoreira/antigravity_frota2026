import { Controller, Get, Post, Body, Param, Patch, Query, Delete } from '@nestjs/common';
import { PurchasingService } from './purchasing.service';
import { CreateSupplierDto, CreatePurchaseOrderDto, ApprovePurchaseOrderDto } from './dto';
import { GetUser } from '../auth/get-user.decorator';
import { PurchaseOrderStatus } from '@prisma/client';

@Controller('purchasing')
export class PurchasingController {
    constructor(private readonly purchasingService: PurchasingService) { }

    // Suppliers
    @Post('suppliers')
    createSupplier(@GetUser('organizationId') orgId: string, @Body() dto: CreateSupplierDto) {
        return this.purchasingService.createSupplier(orgId, dto);
    }

    @Get('suppliers')
    getSuppliers(@GetUser('organizationId') orgId: string) {
        return this.purchasingService.getSuppliers(orgId);
    }

    // Orders
    @Post('orders')
    createOrder(
        @GetUser('organizationId') orgId: string,
        @GetUser('id') userId: string,
        @Body() dto: CreatePurchaseOrderDto
    ) {
        return this.purchasingService.createOrder(orgId, userId, dto);
    }

    @Get('orders')
    getOrders(
        @GetUser('organizationId') orgId: string,
        @Query('status') status?: PurchaseOrderStatus
    ) {
        return this.purchasingService.getOrders(orgId, status);
    }

    @Get('orders/:id')
    getOrderById(@GetUser('organizationId') orgId: string, @Param('id') id: string) {
        return this.purchasingService.getOrderById(orgId, id);
    }

    @Post('orders/:id/approve')
    approveOrder(
        @GetUser('organizationId') orgId: string,
        @GetUser('id') userId: string,
        @Param('id') id: string,
        @Body() dto: ApprovePurchaseOrderDto
    ) {
        return this.purchasingService.approveOrder(orgId, id, userId, dto);
    }

    @Post('orders/:id/complete')
    completeOrder(@GetUser('organizationId') orgId: string, @Param('id') id: string) {
        return this.purchasingService.completeOrder(orgId, id);
    }

    @Patch('orders/:id/cancel')
    cancelOrder(@GetUser('organizationId') orgId: string, @Param('id') id: string) {
        return this.purchasingService.cancelOrder(orgId, id);
    }
}
