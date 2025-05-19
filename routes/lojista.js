// Rotas do lojista (dono de restaurante)
const express = require('express');
const router = express.Router();
const lojistaController = require('../controllers/lojistaController');
const auth = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');

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

router.use(auth(['lojista']));

router.get('/profile', lojistaController.getProfile);
router.put('/profile', lojistaController.updateProfile);
router.post('/restaurants', lojistaController.createRestaurant);
router.get('/restaurants', lojistaController.listRestaurants);
router.put('/restaurants/:id', lojistaController.updateRestaurant);
router.delete('/restaurants/:id', lojistaController.deleteRestaurant);
router.put('/restaurants/:id/toggle-open', lojistaController.toggleRestaurantOpen); // Nova rota para abrir/fechar restaurante
router.get('/orders', lojistaController.listOrders);
router.put('/orders/:id/status', lojistaController.updateOrderStatus);
router.get('/reviews', lojistaController.listReviews);
router.get('/relatorios/:id', lojistaController.getRelatorioRestaurante); // Nova rota para relatórios do restaurante

// Rota para dados de demonstração de relatórios (fallback)
router.get('/relatorios-demo/:id', (req, res) => {
  const { id } = req.params;
  const relatorioDemonstracao = {
    faturamentoTotal: 8750.50,
    totalVendas: 120,
    mediaAvaliacao: 4.7,
    pedidosCancelados: 5,
    ticketMedio: 72.92,
    clientesNovos: 18,
    pedidosUltimos7Dias: [8, 12, 15, 10, 20, 22, 18],
    faturamentoPorCategoria: [
      { categoria: 'Hambúrgueres', valor: 3200.00 },
      { categoria: 'Pizzas', valor: 2500.00 },
      { categoria: 'Bebidas', valor: 1500.50 },
      { categoria: 'Sobremesas', valor: 950.00 },
      { categoria: 'Outros', valor: 600.00 }
    ],
    produtosMaisVendidos: [
      { nome: 'X-Tudo', quantidade: 48 },
      { nome: 'Pizza de Calabresa', quantidade: 32 },
      { nome: 'Coca-Cola 2L', quantidade: 45 },
      { nome: 'Batata Frita Grande', quantidade: 37 },
      { nome: 'Sorvete de Chocolate', quantidade: 25 }
    ],
    diasMaisMovimentados: [
      { dia: 'Sábado', pedidos: 35 },
      { dia: 'Sexta', pedidos: 28 },
      { dia: 'Domingo', pedidos: 25 },
      { dia: 'Quinta', pedidos: 15 },
      { dia: 'Quarta', pedidos: 12 },
      { dia: 'Terça', pedidos: 10 },
      { dia: 'Segunda', pedidos: 8 }
    ]
  };
  
  res.json(relatorioDemonstracao);
});

// Upload de imagem para restaurante
router.post('/restaurants/:id/imagem', upload.single('imagem'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado' });
  // Atualiza o campo imagem do restaurante
  const prisma = require('../prisma/prismaClient');
  const { id } = req.params;
  const restaurante = await prisma.restaurant.update({
    where: { id: Number(id), userId: req.user.id },
    data: { imagem: `/uploads/${req.file.filename}` }
  });
  res.json({ url: `/uploads/${req.file.filename}`, restaurante });
});

// Upload de imagem para produto
router.post('/products/:id/imagem', upload.single('imagem'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado' });
  // Atualiza o campo imagem do produto
  const prisma = require('../prisma/prismaClient');
  const { id } = req.params;
  const produto = await prisma.product.update({
    where: { id: Number(id) },
    data: { imagem: `/uploads/${req.file.filename}` }
  });
  res.json({ url: `/uploads/${req.file.filename}`, produto });
});

// CRUD de produtos e categorias
router.get('/products', lojistaController.listProducts);
router.post('/categories', lojistaController.createCategory);
router.put('/categories/:id', lojistaController.updateCategory);
router.delete('/categories/:id', lojistaController.deleteCategory);
router.post('/products', lojistaController.createProduct);
router.put('/products/:id', lojistaController.updateProduct);
router.delete('/products/:id', lojistaController.deleteProduct);

// Lista todas as categorias dos restaurantes do lojista autenticado
router.get('/categories', async (req, res) => {
  try {
    const prisma = require('../prisma/prismaClient');
    // Busca todos os restaurantes do lojista
    const restaurantes = await prisma.restaurant.findMany({
      where: { userId: req.user.id },
      select: { id: true }
    });
    const restaurantesIds = restaurantes.map(r => r.id);
    // Busca todas as categorias desses restaurantes
    const categorias = await prisma.category.findMany({
      where: { restaurantId: { in: restaurantesIds } },
      select: { id: true, nome: true, restaurantId: true }
    });
    res.json(categorias);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar categorias' });
  }
});

module.exports = router;
