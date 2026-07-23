-- AlterTable
ALTER TABLE "alerts" ADD COLUMN     "resolvedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "alerts_deviceId_type_resolvedAt_idx" ON "alerts"("deviceId", "type", "resolvedAt");
