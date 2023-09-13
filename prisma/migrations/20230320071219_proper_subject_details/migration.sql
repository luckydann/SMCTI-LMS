/*
  Warnings:

  - You are about to drop the column `name` on the `subject` table. All the data in the column will be lost.
  - Added the required column `code` to the `Subject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Subject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Subject` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `subject` DROP COLUMN `name`,
    ADD COLUMN `code` VARCHAR(191) NOT NULL,
    ADD COLUMN `description` VARCHAR(191) NOT NULL,
    ADD COLUMN `title` VARCHAR(191) NOT NULL;
