-- CreateTable
CREATE TABLE `Pregnancy` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sexDate` DATETIME(3) NOT NULL,
    `laborDate` DATETIME(3) NOT NULL,
    `studentId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Pregnancy` ADD CONSTRAINT `Pregnancy_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
