-- DropForeignKey
ALTER TABLE `activity` DROP FOREIGN KEY `Activity_subjectId_fkey`;

-- DropForeignKey
ALTER TABLE `answeredactivity` DROP FOREIGN KEY `AnsweredActivity_activityId_fkey`;

-- DropForeignKey
ALTER TABLE `answeredquestion` DROP FOREIGN KEY `AnsweredQuestion_questionId_fkey`;

-- DropForeignKey
ALTER TABLE `file` DROP FOREIGN KEY `File_questionId_fkey`;

-- DropForeignKey
ALTER TABLE `material` DROP FOREIGN KEY `Material_activityId_fkey`;

-- DropForeignKey
ALTER TABLE `question` DROP FOREIGN KEY `Question_activityId_fkey`;

-- AddForeignKey
ALTER TABLE `Activity` ADD CONSTRAINT `Activity_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `Subject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Question` ADD CONSTRAINT `Question_activityId_fkey` FOREIGN KEY (`activityId`) REFERENCES `Activity`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AnsweredActivity` ADD CONSTRAINT `AnsweredActivity_activityId_fkey` FOREIGN KEY (`activityId`) REFERENCES `Activity`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AnsweredQuestion` ADD CONSTRAINT `AnsweredQuestion_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `File` ADD CONSTRAINT `File_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Material` ADD CONSTRAINT `Material_activityId_fkey` FOREIGN KEY (`activityId`) REFERENCES `Activity`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
