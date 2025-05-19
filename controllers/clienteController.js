// Exemplo de controller do cliente
module.exports = {
  getProfile: async (req, res) => {
    try {
      const prisma = require('../prisma/prismaClient');
      const cliente = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          nome: true,
          email: true,
          tipo: true,
          telefone: true,
          cpf: true,
          endereco: true,
          avatarUrl: true
        }
      });
      res.json(cliente);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
  },
  updateProfile: async (req, res) => {
    try {
      const prisma = require('../prisma/prismaClient');
      const { nome, avatarUrl, telefone, cpf, endereco } = req.body;
      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          ...(nome && { nome }),
          ...(avatarUrl && { avatarUrl }),
          ...(telefone && { telefone }),
          ...(cpf && { cpf }),
          ...(endereco && { endereco })
        }
      });
      // Retorne o perfil atualizado no mesmo formato do getProfile
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          nome: true,
          email: true,
          tipo: true,
          avatarUrl: true,
          telefone: true,
          cpf: true,
          endereco: true,
          addresses: true
        }
      });
      res.json({ msg: 'Perfil atualizado!', user });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }
  },
  listRestaurants: async (req, res) => {
    try {
      const prisma = require('../prisma/prismaClient');
      const { endereco, categoria, nome, precoMin, precoMax, page = 1, limit = 10, orderBy = 'nome', order = 'asc' } = req.query;

      // Construir where clause dinamicamente
      const where = {
        status: 'aprovado', // Apenas restaurantes aprovados
        AND: []
      };

      // Adicionar filtros condicionalmente
      if (nome) {
        where.AND.push({ nome: { contains: nome, mode: 'insensitive' } });
      }

      if (endereco) {
        where.AND.push({ endereco: { contains: endereco, mode: 'insensitive' } });
      }

      if (categoria) {
        where.AND.push({
          categories: {
            some: {
              nome: { contains: categoria, mode: 'insensitive' }
            }
          }
        });
      }

      // Remove AND vazio
      if (where.AND.length === 0) {
        delete where.AND;
      }

      // Buscar restaurantes com paginação
      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);      const [total, restaurants] = await prisma.$transaction([
        prisma.restaurant.count({ 
          where: {
            ...where,
            status: "aprovado"
          }
        }),
        prisma.restaurant.findMany({
          where: {
            ...where,
            status: "aprovado"
          },
          skip,
          take,
          orderBy: { [orderBy]: order },
          include: {
            categories: {
              include: {
                products: {
                  select: {
                    preco: true,
                    id: true,
                    nome: true,
                    imagem: true
                  }
                }
              }
            },
            reviews: {
              select: {
                nota: true
              }
            }
          }
        })
      ]);      // Calcular médias e informações adicionais
      const restaurantsWithStats = restaurants.map(restaurant => {
        // Obter todos os produtos de todas as categorias
        const allProducts = restaurant.categories.flatMap(cat => cat.products || []);
        
        const mediaPreco = allProducts.length > 0
          ? allProducts.reduce((acc, prod) => acc + prod.preco, 0) / allProducts.length
          : 0;

        const mediaAvaliacao = restaurant.reviews?.length > 0
          ? restaurant.reviews.reduce((acc, rev) => acc + rev.nota, 0) / restaurant.reviews.length
          : 0;

        const { products, reviews, ...restRestaurant } = restaurant;

        return {
          ...restRestaurant,
          mediaPreco: Number(mediaPreco.toFixed(2)),
          mediaAvaliacao: Number(mediaAvaliacao.toFixed(1)),
          totalAvaliacoes: reviews.length
        };
      });

      // Filtrar por preço após calcular a média
      let filteredRestaurants = restaurantsWithStats;
      if (precoMin || precoMax) {
        filteredRestaurants = restaurantsWithStats.filter(rest => {
          const price = rest.mediaPreco;
          if (precoMin && precoMax) {
            return price >= Number(precoMin) && price <= Number(precoMax);
          }
          if (precoMin) {
            return price >= Number(precoMin);
          }
          if (precoMax) {
            return price <= Number(precoMax);
          }
          return true;
        });
      }

      res.json({
        total,
        page: Number(page),
        limit: Number(limit),
        data: filteredRestaurants
      });

    } catch (err) {
      console.error('Erro ao listar restaurantes:', err);
      res.status(500).json({ error: 'Erro ao listar restaurantes: ' + err.message });
    }
  },
  getRestaurant: async (req, res) => {
    try {
      const prisma = require('../prisma/prismaClient');
      const { id } = req.params;
      
      const restaurante = await prisma.restaurant.findUnique({
        where: { id: Number(id) }
      });

      if (!restaurante) {
        return res.status(404).json({ error: 'Restaurante não encontrado' });
      }

      // Extrair cidade do endereço se não estiver preenchida
      const cidade = restaurante.endereco?.split(',').slice(-2)[0]?.trim() || '';
      
      // Enviar apenas os campos necessários
      res.json({
        id: restaurante.id,
        nome: restaurante.nome,
        endereco: restaurante.endereco,
        cidade: cidade,
        telefone: restaurante.telefone,
        banner: restaurante.banner,
        imagem: restaurante.imagem,
        taxa_entrega: restaurante.taxa_entrega || 0,
        tempo_entrega: restaurante.tempo_entrega,
        aberto: restaurante.aberto
      });
    } catch (err) {
      console.error('Erro ao buscar restaurante:', err);
      res.status(500).json({ error: 'Erro ao buscar restaurante' });
    }
  },

  getRestaurantMenu: async (req, res) => {
    try {
      const prisma = require('../prisma/prismaClient');
      const { id } = req.params;

      // Busca o restaurante com suas categorias e produtos, incluindo adicionais
      const restaurante = await prisma.restaurant.findUnique({
        where: { id: Number(id) },
        include: {
          categories: {
            include: {
              products: {
                where: { ativo: true },
                orderBy: { nome: 'asc' },
                include: { adicionais: true }
              }
            }
          }
        }
      });

      if (!restaurante) {
        return res.status(404).json({ error: 'Restaurante não encontrado' });
      }
      
      // Organiza o cardápio por categorias
      const cardapio = restaurante.categories.map(cat => ({
        id: cat.id,
        nome: cat.nome,
        produtos: cat.products
      }));      res.json({ 
        data: cardapio, 
        restaurant: {
          id: restaurante.id,
          nome: restaurante.nome,
          cidade: restaurante.endereco?.split(',').slice(-2)[0]?.trim() || '',
          taxa_entrega: restaurante.taxa_entrega,
          tempo_entrega: restaurante.tempo_entrega,
          telefone: restaurante.telefone,
          endereco: restaurante.endereco,
          cep: restaurante.cep,
          aberto: restaurante.aberto,
          banner: restaurante.banner,
          imagem: restaurante.imagem
        } 
      });
    } catch (err) {
      console.error('Erro ao buscar cardápio:', err);
      res.status(500).json({ error: 'Erro ao buscar cardápio' });
    }
  },  createOrder: async (req, res) => {
    try {
      const prisma = require('../prisma/prismaClient');
      const { restaurantId, addressId, items, observacao } = req.body;
      if (!restaurantId || !addressId || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Dados do pedido inválidos' });
      }

      // Verificar se o restaurante está aberto
      const restaurante = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
      if (!restaurante) return res.status(400).json({ error: 'Restaurante inválido' });
      if (!restaurante.aberto) return res.status(400).json({ error: 'O restaurante está fechado no momento' });

      // Calcular total
      let subtotal = 0;
      const taxa_entrega = restaurante.taxa_entrega || 0;

      // Primeiro valida todos os produtos e adicionais
      for (const item of items) {
        // Verificar produto
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (!product || !product.ativo) return res.status(400).json({ error: 'Produto inválido' });
        subtotal += product.preco * item.quantidade;

        // Verificar adicionais
        if (item.adicionais && Array.isArray(item.adicionais)) {
          for (const adicional of item.adicionais) {
            const adicionalDb = await prisma.adicional.findUnique({ 
              where: { id: adicional.adicionalId } 
            });
            if (!adicionalDb || adicionalDb.productId !== item.productId) {
              return res.status(400).json({ error: 'Adicional inválido' });
            }
            if (adicional.quantidade > adicionalDb.quantidadeMax) {
              return res.status(400).json({ error: `Quantidade máxima excedida para o adicional ${adicionalDb.nome}` });
            }
            subtotal += adicionalDb.preco * adicional.quantidade;
          }
        }
      }      // Criar pedido
      const order = await prisma.order.create({
        data: {
          userId: req.user.id,          restaurantId,
          addressId,
          status: 'Pendente',
          total: subtotal + taxa_entrega,
          taxa_entrega,
          observacao,
          orderItems: {
            create: items.map(item => ({
              productId: item.productId,
              quantidade: item.quantidade,
              preco_unitario: item.preco_unitario,
              adicionais: item.adicionais ? {
                create: item.adicionais.map(adicional => ({
                  adicionalId: adicional.adicionalId,
                  quantidade: adicional.quantidade,
                  preco_unitario: adicional.preco
                }))
              } : undefined
            }))
          }
        },
        include: { 
          orderItems: { include: { product: true } },
          user: true,
          restaurant: true,
          address: true
        }
      });

      // Obter referência do io do app
      const io = req.app.get('io');

      // Emitir notificação para o lojista
      if (order.restaurant?.userId) {
        io.to(`user:${order.restaurant.userId}`).emit('order-update', {
          type: 'new-order',
          orderId: order.id,
          order: {
            ...order,
            user: {
              nome: order.user.nome,
              email: order.user.email,
              telefone: order.user.telefone
            }
          }
        });
      }

      res.status(201).json(order);
    } catch (err) {
      console.error('Erro ao criar pedido:', err);
      res.status(500).json({ error: 'Erro ao criar pedido' });
    }
  },

  listOrders: async (req, res) => {
    try {
      const prisma = require('../prisma/prismaClient');
      const { page = 1, limit = 10, orderBy = 'data_criacao', order = 'desc', status } = req.query;
      const where = { userId: req.user.id, ...(status && { status }) };
      const total = await prisma.order.count({ where });
      const pedidos = await prisma.order.findMany({
        where,
        include: {
          restaurant: true,
          orderItems: { include: { product: true } },
          address: true,
          review: true
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { [orderBy]: order }
      });
      res.json({ total, page: Number(page), limit: Number(limit), data: pedidos });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao listar pedidos' });
    }
  },

  getOrder: async (req, res) => {
    try {
      const prisma = require('../prisma/prismaClient');
      const { id } = req.params;
      const pedido = await prisma.order.findUnique({
        where: { id: Number(id) },
        include: {
          restaurant: true,
          orderItems: { include: { product: true } },
          address: true,
          review: true
        }
      });
      if (!pedido || pedido.userId !== req.user.id) return res.status(404).json({ error: 'Pedido não encontrado' });
      res.json(pedido);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao buscar pedido' });
    }
  },

  createReview: async (req, res) => {
    try {
      const prisma = require('../prisma/prismaClient');
      const { orderId, nota, comentario } = req.body;
      if (!orderId || typeof nota !== 'number' || !comentario) {
        return res.status(400).json({ error: 'Dados da avaliação inválidos' });
      }
      // Só pode avaliar pedido entregue e do próprio usuário
      const pedido = await prisma.order.findUnique({ where: { id: orderId }, include: { review: true } });
      if (!pedido || pedido.userId !== req.user.id || pedido.status !== 'Entregue') {
        return res.status(400).json({ error: 'Pedido não elegível para avaliação' });
      }
      if (pedido.review) return res.status(400).json({ error: 'Pedido já avaliado' });
      const review = await prisma.review.create({
        data: {
          orderId,
          nota,
          comentario,
          restaurantId: pedido.restaurantId
        }
      });
      res.status(201).json(review);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao registrar avaliação' });
    }
  },

  // Adiciona um novo endereço
  createAddress: async (req, res) => {
    try {
      const prisma = require('../prisma/prismaClient');
      const { rua, numero, bairro, cidade, complemento, cep } = req.body;
      
      if (!rua || !numero || !bairro || !cidade || !cep) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando' });
      }

      const endereco = await prisma.address.create({
        data: {
          userId: req.user.id,
          rua,
          numero,
          bairro,
          cidade,
          complemento,
          cep
        }
      });
      res.status(201).json(endereco);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao cadastrar endereço' });
    }
  },

  // Atualiza um endereço existente
  updateAddress: async (req, res) => {
    try {
      const prisma = require('../prisma/prismaClient');
      const { id } = req.params;
      const { rua, numero, bairro, cidade, complemento, cep } = req.body;
      
      const endereco = await prisma.address.findUnique({
        where: { id: Number(id) }
      });

      if (!endereco || endereco.userId !== req.user.id) {
        return res.status(404).json({ error: 'Endereço não encontrado' });
      }

      const updatedEndereco = await prisma.address.update({
        where: { id: Number(id) },
        data: {
          ...(rua && { rua }),
          ...(numero && { numero }),
          ...(bairro && { bairro }),
          ...(cidade && { cidade }),
          ...(complemento && { complemento }),
          ...(cep && { cep })
        }
      });
      res.json(updatedEndereco);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao atualizar endereço' });
    }
  },

  // Lista endereços do usuário
  listAddresses: async (req, res) => {
    try {
      const prisma = require('../prisma/prismaClient');
      const enderecos = await prisma.address.findMany({
        where: { userId: req.user.id }
      });
      res.json(enderecos);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao listar endereços' });
    }
  },

  // Deleta um endereço
  deleteAddress: async (req, res) => {
    try {
      const prisma = require('../prisma/prismaClient');
      const { id } = req.params;
      
      const endereco = await prisma.address.findUnique({
        where: { id: Number(id) }
      });

      if (!endereco || endereco.userId !== req.user.id) {
        return res.status(404).json({ error: 'Endereço não encontrado' });
      }

      await prisma.address.delete({
        where: { id: Number(id) }
      });
      res.json({ msg: 'Endereço excluído!' });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao excluir endereço' });
    }
  },
};
