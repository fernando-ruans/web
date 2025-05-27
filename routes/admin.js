// Rotas do administrador
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middlewares/auth');

router.use(auth(['admin']));

router.get('/users', adminController.listUsers);
router.delete('/users/:id', adminController.deleteUser);
router.put('/users/:id/promote', adminController.promoteUser);
router.get('/restaurants', adminController.listRestaurants);
router.post('/restaurants', adminController.createRestaurant);
router.put('/restaurants/:id/approve', adminController.approveRestaurant);
router.put('/restaurants/:id', adminController.updateRestaurant);
router.post('/restaurants/delegate', adminController.delegateLojista);
router.delete('/restaurants/:id', adminController.deleteRestaurant);
router.get('/reviews', adminController.listReviews);
router.delete('/reviews/:id', adminController.deleteReview);
router.get('/profile', adminController.getProfile);
router.get('/addresses', adminController.listAddresses); 
router.post('/addresses', adminController.createAddress);
router.put('/addresses/:id', adminController.updateAddress);
router.delete('/addresses/:id', adminController.deleteAddress);
router.put('/profile', adminController.updateProfile);
router.get('/relatorios/resumo', adminController.relatorioResumo);
router.get('/relatorios/pdf', adminController.gerarRelatorioPDF);
router.get('/relatorios/restaurante/:id', adminController.relatorioRestauranteAdmin);
// Listar todos os pedidos do sistema (admin)
router.get('/orders', adminController.listAllOrders);

module.exports = router;
