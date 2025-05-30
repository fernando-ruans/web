const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('Testando API lojista/pedidos...');
    
    // Primeiro teste: listar pedidos sem autenticação (só para ver se responde)
    const response = await fetch('http://localhost:3000/api/lojista/pedidos', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers));
    
    const data = await response.text();
    console.log('Resposta:', data);
    
  } catch (error) {
    console.error('Erro na requisição:', error.message);
  }
}

testAPI();
