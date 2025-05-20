const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'segredo123';

module.exports = (tiposPermitidos = []) => (req, res, next) => {
  console.log('\n=== Middleware de Autenticação ===');
  console.log('URL:', req.url);
  console.log('Método:', req.method);
  console.log('Headers:', req.headers);
  console.log('Cookies:', req.cookies);

  let token;

  try {
    // Prioriza o token do cookie
    if (req.cookies && req.cookies.token) {
      console.log('Token encontrado no cookie');
      token = req.cookies.token;
    }
    // Se não encontrou no cookie, tenta o header Authorization
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      console.log('Token encontrado no header Authorization');
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      console.log('Token não encontrado');
      return res.status(401).json({ error: 'Autenticação necessária' });
    }

    try {
      console.log('Verificando token');
      const decoded = jwt.verify(token, SECRET);
      console.log('Token válido para:', decoded.email);
      
      // Verifica se o tipo do usuário tem permissão
      if (tiposPermitidos.length > 0 && !tiposPermitidos.includes(decoded.tipo)) {
        console.log('Acesso negado - tipo não permitido:', decoded.tipo);
        return res.status(403).json({ 
          error: `Acesso negado para usuário do tipo ${decoded.tipo}` 
        });
      }
      
      // Atribui os dados do usuário à requisição
      req.user = decoded;

      // Renova o cookie se o token estiver próximo de expirar
      const agora = Math.floor(Date.now() / 1000);
      const tempoRestante = decoded.exp - agora;
      const dozeHorasEmSegundos = 12 * 60 * 60;

      if (tempoRestante < dozeHorasEmSegundos) {
        console.log('Renovando token');
        const novoToken = jwt.sign(
          { 
            id: decoded.id,
            tipo: decoded.tipo,
            nome: decoded.nome,
            email: decoded.email 
          },
          SECRET,
          { expiresIn: '24h' }
        );

        res.cookie('token', novoToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000,
          path: '/'
        });
      }

      console.log('Autenticação bem-sucedida');
      next();
    } catch (err) {
      console.log('Erro na verificação do token:', err.name);
      res.clearCookie('token');
      
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Sessão expirada, faça login novamente' });
      }
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Token inválido' });
      }
      throw err;
    }
  } catch (err) {
    console.error('Erro na autenticação:', err);
    return res.status(500).json({ 
      error: 'Erro interno na autenticação',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
