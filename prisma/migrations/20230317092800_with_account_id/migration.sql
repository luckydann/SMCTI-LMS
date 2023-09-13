/*
  Warnings:

  - You are about to drop the column `accountId` on the `student` table. All the data in the column will be lost.
  - You are about to drop the column `accountId` on the `teacher` table. All the data in the column will be lost.
  - Added the required column `accountId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `student` DROP COLUMN `accountId`;

-- AlterTable
ALTER TABLE `teacher` DROP COLUMN `accountId`;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `accountId` VARCHAR(191) NOT NULL;
