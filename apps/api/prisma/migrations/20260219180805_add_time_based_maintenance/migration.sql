-- AlterTable
ALTER TABLE "Maintenance" ADD COLUMN     "nextDueDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "MaintenanceTemplate" ADD COLUMN     "intervalMonths" INTEGER DEFAULT 12;
