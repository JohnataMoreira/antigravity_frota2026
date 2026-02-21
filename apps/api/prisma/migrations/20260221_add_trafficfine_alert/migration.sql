-- Migration: add_trafficfine_and_alert
-- TrafficFine and Alert models with proper relations

-- Add TrafficFine table
CREATE TABLE IF NOT EXISTS "TrafficFine" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT,
    "journeyId" TEXT,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "points" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING_IDENTIFICATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrafficFine_pkey" PRIMARY KEY ("id")
);

-- Add Alert table
CREATE TABLE IF NOT EXISTS "Alert" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "entityId" TEXT,
    "entityType" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- Add trafficFineId to Attachment
ALTER TABLE "Attachment" ADD COLUMN IF NOT EXISTS "trafficFineId" TEXT;

-- Add trafficFineId to FinancialTransaction
ALTER TABLE "FinancialTransaction" ADD COLUMN IF NOT EXISTS "trafficFineId" TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS "TrafficFine_organizationId_status_idx" ON "TrafficFine"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "TrafficFine_vehicleId_idx" ON "TrafficFine"("vehicleId");
CREATE INDEX IF NOT EXISTS "TrafficFine_driverId_idx" ON "TrafficFine"("driverId");
CREATE INDEX IF NOT EXISTS "Alert_organizationId_isRead_idx" ON "Alert"("organizationId", "isRead");
CREATE INDEX IF NOT EXISTS "Attachment_trafficFineId_idx" ON "Attachment"("trafficFineId");

-- Add foreign keys
ALTER TABLE "TrafficFine" ADD CONSTRAINT "TrafficFine_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrafficFine" ADD CONSTRAINT "TrafficFine_vehicleId_fkey" 
    FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrafficFine" ADD CONSTRAINT "TrafficFine_driverId_fkey" 
    FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TrafficFine" ADD CONSTRAINT "TrafficFine_journeyId_fkey" 
    FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Alert" ADD CONSTRAINT "Alert_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_trafficFineId_fkey" 
    FOREIGN KEY ("trafficFineId") REFERENCES "TrafficFine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_trafficFineId_fkey" 
    FOREIGN KEY ("trafficFineId") REFERENCES "TrafficFine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Enum values (PostgreSQL doesn't require explicit enum types when stored as TEXT)
-- FineStatus values: PENDING_IDENTIFICATION, IDENTIFIED, PAID, APPEAL, CANCELED
-- AlertSeverity values: INFO, WARNING, CRITICAL
-- AlertType values: MAINTENANCE, DOCUMENT, STOCK, FINE, EXPIRY
