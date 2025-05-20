const prisma = require('../prisma/prismaClient');
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'segredo123';

module.exports = {
  listUsers: async (req, res) => {
    try {
      const users = await prisma.user.findMany({ select: { id: true, nome: true, email: true, tipo: true, avatarUrl: true } });
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao listar usuários' });
    }
  },
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.user.delete({ where: { id: Number(id) } });
      res.json({ msg: 'Usuário excluído!' });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao excluir usuário' });
    }
  },
  listRestaurants: async (req, res) => {
    try {
      const restaurantes = await prisma.restaurant.findMany({
        orderBy: { id: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          }
        }
      });
      res.json(restaurantes);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao listar restaurantes' });
    }
  },
  createRestaurant: async (req, res) => {
    try {
      const { nome, cep, telefone, endereco, taxa_entrega, tempo_entrega, imagem, banner } = req.body;
      if (!nome || !endereco || !taxa_entrega || !tempo_entrega) {
        return res.status(400).json({ error: 'Dados obrigatórios faltando' });
      }
      const restaurante = await prisma.restaurant.create({
        data: {
          userId: req.user.id,
          nome,
          cep,
          telefone,
          endereco,
          taxa_entrega: Number(taxa_entrega),
          tempo_entrega: Number(tempo_entrega),
          status: 'aprovado',
          imagem: imagem || '',
          banner: banner || '/banner-default.png'
        }
      });
      res.status(201).json(restaurante);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao cadastrar restaurante' });
    }
  },
  approveRestaurant: async (req, res) => {
    try {
      const { id } = req.params;
      const restaurante = await prisma.restaurant.update({ where: { id: Number(id) }, data: { status: 'aprovado' } });
      res.json(restaurante);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao aprovar restaurante' });
    }
  },
  deleteRestaurant: async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.restaurant.delete({ where: { id: Number(id) } });
      res.json({ msg: 'Restaurante excluído!' });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao excluir restaurante' });
    }
  },
  updateRestaurant: async (req, res) => {
    try {
      const { id } = req.params;
      const { nome, cep, telefone, endereco, taxa_entrega, tempo_entrega, imagem, banner } = req.body;
      
      const restaurante = await prisma.restaurant.update({
        where: { id: Number(id) },
        data: {
          nome,
          cep,
          telefone,
          endereco,
          taxa_entrega: Number(taxa_entrega),
          tempo_entrega: Number(tempo_entrega),
          ...(imagem && { imagem }),
          ...(banner && { banner })
        }
      });
      res.json(restaurante);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao atualizar restaurante' });
    }
  },
  delegateLojista: async (req, res) => {
    try {
      const { restauranteId, lojistaId } = req.body;
      if (!restauranteId || !lojistaId) {
        return res.status(400).json({ error: 'Restaurante e lojista obrigatórios' });
      }
      // Confirma se o usuário é lojista
      const lojista = await prisma.user.findUnique({ where: { id: Number(lojistaId) } });
      if (!lojista || lojista.tipo !== 'lojista') {
        return res.status(400).json({ error: 'Usuário não é um lojista válido' });
      }
      // Atualiza o restaurante
      const restaurante = await prisma.restaurant.update({
        where: { id: Number(restauranteId) },
        data: { userId: Number(lojistaId) }
      });
      res.json({ msg: 'Lojista delegado com sucesso!', restaurante });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao delegar lojista' });
    }
  },
  listReviews: async (req, res) => {
    try {
      const { page = 1, limit = 10, orderBy = 'id', order = 'desc', notaMin, notaMax, restauranteId } = req.query;
      const where = {
        ...(restauranteId && { restaurantId: Number(restauranteId) }),
        ...(notaMin && { nota: { gte: Number(notaMin) } }),
        ...(notaMax && { nota: { lte: Number(notaMax) } })
      };
      const total = await prisma.review.count({ where });
      const reviews = await prisma.review.findMany({
        where,
        include: { order: true, restaurant: true },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { [orderBy]: order }
      });
      res.json({ total, page: Number(page), limit: Number(limit), data: reviews });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao listar avaliações' });
    }
  },
  deleteReview: async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.review.delete({ where: { id: Number(id) } });
      res.json({ msg: 'Avaliação excluída!' });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao excluir avaliação' });
    }
  },
  getProfile: async (req, res) => {
    try {
      const admin = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          nome: true,
          email: true,
          tipo: true,
          telefone: true,
          endereco: true,
          avatarUrl: true
        }
      });
      res.json(admin);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao buscar perfil do admin' });
    }
  },
  updateProfile: async (req, res) => {
    try {
      console.log('Dados recebidos:', req.body);
      const { nome, email, telefone, endereco, avatarUrl } = req.body;
      const userId = Number(req.user.id);

      // Valida se há dados para atualizar
      if (!nome && !email && !telefone && !endereco && !avatarUrl) {
        return res.status(400).json({ error: 'Nenhum dado fornecido para atualização' });
      }

      // Valida o email se fornecido
      if (email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            email,
            id: { not: userId }
          }
        });
        
        if (existingUser) {
          return res.status(400).json({ error: 'Este e-mail já está em uso' });
        }
      }

      // Prepara os dados para atualização, tratando campos vazios corretamente
      const updateData = {
        ...(nome?.trim() && { nome: nome.trim() }),
        ...(email?.trim() && { email: email.trim() }),
        ...(telefone?.trim() && { telefone: telefone.trim() }),
        ...(endereco?.trim() && { endereco: endereco.trim() }),
        ...(avatarUrl?.trim() && { avatarUrl: avatarUrl.trim() })
      };

      console.log('Dados para atualização:', updateData);

      // Atualiza o perfil
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          nome: true,
          email: true,
          tipo: true,
          telefone: true,
          endereco: true,
          avatarUrl: true,
          ativo: true
        }
      });

      console.log('Usuário atualizado:', { ...updatedUser, ativo: undefined });

      // Gera um novo token com os dados atualizados
      const token = jwt.sign(
        { 
          id: updatedUser.id,
          tipo: updatedUser.tipo,
          nome: updatedUser.nome,
          email: updatedUser.email 
        },
        SECRET,
        { expiresIn: '24h' }
      );

      // Atualiza o cookie com o novo token
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
        path: '/'
      });

      // Prepara o objeto de resposta garantindo que nenhum campo seja undefined
      const adminData = {
        id: updatedUser.id,
        nome: updatedUser.nome,
        email: updatedUser.email,
        tipo: updatedUser.tipo,
        telefone: updatedUser.telefone || null,
        endereco: updatedUser.endereco || null,
        avatarUrl: updatedUser.avatarUrl || null
      };

      res.json({ 
        msg: 'Perfil atualizado com sucesso', 
        user: adminData
      });
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      
      if (err.code === 'P2002') {
        return res.status(400).json({ error: 'Este e-mail já está em uso' });
      } else if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      
      res.status(500).json({ 
        error: 'Erro ao atualizar perfil do admin',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },
  promoteUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { tipo } = req.body; // tipo esperado: 'admin', 'lojista', 'cliente'
      if (!['admin', 'lojista', 'cliente'].includes(tipo)) {
        return res.status(400).json({ error: 'Tipo de usuário inválido' });
      }
      const user = await prisma.user.update({
        where: { id: Number(id) },
        data: { tipo },
      });
      res.json({ msg: 'Usuário promovido com sucesso', user });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao promover usuário' });
    }
  },
  relatorioResumo: async (req, res) => {
    try {
      // Total de vendas = pedidos com status 'Entregue'
      const totalVendas = await prisma.order.count({ where: { status: 'Entregue' } });
      // Total de pedidos (entregues)
      const totalPedidos = totalVendas;
      // Total de restaurantes
      const totalRestaurantes = await prisma.restaurant.count();
      // Total de clientes
      const totalClientes = await prisma.user.count({ where: { tipo: 'cliente' } });
      // Faturamento (soma dos pedidos entregues)
      const faturamentoObj = await prisma.order.aggregate({
        _sum: { total: true },
        where: { status: 'Entregue' }
      });
      const faturamento = faturamentoObj._sum.total || 0;
      // Ticket médio
      const ticketMedio = totalVendas > 0 ? faturamento / totalVendas : 0;
      // Pedidos cancelados
      const pedidosCancelados = await prisma.order.count({ where: { status: 'Cancelado' } });
      // Novos clientes no mês atual
      const now = new Date();
      const primeiroDiaMes = new Date(now.getFullYear(), now.getMonth(), 1);
      const novosClientesMes = await prisma.user.count({
        where: {
          tipo: 'cliente',
          createdAt: { gte: primeiroDiaMes }
        }
      });
      // Restaurante com maior faturamento
      const topRestaurante = await prisma.order.groupBy({
        by: ['restaurantId'],
        where: { status: 'Entregue' },
        _sum: { total: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 1
      });
      let restauranteTop = null;
      if (topRestaurante.length > 0) {
        const restaurante = await prisma.restaurant.findUnique({
          where: { id: topRestaurante[0].restaurantId },
          select: { id: true, nome: true }
        });
        restauranteTop = {
          id: restaurante.id,
          nome: restaurante.nome,
          faturamento: topRestaurante[0]._sum.total || 0
        };
      }
      res.json({
        totalVendas,
        totalPedidos,
        totalRestaurantes,
        totalClientes,
        faturamento,
        ticketMedio,
        pedidosCancelados,
        novosClientesMes,
        restauranteTop
      });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao gerar relatório geral' });
    }
  },
};
