-- DropForeignKey
ALTER TABLE `subject` DROP FOREIGN KEY `Subject_teacherId_fkey`;

-- DropForeignKey
ALTER TABLE `teacher` DROP FOREIGN KEY `Teacher_userId_fkey`;

-- AddForeignKey
ALTER TABLE `Teacher` ADD CONSTRAINT `Teacher_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subject` ADD CONSTRAINT `Subject_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `Teacher`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
