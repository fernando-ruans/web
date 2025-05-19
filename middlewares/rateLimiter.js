const rateLimit = require('express-rate-limit');

// Configurações padrão por tipo de usuário
const LIMITES_POR_USUARIO = {
  admin: { windowMs: 60000, max: 60 },    // 60 req/min para admins
  lojista: { windowMs: 60000, max: 40 },  // 40 req/min para lojistas
  cliente: { windowMs: 60000, max: 30 },  // 30 req/min para clientes
  default: { windowMs: 60000, max: 20 }   // 20 req/min para não autenticados
};

// Rotas que devem ignorar o rate limit
const ROTAS_IGNORADAS = [
  '/auth/login',
  '/auth/register',
  '/public'
];

// Criar um mapa para armazenar limitadores por rota e tipo de usuário
const limiters = new Map();

// Função para gerar chave única do limitador
const getLimiterKey = (route, userType) => `${route}-${userType || 'default'}`;

// Função para criar um limitador específico
const createLimiter = (windowMs = 60000, max = 30) => {
  return rateLimit({
    windowMs,
    max,
    message: { 
      error: 'Muitas requisições. Por favor, aguarde um momento.',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => {
      // Gera uma chave única baseada no IP + rota + tipo de usuário
      const userType = req.user?.tipo || 'default';
      return `${req.ip}-${req.baseUrl || req.path}-${userType}`;
    },
    skip: (req) => {
      // Ignora certas rotas e requisições bem-sucedidas
      return ROTAS_IGNORADAS.some(rota => (req.baseUrl || req.path).startsWith(rota));
    }
  });
};

// Middleware que aplica rate limiting baseado na rota e tipo de usuário
const rateLimiter = (customWindowMs, customMax) => {
  return (req, res, next) => {
    const route = req.baseUrl || req.path;
    const userType = req.user?.tipo || 'default';
    const limiterKey = getLimiterKey(route, userType);
    
    if (!limiters.has(limiterKey)) {
      // Usa configurações customizadas ou padrões baseados no tipo de usuário
      const config = LIMITES_POR_USUARIO[userType] || LIMITES_POR_USUARIO.default;
      const windowMs = customWindowMs || config.windowMs;
      const max = customMax || config.max;
      
      limiters.set(limiterKey, createLimiter(windowMs, max));
    }
    
    return limiters.get(limiterKey)(req, res, next);
  };
};

module.exports = rateLimiter;
