require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
app.set('trust proxy', 1); // Corrige warning do express-rate-limit para proxy
const http = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(http, { cors: { origin: '*' } });
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
