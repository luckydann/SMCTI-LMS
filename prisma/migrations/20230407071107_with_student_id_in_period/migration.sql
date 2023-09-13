/*
  Warnings:

  - Added the required column `studentId` to the `Period` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `period` ADD COLUMN `studentId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Period` ADD CONSTRAINT `Period_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
