require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
app.set('trust proxy', 1); // Corrige warning do express-rate-limit para proxy
const http = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(http, { 
  cors: { 
    origin: process.env.NODE_ENV === 'production' 
      ? 'https://seu-dominio.com'
      : 'http://localhost:3000',
    credentials: true 
  } 
});

// Configurar middleware para disponibilizar io para os controllers
app.set('io', io);

// Gerenciar conexões Socket.IO
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  let userType = null;
  let userId = null;
  
  // Identificar o usuário quando ele se conecta
  socket.on('identify', async (data) => {
    if (data.userId) {
      userId = data.userId;
      socket.join(`user:${userId}`);
      console.log(`Usuário ${userId} identificado no WebSocket`);

      // Verificar tipo do usuário
      try {
        const prisma = require('./prisma/prismaClient');
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { tipo: true }
        });
        
        if (user) {
          userType = user.tipo;
          if (userType === 'lojista') {
            // Buscar restaurante do lojista
            const restaurant = await prisma.restaurant.findFirst({
              where: { userId: userId }
            });
            
            if (restaurant) {
              // Buscar pedidos do restaurante
              const pedidos = await prisma.order.findMany({
                where: { 
                  restaurantId: restaurant.id,
                  status: {
                    in: ['Pendente', 'Confirmado', 'Em Preparo', 'Pronto']
                  }
                },
                include: {
                  user: true,
                  orderItems: {
                    include: {
                      product: true,
                      adicionais: {
                        include: {
                          adicional: true
                        }
                      }
                    }
                  }
                },
                orderBy: {
                  data_criacao: 'desc'
                }
              });
              
              // Enviar pedidos para o lojista
              socket.emit('pedidos', pedidos);
            }
          }
        }
      } catch (err) {
        console.error('Erro ao identificar usuário:', err);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 3333;

const { morgan, errorHandler } = require('./middlewares/logger');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

// Garante que a pasta uploads existe para o Multer
require('./scripts/ensureUploadsDir');

const authRoutes = require('./routes/auth');
const clienteRoutes = require('./routes/cliente');
const lojistaRoutes = require('./routes/lojista');
const adminRoutes = require('./routes/admin');

// Segurança extra
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Logger de requisições
app.use(morgan('dev'));

// CORS restritivo para produção
const corsOptions = process.env.NODE_ENV === 'production'
  ? { origin: 'https://seu-dominio.com', credentials: true }
  : { origin: 'http://localhost:3000', credentials: true };
app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

// Servir arquivos estáticos da pasta uploads
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/cliente', clienteRoutes);
app.use('/api/lojista', lojistaRoutes);
app.use('/api/admin', adminRoutes);

// Rotas de exemplo (substituir pelas reais depois)
app.get('/', (req, res) => res.send('API Deliveryx rodando!'));

// Socket.IO exemplo
io.on('connection', (socket) => {
  console.log('Novo cliente conectado:', socket.id);
  socket.on('disconnect', () => console.log('Cliente desconectado:', socket.id));
});

// Tratamento de erros global
app.use(errorHandler);

http.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
