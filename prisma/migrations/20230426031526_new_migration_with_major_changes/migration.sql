/*
  Warnings:

  - You are about to drop the `period` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pregnancy` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `duration` to the `Activity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `explanation` to the `Question` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `period` DROP FOREIGN KEY `Period_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `pregnancy` DROP FOREIGN KEY `Pregnancy_studentId_fkey`;

-- AlterTable
ALTER TABLE `activity` ADD COLUMN `duration` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `question` ADD COLUMN `explanation` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `period`;

-- DropTable
DROP TABLE `pregnancy`;

-- CreateTable
CREATE TABLE `ExamStartRecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `timeStart` DATETIME(3) NOT NULL,
    `studentId` INTEGER NOT NULL,
    `activityId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ExamStartRecord` ADD CONSTRAINT `ExamStartRecord_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExamStartRecord` ADD CONSTRAINT `ExamStartRecord_activityId_fkey` FOREIGN KEY (`activityId`) REFERENCES `Activity`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
