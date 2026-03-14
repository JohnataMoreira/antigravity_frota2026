-- DropIndex
DROP INDEX "Attachment_organizationId_idx";

-- DropIndex
DROP INDEX "FinancialTransaction_organizationId_status_idx";

-- DropIndex
DROP INDEX "Journey_driverId_idx";

-- DropIndex
DROP INDEX "Journey_organizationId_status_idx";

-- DropIndex
DROP INDEX "Journey_startTime_idx";

-- DropIndex
DROP INDEX "Journey_vehicleId_idx";

-- DropIndex
DROP INDEX "Tyre_organizationId_idx";

-- DropIndex
DROP INDEX "TyreMovement_tyreId_idx";

-- AlterTable
ALTER TABLE "FinancialTransaction" ADD COLUMN     "journeyId" TEXT;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "address" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'DRIVER',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Task_organizationId_status_scheduledAt_idx" ON "Task"("organizationId", "status", "scheduledAt");

-- CreateIndex
CREATE INDEX "Task_journeyId_idx" ON "Task"("journeyId");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_token_key" ON "Invite"("token");

-- CreateIndex
CREATE INDEX "Invite_token_idx" ON "Invite"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_organizationId_email_key" ON "Invite"("organizationId", "email");

-- CreateIndex
CREATE INDEX "Attachment_organizationId_createdAt_idx" ON "Attachment"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_createdAt_idx" ON "AuditLog"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");

-- CreateIndex
CREATE INDEX "AuditLog_entityId_idx" ON "AuditLog"("entityId");

-- CreateIndex
CREATE INDEX "FinancialTransaction_organizationId_category_status_idx" ON "FinancialTransaction"("organizationId", "category", "status");

-- CreateIndex
CREATE INDEX "FinancialTransaction_journeyId_idx" ON "FinancialTransaction"("journeyId");

-- CreateIndex
CREATE INDEX "FuelEntry_organizationId_date_idx" ON "FuelEntry"("organizationId", "date");

-- CreateIndex
CREATE INDEX "FuelEntry_vehicleId_date_idx" ON "FuelEntry"("vehicleId", "date");

-- CreateIndex
CREATE INDEX "InventoryItem_organizationId_idx" ON "InventoryItem"("organizationId");

-- CreateIndex
CREATE INDEX "InventoryItem_sku_idx" ON "InventoryItem"("sku");

-- CreateIndex
CREATE INDEX "Journey_organizationId_status_createdAt_idx" ON "Journey"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Journey_driverId_startTime_idx" ON "Journey"("driverId", "startTime");

-- CreateIndex
CREATE INDEX "Journey_vehicleId_status_idx" ON "Journey"("vehicleId", "status");

-- CreateIndex
CREATE INDEX "StockMovement_inventoryItemId_idx" ON "StockMovement"("inventoryItemId");

-- CreateIndex
CREATE INDEX "Tyre_organizationId_status_idx" ON "Tyre"("organizationId", "status");

-- CreateIndex
CREATE INDEX "TyreMovement_tyreId_createdAt_idx" ON "TyreMovement"("tyreId", "createdAt");

-- CreateIndex
CREATE INDEX "Vehicle_active_idx" ON "Vehicle"("active");

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
