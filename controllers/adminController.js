const prisma = require('../prisma/prismaClient');
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'segredo123';

// Função para formatar CEP padrão: 00000-000
const formatarCEP = (cep) => {
  if (!cep) return '';
  
  const cepStr = String(cep);
  const cepNumeros = cepStr.replace(/\D/g, '');
  
  if (cepNumeros.length < 8) return '';
  
  const cepOito = cepNumeros.substring(0, 8);
  return cepOito.replace(/(\d{5})(\d{3})/, '$1-$2');
};

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
      if (!req.user?.id) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const admin = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          nome: true,
          email: true,
          tipo: true,
          telefone: true,
          endereco: true,
          avatarUrl: true,
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

      if (!admin) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      console.log('Perfil admin recuperado com endereços:', 
                 admin?.addresses ? `${admin.addresses.length} endereços encontrados` : 'Sem endereços');

      res.json(admin);
    } catch (err) {
      console.error("[getProfile] Erro ao buscar perfil de admin:", err);
      res.status(500).json({ error: "Erro ao buscar perfil de admin" });
    }
  },

  updateProfile: async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const { nome, avatarUrl, telefone, address } = req.body;
      console.log('Dados recebidos para admin:', { nome, avatarUrl, telefone, address });

      // Função para formatar CEP
      const formatarCEP = (cep) => {
        if (!cep) return '';
        
        const cepStr = String(cep);
        const cepNumeros = cepStr.replace(/\D/g, '');
        
        if (cepNumeros.length < 8) return '';
        
        const cepOito = cepNumeros.substring(0, 8);
        return cepOito.replace(/(\d{5})(\d{3})/, '$1-$2');
      };

      // Função para formatar endereço como string
      const formatarEndereco = (address) => {
        if (!address) return null;
        
        if (!address.rua || !address.numero || !address.bairro || !address.cidade || !address.estado || !address.cep) {
          return null;
        }

        const cep = formatarCEP(address.cep);
        
        const complementoStr = address.complemento ? ` - ${address.complemento.trim()}` : '';
        return `${address.rua.trim()}, ${address.numero.trim()}${complementoStr}, ${address.bairro.trim()}, ${address.cidade.trim()}/${address.estado.trim()} - CEP: ${cep}`;
      };

      // Validação dos dados do usuário
      const updateData = {
        ...(nome?.trim() && { nome: nome.trim() }),
        ...(avatarUrl?.trim() && { avatarUrl: avatarUrl.trim() }),
        ...(telefone?.trim() && { telefone: telefone.trim() })
      };

      // Validação do endereço
      let addressData = null;
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
        
        // Prepara os dados do endereço para salvar
        const cepLimpo = address.cep.replace(/\D/g, '');
        const cepFormatado = formatarCEP(cepLimpo);
        
        if (!cepFormatado || !cepFormatado.match(/^\d{5}-\d{3}$/)) {
          return res.status(400).json({ error: "CEP inválido. Use o formato: 00000-000" });
        }
        
        addressData = {
          rua: address.rua.trim(),
          numero: address.numero.trim(),
          bairro: address.bairro.trim(),
          cidade: address.cidade.trim(),
          estado: address.estado.trim(),
          cep: cepFormatado,
          complemento: address.complemento?.trim() || null
        };
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
        console.log('Iniciando transação para atualizar perfil e endereço do admin');
        
        let addressStr = existingUser.endereco;
        let userAddress = null;
        
        // Manipula o endereço primeiro, se foi fornecido
        if (address && addressData) {
          console.log('Processando dados de endereço para admin:', addressData);
          
          // Formata o endereço como string para o campo endereco legado
          addressStr = formatarEndereco(addressData);
          
          // Verifica se o usuário já possui um endereço
          const userAddresses = await tx.address.findMany({
            where: { userId: req.user.id }
          });
          
          console.log(`Admin - endereços existentes encontrados: ${userAddresses.length}`);
          
          // Upsert: atualiza se existir, cria se não existir
          if (userAddresses && userAddresses.length > 0) {
            console.log('Atualizando endereço existente do admin:', userAddresses[0].id);
            userAddress = await tx.address.update({
              where: { id: userAddresses[0].id },
              data: addressData
            });
            console.log('Endereço do admin atualizado com sucesso:', userAddress);
          } else {
            console.log('Criando novo endereço para o admin:', req.user.id);
            userAddress = await tx.address.create({
              data: {
                userId: req.user.id,
                ...addressData
              }
            });
            console.log('Novo endereço do admin criado com sucesso:', userAddress);
          }
        }
        
        // Atualização do usuário
        console.log('Atualizando dados do admin');
        const updatedUserData = {
          ...updateData
        };
        
        // Apenas atualiza o endereco string se tivermos um novo endereço
        if (addressStr) {
          updatedUserData.endereco = addressStr;
        }
        
        const updatedUser = await tx.user.update({
          where: { id: req.user.id },
          data: updatedUserData
        });
        
        console.log('Admin atualizado com sucesso');
        
        // Criar o objeto de retorno completo
        return {
          ...updatedUser,
          addresses: userAddress ? [userAddress] : []
        };
      });

      if (!result) {
        throw new Error("Usuário não encontrado após atualização");
      }

      console.log('Perfil admin atualizado:', result);
      
      // Verifica se os endereços estão no resultado
      if (!result.addresses || result.addresses.length === 0) {
        console.log('Endereços do admin não encontrados no resultado da transação. Buscando novamente...');
        
        // Busca os endereços atualizados diretamente
        const addresses = await prisma.address.findMany({
          where: { userId: req.user.id }
        });
        
        if (addresses.length > 0) {
          console.log('Adicionando endereços do admin ao resultado:', addresses);
          result.addresses = addresses;
        } else if (addressData) {
          console.warn('Nenhum endereço do admin encontrado! Tentando criar como último recurso...');
          
          try {
            const newAddress = await prisma.address.create({
              data: {
                userId: req.user.id,
                ...addressData
              }
            });
            
            result.addresses = [newAddress];
            console.log('Novo endereço do admin criado e adicionado ao resultado:', newAddress);
          } catch (error) {
            console.error('Erro ao criar endereço do admin como último recurso:', error);
          }
        }
      }
      
      res.json({
        msg: "Perfil atualizado com sucesso!",
        user: {
          ...result,
          addresses: result.addresses || []
        }
      });
    } catch (err) {
      console.error("[updateProfile] Erro ao atualizar perfil de admin:", err);
      res.status(500).json({ error: "Erro ao atualizar perfil de admin" });
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
      
      console.log(`Endereços do admin (id: ${req.user.id}) encontrados:`, enderecos.length);
      
      res.json(enderecos);
    } catch (err) {
      console.error("[listAddresses] Erro ao listar endereços do admin:", err);
      res.status(500).json({ error: "Erro ao listar endereços" });
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

  createAddress: async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const { rua, numero, bairro, cidade, estado, complemento, cep } = req.body;
      
      const requiredFields = ['rua', 'numero', bairro, 'cidade', 'estado', 'cep'];
      const missingFields = requiredFields.filter(field => !req.body[field]?.trim());
      
      if (missingFields.length > 0) {
        return res.status(400).json({ 
          error: "Campos obrigatórios faltando",
          fields: missingFields
        });
      }

      // Limpa o CEP recebido
      const cepNumeros = cep ? cep.replace(/\D/g, '') : '';
      
      // Valida se tem 8 dígitos
      if (cepNumeros.length !== 8) {
        return res.status(400).json({ error: "CEP inválido. Deve conter 8 dígitos numéricos." });
      }
      
      // Formata o CEP
      const cepFormatado = formatarCEP(cep);
      if (!cepFormatado.match(/^\d{5}-\d{3}$/)) {
        return res.status(400).json({ error: "Erro ao formatar CEP." });
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
      
      console.log('Novo endereço do admin criado:', endereco);
      res.status(201).json(endereco);
    } catch (err) {
      console.error("[createAddress] Erro ao cadastrar endereço do admin:", err);
      res.status(500).json({ error: "Erro ao cadastrar endereço" });
    }
  },

  updateAddress: async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const { id } = req.params;
      const { rua, numero, bairro, cidade, estado, complemento, cep } = req.body;

      // Verificar se o endereço existe e pertence ao usuário
      const endereco = await prisma.address.findUnique({
        where: { id: Number(id) }
      });

      if (!endereco) {
        return res.status(404).json({ error: "Endereço não encontrado" });
      }

      if (endereco.userId !== req.user.id) {
        return res.status(403).json({ error: "Sem permissão para editar este endereço" });
      }

      // Validações dos campos
      const requiredFields = ['rua', 'numero', 'bairro', 'cidade', 'estado', 'cep'];
      const missingFields = requiredFields.filter(field => !req.body[field]?.trim());
      
      if (missingFields.length > 0) {
        return res.status(400).json({ 
          error: "Campos obrigatórios faltando",
          fields: missingFields
        });
      }

      // Validação do CEP
      const cepNumeros = cep ? cep.replace(/\D/g, '') : '';
      if (cepNumeros.length !== 8) {
        return res.status(400).json({ error: "CEP inválido. Deve conter 8 dígitos numéricos." });
      }
      
      // Formata o CEP
      const cepFormatado = formatarCEP(cep);
      if (!cepFormatado.match(/^\d{5}-\d{3}$/)) {
        return res.status(400).json({ error: "Erro ao formatar CEP." });
      }

      // Atualiza o endereço
      const updatedAddress = await prisma.address.update({
        where: { id: Number(id) },
        data: {
          rua: rua.trim(),
          numero: numero.trim(),
          bairro: bairro.trim(),
          cidade: cidade.trim(),
          estado: estado.trim(),
          complemento: complemento?.trim() || null,
          cep: cepFormatado
        }
      });
      
      console.log('Endereço do admin atualizado:', updatedAddress);
      res.json(updatedAddress);
    } catch (err) {
      console.error("[updateAddress] Erro ao atualizar endereço do admin:", err);
      res.status(500).json({ error: "Erro ao atualizar endereço" });
    }
  },

  deleteAddress: async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const { id } = req.params;

      // Verificar se o endereço existe e pertence ao usuário
      const endereco = await prisma.address.findUnique({
        where: { id: Number(id) }
      });

      if (!endereco) {
        return res.status(404).json({ error: "Endereço não encontrado" });
      }

      if (endereco.userId !== req.user.id) {
        return res.status(403).json({ error: "Sem permissão para excluir este endereço" });
      }

      // Exclui o endereço
      await prisma.address.delete({
        where: { id: Number(id) }
      });
      
      console.log(`Endereço do admin id: ${id} excluído com sucesso`);
      res.json({ msg: "Endereço excluído com sucesso" });
    } catch (err) {
      console.error("[deleteAddress] Erro ao excluir endereço do admin:", err);
      res.status(500).json({ error: "Erro ao excluir endereço" });
    }
  },
};
