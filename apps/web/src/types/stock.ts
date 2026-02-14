export interface StockItem {
    id: string;
    organizationId: string;
    name: string;
    description?: string;
    category?: string;
    sku?: string;
    unit: string;
    minQuantity: number;
    currentQuantity: number;
    averageCost: number;
    updatedAt: string;
}

export interface StockMovement {
    id: string;
    stockItemId: string;
    userId?: string;
    type: 'IN' | 'OUT';
    quantity: number;
    unitCost?: number;
    reason?: string;
    referenceId?: string;
    createdAt: string;
}
