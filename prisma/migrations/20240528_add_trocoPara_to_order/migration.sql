-- Migration para adicionar o campo trocoPara na tabela Order
ALTER TABLE "Order" ADD COLUMN "trocoPara" DOUBLE PRECISION;
