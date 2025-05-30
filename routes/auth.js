// Rotas de autenticação (login, cadastro, recuperação de senha)
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');
const Joi = require('joi');
const validators = require('../middlewares/validators');

// Configuração do Multer para upload local
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + file.fieldname + ext);
  }
});
const upload = multer({ storage });

// Login com validação
router.post('/login', async (req, res, next) => {
  const { error } = validators.login.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
}, authController.login);

// Cadastro de usuário (cliente ou lojista) com validação
router.post('/register', async (req, res, next) => {
  const { error } = validators.register.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
}, authController.register);

// Rota protegida para buscar perfil do usuário logado
router.get('/me', auth(), authController.me);

// Logout
router.post('/logout', auth(), authController.logout);

// Recuperação de senha
router.post('/forgot-password', authController.forgotPassword);

// Redefinição de senha
router.post('/reset-password/:token', authController.resetPassword);

// Upload de imagem (mock, retorna link local)
router.post('/upload', upload.single('imagem'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado' });
  // Retorna o caminho local ou um link mockado
  res.json({ url: `/uploads/${req.file.filename}` });
});

// Login/cadastro via Firebase
router.post('/firebase-login', authController.firebaseLogin);

module.exports = router;
