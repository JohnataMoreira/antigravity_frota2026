-- AddColumn: Organization.logoUrl
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;

-- AddColumn: Organization.primaryColor
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "primaryColor" TEXT DEFAULT '#2563eb';

-- CreateTable: Alert
CREATE TABLE IF NOT EXISTS "Alert" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ChecklistTemplate
CREATE TABLE IF NOT EXISTS "ChecklistTemplate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "items" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ChecklistTemplate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey: Alert -> Organization
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: ChecklistTemplate -> Organization
ALTER TABLE "ChecklistTemplate" ADD CONSTRAINT "ChecklistTemplate_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
