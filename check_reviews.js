const mysql = require('mysql2/promise');

async function checkReviews() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'senha123',
      database: 'deliveryx'
    });

    // Verificar se há reviews na tabela
    const [reviews] = await connection.execute('SELECT * FROM reviews LIMIT 5');
    console.log('Reviews existentes:', reviews);

    // Verificar pedidos entregues com reviews
    const [pedidosComReviews] = await connection.execute(
      'SELECT p.id, p.status, r.nota, r.comentario FROM pedidos p LEFT JOIN reviews r ON p.id = r.pedido_id WHERE p.status = "entregue" LIMIT 5'
    );
    console.log('Pedidos entregues com reviews:', pedidosComReviews);

    await connection.end();
  } catch (error) {
    console.error('Erro:', error);
  }
}

checkReviews();
