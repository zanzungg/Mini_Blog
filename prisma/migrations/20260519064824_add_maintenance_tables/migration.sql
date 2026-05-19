-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceUser" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceIp" (
    "id" SERIAL NOT NULL,
    "ip" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceIp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceUser_userId_key" ON "MaintenanceUser"("userId");

-- CreateIndex
CREATE INDEX "MaintenanceUser_userId_idx" ON "MaintenanceUser"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceIp_ip_key" ON "MaintenanceIp"("ip");

-- CreateIndex
CREATE INDEX "MaintenanceIp_ip_idx" ON "MaintenanceIp"("ip");

-- AddForeignKey
ALTER TABLE "MaintenanceUser" ADD CONSTRAINT "MaintenanceUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
