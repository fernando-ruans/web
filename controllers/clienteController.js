const prisma = require('../prisma/prismaClient');

const formatarCEP = (cep) => {
  if (!cep) return '';
  return cep.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2');
};

const formatarEndereco = (address) => {
  if (!address) return null;
  
  // Garante que todos os campos obrigatórios existem
  if (!address.rua || !address.numero || !address.bairro || !address.cidade || !address.estado || !address.cep) {
    return null;
  }

  // Valida e formata o CEP
  const cep = address.cep.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2');
  
  // Monta o endereço no formato padrão
  const complementoStr = address.complemento ? ` - ${address.complemento.trim()}` : '';
  return `${address.rua.trim()}, ${address.numero.trim()}${complementoStr}, ${address.bairro.trim()}, ${address.cidade.trim()}/${address.estado.trim()} - CEP: ${cep}`;
};

module.exports = {
  getProfile: async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const cliente = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          nome: true,
          email: true,
          tipo: true,
          telefone: true,
          endereco: true,
          avatarUrl: true,
          addresses: true
        }
      });

      if (!cliente) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      res.json(cliente);
    } catch (err) {
      console.error("[getProfile] Erro ao buscar perfil:", err);
      res.status(500).json({ 
        error: "Erro ao buscar perfil",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },

  updateProfile: async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const { nome, avatarUrl, telefone, address } = req.body;
      console.log('Dados recebidos:', { nome, avatarUrl, telefone, address });

      // Validação dos dados do usuário
      const updateData = {
        ...(nome?.trim() && { nome: nome.trim() }),
        ...(avatarUrl?.trim() && { avatarUrl: avatarUrl.trim() }),
        ...(telefone?.trim() && { telefone: telefone.trim() })
      };

      // Validação dos dados do endereço
      if (address) {
        const requiredFields = ['rua', 'numero', 'bairro', 'cidade', 'estado', 'cep'];
        const missingFields = requiredFields.filter(field => {
          const value = address[field]?.toString().trim();
          return !value || value.length === 0;
        });
        
        if (missingFields.length > 0) {
          return res.status(400).json({ 
            error: "Campos obrigatórios do endereço faltando", 
            fields: missingFields 
          });
        }

        // Normaliza os campos do endereço
        for (const field of [...requiredFields, 'complemento']) {
          if (address[field] !== undefined) {
            address[field] = address[field].toString().trim();
          }
        }
      }

      // Verifica se o usuário existe
      const existingUser = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          addresses: true
        }
      });

      if (!existingUser) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Atualização em transação
      const result = await prisma.$transaction(async (tx) => {
        // Atualização do usuário
        if (Object.keys(updateData).length > 0 || address) {
          const addressStr = address ? formatarEndereco(address) : existingUser.endereco;
          await tx.user.update({
            where: { id: req.user.id },
            data: {
              ...updateData,
              endereco: addressStr
            }
          });
        }

        // Atualização ou criação do endereço
        if (address) {
          const addressData = {
            rua: address.rua,
            numero: address.numero,
            bairro: address.bairro,
            cidade: address.cidade,
            estado: address.estado,
            cep: address.cep,
            complemento: address.complemento || null
          };

          if (existingUser.addresses.length > 0) {
            await tx.address.update({
              where: { id: existingUser.addresses[0].id },
              data: addressData
            });      } else {
        // Deleta endereços antigos se houver
        await tx.address.deleteMany({
          where: { userId: req.user.id }
        });
        
        // Cria o novo endereço
        await tx.address.create({
          data: {
            userId: req.user.id,
            ...addressData
          }
        });
      }
        }

        // Busca o usuário atualizado com os endereços
        return await tx.user.findUnique({
          where: { id: req.user.id },
          select: {
            id: true,
            nome: true,
            email: true,
            tipo: true,
            avatarUrl: true,
            telefone: true,
            endereco: true,
            addresses: {
              select: {
                id: true,
                rua: true,
                numero: true,
                bairro: true,
                cidade: true,
                estado: true,
                complemento: true,
                cep: true
              }
            }
          }
        });
      });

      if (!result) {
        throw new Error("Usuário não encontrado após atualização");
      }

      console.log('Perfil atualizado:', result);

      res.json({
        msg: "Perfil atualizado com sucesso!",
        user: result
      });
    } catch (err) {
      console.error("[updateProfile] Erro ao atualizar perfil:", err);
      
      if (err.code === 'P2002') {
        return res.status(400).json({ error: "Dados já existem no sistema" });
      }
      
      res.status(500).json({ 
        error: "Erro ao atualizar perfil",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },

  listAddresses: async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const enderecos = await prisma.address.findMany({
        where: { userId: req.user.id }
      });
      res.json(enderecos);
    } catch (err) {
      console.error("[listAddresses] Erro ao listar endereços:", err);
      res.status(500).json({ 
        error: "Erro ao listar endereços",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },

  createAddress: async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const { rua, numero, bairro, cidade, estado, complemento, cep } = req.body;
      
      const requiredFields = ['rua', 'numero', 'bairro', 'cidade', 'estado', 'cep'];
      const missingFields = requiredFields.filter(field => !req.body[field]?.trim());
      
      if (missingFields.length > 0) {
        return res.status(400).json({ 
          error: "Campos obrigatórios faltando",
          fields: missingFields
        });
      }

      // Valida e formata o CEP
      const cepFormatado = formatarCEP(cep);
      if (!cepFormatado.match(/^\d{5}-\d{3}$/)) {
        return res.status(400).json({ error: "CEP inválido. Use o formato: 00000-000" });
      }

      const endereco = await prisma.address.create({
        data: {
          userId: req.user.id,
          rua: rua.trim(),
          numero: numero.trim(),
          bairro: bairro.trim(),
          cidade: cidade.trim(),
          estado: estado.trim(),
          complemento: complemento?.trim() || null,
          cep: cepFormatado
        }
      });
      
      res.status(201).json(endereco);
    } catch (err) {
      console.error("[createAddress] Erro ao cadastrar endereço:", err);
      res.status(500).json({ 
        error: "Erro ao cadastrar endereço",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },

  updateAddress: async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const { id } = req.params;
      const { rua, numero, bairro, cidade, estado, complemento, cep } = req.body;
      
      // Validação do ID
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: "ID do endereço inválido" });
      }

      const endereco = await prisma.address.findUnique({
        where: { id: Number(id) }
      });

      if (!endereco) {
        return res.status(404).json({ error: "Endereço não encontrado" });
      }

      if (endereco.userId !== req.user.id) {
        return res.status(403).json({ error: "Sem permissão para editar este endereço" });
      }

      // Valida campos obrigatórios se fornecidos
      // Verifica e formata o CEP se fornecido
      let cepFormatado = undefined;
      if (cep) {
        cepFormatado = formatarCEP(cep);
        if (!cepFormatado.match(/^\d{5}-\d{3}$/)) {
          return res.status(400).json({ error: "CEP inválido. Use o formato: 00000-000" });
        }
      }

      const updatedFields = {
        ...(rua?.trim() && { rua: rua.trim() }),
        ...(numero?.trim() && { numero: numero.trim() }),
        ...(bairro?.trim() && { bairro: bairro.trim() }),
        ...(cidade?.trim() && { cidade: cidade.trim() }),
        ...(estado?.trim() && { estado: estado.trim() }),
        ...(cepFormatado && { cep: cepFormatado }),
        ...(complemento !== undefined && { complemento: complemento?.trim() || null })
      };

      if (Object.keys(updatedFields).length === 0) {
        return res.status(400).json({ error: "Nenhum dado válido para atualização" });
      }

      const updatedEndereco = await prisma.address.update({
        where: { id: Number(id) },
        data: updatedFields
      });

      res.json(updatedEndereco);
    } catch (err) {
      console.error("[updateAddress] Erro ao atualizar endereço:", err);
      res.status(500).json({ 
        error: "Erro ao atualizar endereço",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },

  deleteAddress: async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const { id } = req.params;
      
      // Validação do ID
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: "ID do endereço inválido" });
      }

      const endereco = await prisma.address.findUnique({
        where: { id: Number(id) }
      });

      if (!endereco) {
        return res.status(404).json({ error: "Endereço não encontrado" });
      }

      if (endereco.userId !== req.user.id) {
        return res.status(403).json({ error: "Sem permissão para excluir este endereço" });
      }

      await prisma.address.delete({
        where: { id: Number(id) }
      });

      res.json({ msg: "Endereço excluído com sucesso!" });
    } catch (err) {
      console.error("[deleteAddress] Erro ao excluir endereço:", err);
      res.status(500).json({ 
        error: "Erro ao excluir endereço",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },

  createOrder: async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const { restaurantId, addressId, observacao, items } = req.body;

      // Validar se o restaurante existe
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId }
      });

      if (!restaurant) {
        return res.status(404).json({ error: "Restaurante não encontrado" });
      }

      // Validar se o endereço pertence ao usuário
      const address = await prisma.address.findUnique({
        where: { id: addressId }
      });

      if (!address || address.userId !== req.user.id) {
        return res.status(404).json({ error: "Endereço não encontrado" });
      }

      // Criar o pedido em uma transação
      const order = await prisma.$transaction(async (tx) => {
        // Criar o pedido
        const order = await tx.order.create({
          data: {
            userId: req.user.id,
            restaurantId,
            addressId,
            observacao: observacao || null,
            status: 'PENDING',
            items: {
              create: items.map(item => ({
                productId: item.productId,
                quantidade: item.quantidade,
                preco_unitario: item.preco_unitario,
                adicionais: item.adicionais ? {
                  create: item.adicionais.map(adicional => ({
                    adicionalId: adicional.adicionalId,
                    quantidade: adicional.quantidade,
                    preco: adicional.preco
                  }))
                } : undefined
              }))
            }
          },
          include: {
            items: {
              include: {
                product: true,
                adicionais: {
                  include: {
                    adicional: true
                  }
                }
              }
            },
            address: true,
            restaurant: true
          }
        });

        return order;
      });

      res.status(201).json(order);
    } catch (err) {
      console.error("[createOrder] Erro ao criar pedido:", err);
      res.status(500).json({ 
        error: "Erro ao criar pedido",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },

  createReview: async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const { orderId, nota, comentario } = req.body;

      // Verificar se o pedido existe e pertence ao usuário
      const order = await prisma.order.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        return res.status(404).json({ error: "Pedido não encontrado" });
      }

      if (order.userId !== req.user.id) {
        return res.status(403).json({ error: "Sem permissão para avaliar este pedido" });
      }

      // Verificar se já existe uma avaliação para este pedido
      const existingReview = await prisma.review.findFirst({
        where: { orderId }
      });

      if (existingReview) {
        return res.status(400).json({ error: "Este pedido já foi avaliado" });
      }

      // Criar a avaliação
      const review = await prisma.review.create({
        data: {
          orderId,
          userId: req.user.id,
          restaurantId: order.restaurantId,
          nota,
          comentario
        },
        include: {
          user: {
            select: {
              id: true,
              nome: true,
              avatarUrl: true
            }
          }
        }
      });

      res.status(201).json(review);
    } catch (err) {
      console.error("[createReview] Erro ao criar avaliação:", err);
      res.status(500).json({ 
        error: "Erro ao criar avaliação",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },

  listRestaurants: async (req, res) => {
    try {
      const restaurants = await prisma.restaurant.findMany({
        where: { 
          // O campo 'ativo' não existe no modelo Restaurant, então vamos buscar todos
        },
        select: {
          id: true,
          nome: true,
          imagem: true,
          banner: true,
          endereco: true,
          taxa_entrega: true,
          tempo_entrega: true,
          status: true,
          telefone: true,
          aberto: true, 
          cep: true,
          _count: {
            select: {
              reviews: true
            }
          },
          reviews: {
            select: {
              nota: true
            }
          }
        }
      });

      // Calcular média das avaliações
      const restaurantsWithRating = restaurants.map(restaurant => {
        const avgRating = restaurant.reviews.length > 0
          ? restaurant.reviews.reduce((acc, review) => acc + review.nota, 0) / restaurant.reviews.length
          : null;

        const { reviews, ...rest } = restaurant;
        return {
          ...rest,
          avaliacaoMedia: Number(avgRating?.toFixed(1)) || null,
          totalAvaliacoes: restaurant._count.reviews
        };
      });

      res.json({ data: restaurantsWithRating });
    } catch (err) {
      console.error("[listRestaurants] Erro ao listar restaurantes:", err);
      res.status(500).json({ 
        error: "Erro ao listar restaurantes",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },

  getRestaurant: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: "ID do restaurante inválido" });
      }

      const restaurant = await prisma.restaurant.findUnique({
        where: { 
          id: Number(id),
          ativo: true
        },
        include: {
          categorias: true,
          produtos: {
            where: { ativo: true },
            include: {
              adicionais: {
                where: { ativo: true }
              }
            }
          },
          reviews: {
            select: {
              id: true,
              nota: true,
              comentario: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  nome: true,
                  avatarUrl: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 10
          },
          _count: {
            select: {
              reviews: true
            }
          }
        }
      });

      if (!restaurant) {
        return res.status(404).json({ error: "Restaurante não encontrado" });
      }

      // Calcular média das avaliações
      const avgRating = restaurant.reviews.length > 0
        ? restaurant.reviews.reduce((acc, review) => acc + review.nota, 0) / restaurant.reviews.length
        : null;

      const response = {
        ...restaurant,
        avaliacaoMedia: Number(avgRating?.toFixed(1)) || null,
        totalAvaliacoes: restaurant._count.reviews
      };

      res.json(response);
    } catch (err) {
      console.error("[getRestaurant] Erro ao buscar restaurante:", err);
      res.status(500).json({ 
        error: "Erro ao buscar restaurante",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },

  getRestaurantMenu: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: "ID do restaurante inválido" });
      }

      const menu = await prisma.categoria.findMany({
        where: {
          restaurantId: Number(id),
          produtos: {
            some: {
              ativo: true
            }
          }
        },
        include: {
          produtos: {
            where: { ativo: true },
            include: {
              adicionais: {
                where: { ativo: true }
              }
            }
          }
        }
      });

      res.json(menu);
    } catch (err) {
      console.error("[getRestaurantMenu] Erro ao buscar cardápio:", err);
      res.status(500).json({ 
        error: "Erro ao buscar cardápio",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },

  listOrders: async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const orders = await prisma.order.findMany({
        where: { 
          userId: req.user.id 
        },
        include: {
          restaurant: {
            select: {
              id: true,
              nome: true,
              logoUrl: true
            }
          },
          items: {
            include: {
              product: true,
              adicionais: {
                include: {
                  adicional: true
                }
              }
            }
          },
          address: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json(orders);
    } catch (err) {
      console.error("[listOrders] Erro ao listar pedidos:", err);
      res.status(500).json({ 
        error: "Erro ao listar pedidos",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },

  getOrder: async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: "ID do pedido inválido" });
      }

      const order = await prisma.order.findUnique({
        where: { 
          id: Number(id)
        },
        include: {
          restaurant: true,
          items: {
            include: {
              product: true,
              adicionais: {
                include: {
                  adicional: true
                }
              }
            }
          },
          address: true
        }
      });

      if (!order) {
        return res.status(404).json({ error: "Pedido não encontrado" });
      }

      if (order.userId !== req.user.id) {
        return res.status(403).json({ error: "Sem permissão para acessar este pedido" });
      }

      res.json(order);
    } catch (err) {
      console.error("[getOrder] Erro ao buscar pedido:", err);
      res.status(500).json({ 
        error: "Erro ao buscar pedido",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }
};
