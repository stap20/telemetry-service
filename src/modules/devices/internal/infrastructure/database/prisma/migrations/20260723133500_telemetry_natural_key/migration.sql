-- CreateIndex
CREATE UNIQUE INDEX "telemetry_events_deviceId_recordedAt_key" ON "telemetry_events"("deviceId", "recordedAt");
