const mysql = require('mysql2/promise');

async function checkDatabase() {
  try {
    console.log('Conectando ao banco...');
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'senha123',
      database: 'deliveryx'
    });
    console.log('Conectado com sucesso!');

    // Verificar estrutura da tabela reviews
    const [reviewsStructure] = await connection.execute('DESCRIBE reviews');
    console.log('Estrutura da tabela reviews:', reviewsStructure);

    // Verificar se há reviews
    const [reviewCount] = await connection.execute('SELECT COUNT(*) as total FROM reviews');
    console.log('Total de reviews:', reviewCount[0].total);

    // Verificar se há reviews com dados
    const [reviews] = await connection.execute('SELECT * FROM reviews LIMIT 3');
    console.log('Primeiros reviews:', reviews);

    // Verificar pedidos entregues
    const [pedidosEntregues] = await connection.execute('SELECT id, status FROM pedidos WHERE status = "entregue" LIMIT 3');
    console.log('Pedidos entregues:', pedidosEntregues);

    await connection.end();
    console.log('Conexão fechada.');
  } catch (error) {
    console.error('Erro ao conectar:', error.message);
  }
}

checkDatabase();
