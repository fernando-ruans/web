const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'segredo123';

// Perfis possíveis: ['cliente', 'lojista', 'admin']
module.exports = (tiposPermitidos = []) => (req, res, next) => {
  console.log('Iniciando autenticação');
  let token;

  try {
    // Tenta extrair o token do header Authorization
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        console.error('Formato de header Authorization inválido');
        return res.status(401).json({ error: 'Formato de token inválido' });
      }
      token = parts[1];
    } 
    // Tenta extrair o token dos cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      console.error('Token não fornecido');
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    console.log('Token recebido:', token);
    const decoded = jwt.verify(token, SECRET);
    console.log('Token decodificado:', { ...decoded, secret: undefined });
    
    // Validações do token decodificado
    if (!decoded.id) {
      console.error('Token sem ID de usuário');
      return res.status(401).json({ error: 'Token inválido: ID de usuário não especificado' });
    }

    if (!decoded.tipo) {
      console.error('Token sem tipo de usuário');
      return res.status(401).json({ error: 'Token inválido: tipo de usuário não especificado' });
    }
    
    // Valida o tipo de usuário se houver restrição
    if (tiposPermitidos.length > 0 && !tiposPermitidos.includes(decoded.tipo)) {
      console.error(`Acesso negado: usuário tipo ${decoded.tipo}, permitidos:`, tiposPermitidos);
      return res.status(403).json({ error: `Acesso negado para usuário do tipo ${decoded.tipo}` });
    }
    
    // Atribui os dados do usuário à requisição
    req.user = {
      id: decoded.id,
      tipo: decoded.tipo,
      nome: decoded.nome,
      email: decoded.email
    };

    next();
  } catch (err) {
    console.error('Erro na autenticação:', err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    return res.status(500).json({ error: 'Erro na autenticação: ' + err.message });
  }
};
