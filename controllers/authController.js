const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();
const SECRET = process.env.JWT_SECRET || 'segredo123';
const admin = require('../firebaseAdmin');

module.exports = {
  // Busca perfil do usuário baseado no token
  me: async (req, res) => {
    try {
      console.log('Buscando perfil do usuário:', req.user.id);
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          nome: true,
          email: true,
          tipo: true,
          telefone: true,
          endereco: true,
          avatarUrl: true,
          ativo: true,
          addresses: true // Incluindo os endereços do usuário
        }
      });

      if (!user) {
        console.log('Usuário não encontrado');
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      if (!user.ativo) {
        console.log('Usuário inativo');
        return res.status(403).json({ error: 'Usuário inativo' });
      }

      console.log('Perfil encontrado:', { ...user, ativo: undefined });

      // Remove campo sensível e garante que nenhum campo seja undefined
      const userSemSenha = {
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipo: user.tipo,
        telefone: user.telefone || null,
        endereco: user.endereco || null,
        avatarUrl: user.avatarUrl || null,
        addresses: user.addresses // Incluindo os endereços na resposta
      };

      res.json({ user: userSemSenha });
    } catch (err) {
      console.error('Erro ao buscar perfil:', err);
      res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
  },

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
          ativo: true,
          telefone: true,
          endereco: true,
          avatarUrl: true,
          addresses: true
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
        path: '/',
        domain: undefined // Permite que o cookie funcione em localhost
      });

      console.log('Enviando resposta');
      // Retorna os dados do usuário garantindo que nenhum campo seja undefined
      return res.json({ 
        user: {
          ...userSemSenha,
          telefone: userSemSenha.telefone || null,
          endereco: userSemSenha.endereco || null,
          avatarUrl: userSemSenha.avatarUrl || null,
          addresses: userSemSenha.addresses || []
        },
        token // <-- Adiciona o token JWT na resposta
      });

    } catch (err) {
      console.error('Erro detalhado no login:', err);
      return res.status(500).json({ 
        error: 'Erro ao realizar login',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },

  // Login/cadastro via Firebase
  firebaseLogin: async (req, res) => {
    try {
      const { idToken, nome: nomeBody } = req.body;
      if (!idToken) return res.status(400).json({ error: 'Token não fornecido' });
      // Verifica o token do Firebase
      const decoded = await admin.auth().verifyIdToken(idToken);
      const { email, name, picture, uid } = decoded;
      if (!email) return res.status(400).json({ error: 'E-mail não encontrado no token' });
      // Busca ou cria usuário na base
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            nome: nomeBody || name || email.split('@')[0], // Prioriza nome do frontend
            email,
            avatarUrl: picture || null,
            tipo: 'cliente', // padrão
            firebaseUid: uid
          }
        });
      } else if (!user.firebaseUid) {
        // Atualiza firebaseUid se não existir
        await prisma.user.update({ where: { id: user.id }, data: { firebaseUid: uid } });
      }
      // Gera JWT próprio
      const token = jwt.sign({ id: user.id, tipo: user.tipo, nome: user.nome, email: user.email }, SECRET, { expiresIn: '24h' });
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
        domain: undefined
      });
      res.json({ user, token });
    } catch (err) {
      console.error('Erro no firebase-login:', err);
      res.status(500).json({ error: 'Erro ao autenticar com Firebase', details: err.message });
    }
  },

  // Logout
  logout: async (req, res) => {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      domain: undefined
    });
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
