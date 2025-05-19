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
      const { email, senha } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return res.status(401).json({ error: 'Usuário ou senha inválidos' });
      const ok = await bcrypt.compare(senha, user.senha_hash);
      if (!ok) return res.status(401).json({ error: 'Usuário ou senha inválidos' });
      const token = jwt.sign({ id: user.id, tipo: user.tipo, nome: user.nome, email: user.email }, SECRET, { expiresIn: '7d' });
      res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'lax', // use 'none' e secure: true se for HTTPS/domínios diferentes
        secure: false // true se for HTTPS
      });
      return res.json({ token, user: { id: user.id, nome: user.nome, email: user.email, tipo: user.tipo } });
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao fazer login' });
    }
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

  // Endpoint para redefinir senha
  resetPassword: async (req, res) => {
    const { token } = req.params;
    const { senha } = req.body;
    if (!senha || senha.length < 6) return res.status(400).json({ error: 'Senha inválida' });
    try {
      const decoded = jwt.verify(token, SECRET);
      const senha_hash = await bcrypt.hash(senha, 10);
      await prisma.user.update({ where: { id: decoded.id }, data: { senha_hash } });
      return res.json({ msg: 'Senha redefinida com sucesso!' });
    } catch (err) {
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }
  },
};
