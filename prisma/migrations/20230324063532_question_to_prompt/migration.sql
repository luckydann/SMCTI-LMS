/*
  Warnings:

  - You are about to drop the column `question` on the `question` table. All the data in the column will be lost.
  - Added the required column `prompt` to the `Question` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `question` DROP COLUMN `question`,
    ADD COLUMN `prompt` VARCHAR(191) NOT NULL;
