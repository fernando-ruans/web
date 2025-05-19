# Deliveryx 1.0 - Multiestabelecimentos

## Como rodar o projeto

1. Configure o banco PostgreSQL e coloque a string de conexão no arquivo `.env` na raiz:

DATABASE_URL="postgresql://usuario:senha@localhost:5432/deliveryx"

2. Rode as migrations do Prisma:

    npx prisma migrate dev --name init

3. Instale as dependências do frontend:

    cd web && npm install && cd ..

4. Instale as dependências do backend (na raiz):

    npm install

5. Para rodar tudo junto, use:

    npm run dev

---

## Scripts sugeridos no package.json

```json
"scripts": {
  "dev": "concurrently \"npm run server\" \"npm run client\"",
  "server": "nodemon index.js",
  "client": "cd web && npm start"
}
```

---

## Estrutura do projeto
- Backend (Node.js/Express) na raiz
- Frontend (React) em /web
- Prisma em /prisma

---

## Observações
- O backend será iniciado pelo arquivo index.js na raiz.
- O frontend roda em /web normalmente.
- O Prisma já está configurado para PostgreSQL.
- O projeto não separa backend/frontend em pastas distintas para facilitar execução única.
