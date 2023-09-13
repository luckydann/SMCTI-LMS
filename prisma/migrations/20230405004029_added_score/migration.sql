/*
  Warnings:

  - Added the required column `score` to the `AnsweredActivity` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `answeredactivity` ADD COLUMN `score` VARCHAR(191) NOT NULL;
