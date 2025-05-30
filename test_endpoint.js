const http = require('http');

function testLojistaEndpoint() {
  console.log('Testando endpoint /api/lojista/pedidos...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/lojista/pedidos',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer your_token_here' // Você pode precisar ajustar isso
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const pedidos = JSON.parse(data);
        console.log('Resposta recebida:');
        console.log('Total de pedidos:', pedidos.length);
        
        // Procurar por pedidos entregues com reviews
        const pedidosComReview = pedidos.filter(p => p.status === 'entregue' && p.review);
        console.log('Pedidos entregues com review:', pedidosComReview.length);
        
        if (pedidosComReview.length > 0) {
          console.log('Primeiro pedido com review:', JSON.stringify(pedidosComReview[0], null, 2));
        } else {
          console.log('Nenhum pedido entregue com review encontrado');
          // Mostrar alguns pedidos entregues
          const entregues = pedidos.filter(p => p.status === 'entregue');
          console.log('Pedidos entregues (sem review):', entregues.slice(0, 2));
        }
      } catch (error) {
        console.error('Erro ao parsear resposta:', error.message);
        console.log('Dados recebidos:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Erro na requisição:', error.message);
  });

  req.end();
}

testLojistaEndpoint();
