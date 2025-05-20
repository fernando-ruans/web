// Rotas do cliente (usuário comum)
const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const auth = require('../middlewares/auth');
const rateLimiter = require('../middlewares/rateLimiter');
const Joi = require('joi');

// Aplicar rate limiter em todas as rotas do cliente - usando configuração padrão por tipo de usuário
router.use(rateLimiter());

// Remover o uso global do auth apenas para cliente
// router.use(auth(['cliente']));

// Exemplo de rotas
router.get('/profile', auth(['cliente']), clienteController.getProfile);

const updateProfileSchema = Joi.object({
  nome: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  avatarUrl: Joi.string().optional(),
  telefone: Joi.string().optional(),
  rua: Joi.string().optional(),
  numero: Joi.string().optional(),
  complemento: Joi.string().optional(),
  bairro: Joi.string().optional(),
  cidade: Joi.string().optional(),
  estado: Joi.string().optional(),
  cep: Joi.string().optional(),
  senha: Joi.string().min(6).optional(),
  endereco: Joi.string().optional(),
});

router.put('/profile', auth(['cliente']), async (req, res, next) => {
  const { error } = updateProfileSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
}, clienteController.updateProfile);

const orderSchema = Joi.object({
  restaurantId: Joi.number().required(),
  addressId: Joi.number().required(),
  observacao: Joi.string().allow('', null).optional(),
  items: Joi.array().items(
    Joi.object({
      productId: Joi.number().required(),
      quantidade: Joi.number().min(1).required(),
      preco_unitario: Joi.number().optional(),
      adicionais: Joi.array().items(
        Joi.object({
          adicionalId: Joi.number().required(),
          quantidade: Joi.number().min(1).required(),
          preco: Joi.number().required()
        })
      ).optional()
    })
  ).min(1).required()
});

const reviewSchema = Joi.object({
  orderId: Joi.number().required(),
  nota: Joi.number().min(1).max(5).required(),
  comentario: Joi.string().min(3).required()
});

// Validação para endereços
const addressSchema = Joi.object({
  rua: Joi.string().required(),
  numero: Joi.string().required(),
  bairro: Joi.string().required(),
  cidade: Joi.string().required(),
  complemento: Joi.string().allow('', null),
  cep: Joi.string().required()
});

router.post('/orders', auth(['cliente']), async (req, res, next) => {
  const { error } = orderSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
}, clienteController.createOrder);

router.post('/reviews', auth(['cliente']), async (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
}, clienteController.createReview);

// Rotas de endereços
router.get('/addresses', auth(['cliente']), clienteController.listAddresses);
router.post('/addresses', auth(['cliente']), async (req, res, next) => {
  const { error } = addressSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
}, clienteController.createAddress);
router.put('/addresses/:id', auth(['cliente']), async (req, res, next) => {
  const { error } = addressSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
}, clienteController.updateAddress);
router.delete('/addresses/:id', auth(['cliente']), clienteController.deleteAddress);

// Rota de listagem de restaurantes acessível para todos (sem autenticação)
router.get('/restaurants', clienteController.listRestaurants);
// Rota de detalhes do restaurante (cardápio) acessível para todos (sem autenticação)
router.get('/restaurants/:id', clienteController.getRestaurant);
// Rota para buscar cardápio do restaurante (produtos por categoria)
router.get('/restaurants/:id/menu', clienteController.getRestaurantMenu);
router.get('/orders', auth(['cliente']), clienteController.listOrders);
router.get('/orders/:id', auth(['cliente']), clienteController.getOrder);

module.exports = router;
