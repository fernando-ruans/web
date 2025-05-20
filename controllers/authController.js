const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();
const SECRET = process.env.JWT_SECRET || 'segredo123';

module.exports = {
  // Cadastro de usuário (cliente ou lojista)
  register: async (req, res) => {
    try {
      console.log('DADOS RECEBIDOS NO CADASTRO:', req.body);
      const { nome, email, senha, tipo } = req.body;
      if (!nome || !email || !senha || !['cliente', 'lojista'].includes(tipo)) {
        return res.status(400).json({ error: 'Dados inválidos' });
      }
      const existe = await prisma.user.findUnique({ where: { email } });
      if (existe) return res.status(409).json({ error: 'E-mail já cadastrado' });
      const senha_hash = await bcrypt.hash(senha, 10);
      const user = await prisma.user.create({ data: { nome, email, senha_hash, tipo } });
      return res.status(201).json({ msg: 'Usuário cadastrado', user: { id: user.id, nome: user.nome, email: user.email, tipo: user.tipo } });
    } catch (err) {
      console.error('ERRO NO CADASTRO:', err);
      return res.status(500).json({ error: 'Erro ao cadastrar' });
    }
  },

  // Login
  login: async (req, res) => {
    try {
      console.log('Tentativa de login - body:', req.body);
      const { email, senha } = req.body;

      if (!email || !senha) {
        console.log('Email ou senha não fornecidos');
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      // Busca usuário com senha e status
      console.log('Buscando usuário:', email);
      const user = await prisma.user.findUnique({ 
        where: { email },
        select: {
          id: true,
          nome: true,
          email: true,
          tipo: true,
          senha_hash: true,
          ativo: true
        }
      });

      console.log('Usuário encontrado:', user ? 'Sim' : 'Não');

      // Verificações de segurança
      if (!user) {
        return res.status(401).json({ error: 'E-mail ou senha inválidos' });
      }

      console.log('Verificando senha');
      const senhaValida = await bcrypt.compare(senha, user.senha_hash);
      if (!senhaValida) {
        console.log('Senha inválida');
        return res.status(401).json({ error: 'E-mail ou senha inválidos' });
      }

      // Verifica se o usuário está ativo
      if (user.ativo === false) {
        console.log('Usuário inativo');
        return res.status(403).json({ error: 'Usuário inativo ou bloqueado' });
      }

      console.log('Gerando token');
      // Gera token JWT com informações importantes
      const token = jwt.sign(
        { 
          id: user.id,
          tipo: user.tipo,
          nome: user.nome,
          email: user.email 
        },
        SECRET,
        { expiresIn: '24h' }
      );

      // Remove dados sensíveis antes de enviar
      const { senha_hash, ativo, ...userSemSenha } = user;

      console.log('Definindo cookie');
      // Define cookie seguro
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
        path: '/'
      });

      console.log('Enviando resposta');
      // Retorna apenas os dados do usuário
      return res.json({ user: userSemSenha });

    } catch (err) {
      console.error('Erro detalhado no login:', err);
      return res.status(500).json({ 
        error: 'Erro ao realizar login',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },

  // Logout
  logout: async (req, res) => {
    res.clearCookie('token');
    return res.json({ msg: 'Logout realizado com sucesso' });
  },

  // Recuperação de senha (envia token por e-mail - mock)
  forgotPassword: async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Informe o e-mail' });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.json({ msg: 'Se o e-mail existir, enviaremos instruções.' });
    // Gera token temporário (válido por 1h)
    const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: '1h' });
    // Mock: loga o link no console (substitua por envio real de e-mail)
    console.log(`Link de recuperação: http://localhost:3333/api/auth/reset-password/${token}`);
    return res.json({ msg: 'Se o e-mail existir, enviaremos instruções.' });
  },

  // Redefinição de senha
  resetPassword: async (req, res) => {
    try {
      const { token } = req.params;
      const { senha } = req.body;

      if (!token || !senha) {
        return res.status(400).json({ error: 'Dados inválidos' });
      }

      try {
        const decoded = jwt.verify(token, SECRET);
        const senha_hash = await bcrypt.hash(senha, 10);

        await prisma.user.update({
          where: { id: decoded.id },
          data: { senha_hash }
        });

        return res.json({ msg: 'Senha alterada com sucesso' });
      } catch (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ error: 'Link expirado. Solicite um novo.' });
        }
        if (err.name === 'JsonWebTokenError') {
          return res.status(401).json({ error: 'Link inválido. Solicite um novo.' });
        }
        throw err;
      }
    } catch (err) {
      console.error('Erro ao redefinir senha:', err);
      return res.status(500).json({ error: 'Erro ao redefinir senha' });
    }
  }
};
