/*
  Warnings:

  - You are about to drop the column `cnpj` on the `Restaurant` table. All the data in the column will be lost.
  - You are about to drop the column `cpf` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Restaurant" DROP COLUMN "cnpj";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "cpf";
