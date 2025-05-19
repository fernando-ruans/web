// Middleware de autenticação JWT e autorização por perfil
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'segredo123';

// Perfis possíveis: ['cliente', 'lojista', 'admin']
module.exports = (tiposPermitidos = []) => (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const [, headerToken] = authHeader.split(' ');
    token = headerToken;
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  try {
    const decoded = jwt.verify(token, SECRET);
    if (!tiposPermitidos.includes(decoded.tipo)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};
