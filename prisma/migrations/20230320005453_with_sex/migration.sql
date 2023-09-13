/*
  Warnings:

  - You are about to drop the column `accountId` on the `user` table. All the data in the column will be lost.
  - Added the required column `sex` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `student` ADD COLUMN `sex` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `accountId`;
