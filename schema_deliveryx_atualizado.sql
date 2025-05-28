-- SCHEMA DELIVERYX ATUALIZADO (compatível com Prisma)

CREATE TABLE "User" (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  avatarUrl VARCHAR(255),
  endereco TEXT,
  telefone VARCHAR(50),
  createdAt TIMESTAMP DEFAULT NOW(),
  ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE "Address" (
  id SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL REFERENCES "User"(id),
  rua VARCHAR(255) NOT NULL,
  numero VARCHAR(20) NOT NULL,
  bairro VARCHAR(100) NOT NULL,
  cidade VARCHAR(100) NOT NULL,
  estado CHAR(2) NOT NULL,
  complemento VARCHAR(255),
  cep VARCHAR(9) NOT NULL
);
CREATE INDEX idx_address_userId ON "Address"(userId);

CREATE TABLE "Restaurant" (
  id SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL REFERENCES "User"(id),
  nome VARCHAR(255) NOT NULL,
  taxa_entrega FLOAT NOT NULL,
  tempo_entrega INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL,
  imagem VARCHAR(255) NOT NULL,
  banner VARCHAR(255) DEFAULT '/banner-default.png',
  endereco TEXT,
  telefone VARCHAR(50),
  aberto BOOLEAN DEFAULT FALSE,
  cep VARCHAR(20),
  horario_funcionamento JSON
);

CREATE TABLE "Category" (
  id SERIAL PRIMARY KEY,
  restaurantId INTEGER NOT NULL REFERENCES "Restaurant"(id),
  nome VARCHAR(255) NOT NULL
);

CREATE TABLE "Product" (
  id SERIAL PRIMARY KEY,
  categoryId INTEGER NOT NULL REFERENCES "Category"(id),
  nome VARCHAR(255) NOT NULL,
  descricao TEXT NOT NULL,
  preco FLOAT NOT NULL,
  imagem VARCHAR(255) NOT NULL,
  ativo BOOLEAN NOT NULL
);
CREATE INDEX idx_product_categoryId ON "Product"(categoryId);

CREATE TABLE "Adicional" (
  id SERIAL PRIMARY KEY,
  productId INTEGER NOT NULL REFERENCES "Product"(id),
  nome VARCHAR(255) NOT NULL,
  preco FLOAT NOT NULL,
  quantidadeMax INTEGER NOT NULL
);
CREATE INDEX idx_adicional_productId ON "Adicional"(productId);

CREATE TABLE "Order" (
  id SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL REFERENCES "User"(id),
  restaurantId INTEGER NOT NULL REFERENCES "Restaurant"(id),
  addressId INTEGER NOT NULL REFERENCES "Address"(id),
  status VARCHAR(50) NOT NULL,
  total FLOAT NOT NULL,
  data_criacao TIMESTAMP DEFAULT NOW(),
  observacao TEXT,
  taxa_entrega FLOAT,
  formaPagamento VARCHAR(20),
  trocoPara FLOAT,
  reviewId INTEGER UNIQUE
);
CREATE INDEX idx_order_userId ON "Order"(userId);
CREATE INDEX idx_order_restaurantId ON "Order"(restaurantId);
CREATE INDEX idx_order_addressId ON "Order"(addressId);

CREATE TABLE "OrderItem" (
  id SERIAL PRIMARY KEY,
  orderId INTEGER NOT NULL REFERENCES "Order"(id),
  productId INTEGER NOT NULL REFERENCES "Product"(id),
  quantidade INTEGER NOT NULL,
  preco_unitario FLOAT NOT NULL
);
CREATE INDEX idx_orderitem_orderId ON "OrderItem"(orderId);
CREATE INDEX idx_orderitem_productId ON "OrderItem"(productId);

CREATE TABLE "OrderItemAdicional" (
  id SERIAL PRIMARY KEY,
  orderItemId INTEGER NOT NULL REFERENCES "OrderItem"(id),
  adicionalId INTEGER NOT NULL REFERENCES "Adicional"(id),
  quantidade INTEGER NOT NULL,
  preco_unitario FLOAT NOT NULL
);
CREATE INDEX idx_orderitemadicional_orderItemId ON "OrderItemAdicional"(orderItemId);
CREATE INDEX idx_orderitemadicional_adicionalId ON "OrderItemAdicional"(adicionalId);

CREATE TABLE "Review" (
  id SERIAL PRIMARY KEY,
  orderId INTEGER UNIQUE NOT NULL REFERENCES "Order"(id),
  nota INTEGER NOT NULL,
  comentario TEXT NOT NULL,
  restaurantId INTEGER REFERENCES "Restaurant"(id)
);

-- Relacionamento 1:1 entre Order e Review
ALTER TABLE "Order" ADD CONSTRAINT fk_order_review FOREIGN KEY ("reviewId") REFERENCES "Review"(id);

-- Fim do schema DeliveryX atualizado
