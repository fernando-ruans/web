require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const http = require('http');
const path = require('path');

// Rotas
const authRoutes = require('./routes/auth');
const clienteRoutes = require('./routes/cliente');
const lojistaRoutes = require('./routes/lojista');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);

// Configuração do CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

// Configuração do WebSocket
const wss = new WebSocket.Server({ server });

// Mapear clientes conectados
const clients = new Map();

wss.on('connection', (ws, req) => {
  console.log('Nova conexão WebSocket');
  
  // Extrair token da URL
  const url = new URL(req.url, 'ws://localhost');
  const token = url.searchParams.get('token');
  
  if (!token) {
    console.log('Token não fornecido');
    ws.close();
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'segredo123');
    const userId = decoded.id;
    
    // Armazenar a conexão
    clients.set(userId, ws);
    
    ws.on('message', async (message) => {
      try {
        const { type, data } = JSON.parse(message);
        console.log('Mensagem recebida:', type, data);
        
        if (type === 'identify') {
          // Verificar tipo do usuário
          const prisma = require('./prisma/prismaClient');
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { tipo: true }
          });
          
          if (user && user.tipo === 'lojista') {
            // Buscar restaurante do lojista
            const restaurant = await prisma.restaurant.findFirst({
              where: { userId: userId }
            });
            
            if (restaurant) {
              // Buscar pedidos ativos
              const pedidos = await prisma.order.findMany({
                where: { 
                  restaurantId: restaurant.id,
                  status: {
                    in: ['Pendente', 'Confirmado', 'Em Preparo', 'Pronto']
                  }
                },
                include: {
                  orderItems: {
                    include: {
                      product: true,
                      adicionais: {
                        include: {
                          adicional: true
                        }
                      }
                    }
                  },
                  user: {
                    select: {
                      nome: true,
                      telefone: true
                    }
                  },
                  address: true
                }
              });
              
              ws.send(JSON.stringify({
                type: 'pedidos',
                data: pedidos
              }));
            }
          }
        }
      } catch (err) {
        console.error('Erro ao processar mensagem:', err);
      }
    });
    
    ws.on('close', () => {
      clients.delete(userId);
      console.log('Cliente desconectado:', userId);
    });
    
  } catch (err) {
    console.error('Erro na autenticação do WebSocket:', err);
    ws.close();
  }
});

// Função para enviar atualizações via WebSocket
const sendWebSocketUpdate = (userId, type, data) => {
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify({ type, data }));
  }
};

// Disponibilizar a função sendWebSocketUpdate para outros módulos
app.set('sendWebSocketUpdate', sendWebSocketUpdate);

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/cliente', clienteRoutes);
app.use('/api/lojista', lojistaRoutes);
app.use('/api/admin', adminRoutes);

// Erro 404 para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Handler global de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3333;

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
