const mysql = require('mysql2/promise');

async function createTestReview() {
  try {
    console.log('Conectando ao banco...');
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'senha123',
      database: 'deliveryx'
    });

    // Primeiro, verificar se há pedidos entregues
    const [pedidosEntregues] = await connection.execute(
      'SELECT id FROM pedidos WHERE status = "entregue" LIMIT 1'
    );
    
    if (pedidosEntregues.length === 0) {
      console.log('Nenhum pedido entregue encontrado');
      await connection.end();
      return;
    }

    const pedidoId = pedidosEntregues[0].id;
    console.log('Pedido entregue encontrado:', pedidoId);

    // Verificar se já existe review para este pedido
    const [existingReview] = await connection.execute(
      'SELECT * FROM reviews WHERE pedido_id = ?',
      [pedidoId]
    );

    if (existingReview.length > 0) {
      console.log('Review já existe para este pedido:', existingReview[0]);
    } else {
      // Criar um review de teste
      await connection.execute(
        'INSERT INTO reviews (pedido_id, nota, comentario, created_at) VALUES (?, ?, ?, NOW())',
        [pedidoId, 5, 'Excelente atendimento! Comida deliciosa e entrega rápida.']
      );
      console.log('Review de teste criado para o pedido:', pedidoId);
    }

    // Verificar se o review foi criado/existe
    const [finalReview] = await connection.execute(
      'SELECT r.*, p.status FROM reviews r JOIN pedidos p ON r.pedido_id = p.id WHERE r.pedido_id = ?',
      [pedidoId]
    );
    console.log('Review final:', finalReview[0]);

    await connection.end();
  } catch (error) {
    console.error('Erro:', error);
  }
}

createTestReview();
