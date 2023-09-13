/*
  Warnings:

  - Added the required column `accountId` to the `Teacher` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `teacher` ADD COLUMN `accountId` VARCHAR(191) NOT NULL;
