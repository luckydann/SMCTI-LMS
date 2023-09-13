-- DropForeignKey
ALTER TABLE `examstartrecord` DROP FOREIGN KEY `ExamStartRecord_activityId_fkey`;

-- DropForeignKey
ALTER TABLE `examstartrecord` DROP FOREIGN KEY `ExamStartRecord_studentId_fkey`;

-- AddForeignKey
ALTER TABLE `ExamStartRecord` ADD CONSTRAINT `ExamStartRecord_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExamStartRecord` ADD CONSTRAINT `ExamStartRecord_activityId_fkey` FOREIGN KEY (`activityId`) REFERENCES `Activity`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
