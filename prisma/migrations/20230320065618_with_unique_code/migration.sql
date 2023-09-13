/*
  Warnings:

  - A unique constraint covering the columns `[uniqueCode]` on the table `Subject` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `uniqueCode` to the `Subject` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `subject` ADD COLUMN `uniqueCode` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Subject_uniqueCode_key` ON `Subject`(`uniqueCode`);
