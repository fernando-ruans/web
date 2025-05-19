-- CreateTable
CREATE TABLE "OrderItemAdicional" (
    "id" SERIAL NOT NULL,
    "orderItemId" INTEGER NOT NULL,
    "adicionalId" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "preco_unitario" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "OrderItemAdicional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Adicional" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "preco" DOUBLE PRECISION NOT NULL,
    "quantidadeMax" INTEGER NOT NULL,

    CONSTRAINT "Adicional_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrderItemAdicional" ADD CONSTRAINT "OrderItemAdicional_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemAdicional" ADD CONSTRAINT "OrderItemAdicional_adicionalId_fkey" FOREIGN KEY ("adicionalId") REFERENCES "Adicional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adicional" ADD CONSTRAINT "Adicional_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
