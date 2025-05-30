const http = require('http');

function makeRequest(path, callback) {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: path,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      callback(null, {
        status: res.statusCode,
        headers: res.headers,
        data: data
      });
    });
  });

  req.on('error', (error) => {
    callback(error);
  });

  req.end();
}

console.log('Testando servidor...');

// Teste simples na rota raiz
makeRequest('/', (err, result) => {
  if (err) {
    console.error('Erro:', err.message);
    return;
  }
  
  console.log('Status raiz:', result.status);
  console.log('Servidor está respondendo!');
  
  // Agora testar a API dos pedidos
  makeRequest('/api/lojista/pedidos', (err2, result2) => {
    if (err2) {
      console.error('Erro API:', err2.message);
      return;
    }
    
    console.log('Status API:', result2.status);
    console.log('Resposta API:', result2.data.substring(0, 500));
  });
});
