const prisma = require('../prisma/prismaClient');
const jwt = require('jsonwebtoken');
const PDFDocument = require('pdfkit');
const moment = require('moment');
const path = require('path');
const fs = require('fs');
const maintenancePath = path.join(__dirname, '../maintenance.json');

function setMaintenance(enabled) {
  fs.writeFileSync(maintenancePath, JSON.stringify({ enabled }));
}
function getMaintenance() {
  try {
    return JSON.parse(fs.readFileSync(maintenancePath, 'utf-8')).enabled;
  } catch {
    return false;
  }
}

moment.locale('pt-br');
const SECRET = process.env.JWT_SECRET || 'segredo123';

// Cores do tema
const colors = {
  primary: '#f97316', // orange-500
  secondary: '#1e40af', // blue-800
  text: '#1f2937', // gray-800
  subtext: '#6b7280', // gray-500
  border: '#e5e7eb', // gray-200
};

// Função para formatar valores monetários
const formatarMoeda = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
};

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
      const statusEntregue = [
        'ENTREGUE', 'entregue', 'DELIVERED', 'delivered', 'COMPLETED', 'completed'
      ];
      const statusCancelado = [
        'CANCELADO', 'cancelado', 'CANCELED', 'canceled', 'CANCELLED', 'cancelled'
      ];

      // NOVO: Filtro de datas
      let { dataInicio, dataFim } = req.query;
      let filtroData = {};
      if (dataInicio) {
        try {
          dataInicio = new Date(dataInicio);
          if (!isNaN(dataInicio.getTime())) filtroData.gte = dataInicio;
        } catch (e) {}
      }
      if (dataFim) {
        try {
          dataFim = new Date(dataFim);
          if (!isNaN(dataFim.getTime())) filtroData.lte = dataFim;
        } catch (e) {}
      }
      // Se não houver filtro, não aplica nada
      const filtroPedidos = Object.keys(filtroData).length > 0 ? { data_criacao: filtroData } : {};
      const filtroClientes = Object.keys(filtroData).length > 0 ? { createdAt: filtroData, tipo: 'cliente' } : { tipo: 'cliente' };

      // Pedidos entregues
      const pedidosEntregues = await prisma.order.count({
        where: {
          OR: statusEntregue.map(status => ({ status })),
          ...filtroPedidos
        }
      });
      const totalVendas = pedidosEntregues;
      // Total de pedidos (todos os pedidos)
      const totalPedidos = await prisma.order.count({ where: { ...filtroPedidos } });
      // Total de restaurantes (não filtra por data)
      const totalRestaurantes = await prisma.restaurant.count();
      // Total de clientes (aplica filtro de data se houver)
      const totalClientes = await prisma.user.count({ where: filtroClientes });
      // Faturamento (soma dos pedidos entregues)
      const faturamentoObj = await prisma.order.aggregate({
        _sum: { total: true },
        where: {
          OR: statusEntregue.map(status => ({ status })),
          ...filtroPedidos
        }
      });
      const faturamento = faturamentoObj._sum.total || 0;
      // Ticket médio
      const ticketMedio = totalVendas > 0 ? faturamento / totalVendas : 0;
      // Pedidos cancelados
      const pedidosCancelados = await prisma.order.count({
        where: {
          OR: statusCancelado.map(status => ({ status })),
          ...filtroPedidos
        }
      });
      // Novos clientes no período (ou mês atual se não houver filtro)
      let novosClientesMes = 0;
      if (Object.keys(filtroData).length > 0) {
        novosClientesMes = await prisma.user.count({ where: filtroClientes });
      } else {
        const now = new Date();
        const primeiroDiaMes = new Date(now.getFullYear(), now.getMonth(), 1);
        novosClientesMes = await prisma.user.count({
          where: { tipo: 'cliente', createdAt: { gte: primeiroDiaMes } }
        });
      }
      // Restaurante com maior faturamento
      const topRestaurante = await prisma.order.groupBy({
        by: ['restaurantId'],
        where: {
          OR: statusEntregue.map(status => ({ status })),
          ...filtroPedidos
        },
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
        pedidosEntregues,
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

  gerarRelatorioPDF: async (req, res) => {
    try {
      const { dataInicio, dataFim } = req.query;

      // Arrays de status padronizados (iguais ao painel)
      const statusEntregue = [
        'ENTREGUE', 'entregue', 'DELIVERED', 'delivered', 'COMPLETED', 'completed'
      ];
      const statusCancelado = [
        'CANCELADO', 'cancelado', 'CANCELED', 'canceled', 'CANCELLED', 'cancelled'
      ];

      // Validar datas
      const inicio = dataInicio ? moment(dataInicio).startOf('day') : moment().subtract(30, 'days').startOf('day');
      const fim = dataFim ? moment(dataFim).endOf('day') : moment().endOf('day');

      // Criar o documento PDF
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        }
      });
      
      // Configurar headers para download do PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=relatorio-${inicio.format('DD-MM-YYYY')}-a-${fim.format('DD-MM-YYYY')}.pdf`);
      
      // Pipe o PDF para a resposta
      doc.pipe(res);

      // Adicionar logo
      const logoPath = path.join(__dirname, '..', 'uploads', 'logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 45, { width: 120 });
      }

      // Adicionar cabeçalho com data de geração
      doc.fontSize(10)
         .fillColor(colors.subtext)
         .text(`Gerado em: ${moment().format('DD/MM/YYYY HH:mm')}`, 400, 50, { align: 'right' });

      // Adicionar título e período
      doc.moveDown(3)
         .fontSize(24)
         .fillColor(colors.primary)
         .text('Relatório Administrativo', 200, doc.y, { align: 'center' });
      
      doc.moveDown()
         .fontSize(14)
         .fillColor(colors.secondary)
         .text(`Período: ${inicio.format('DD/MM/YYYY')} a ${fim.format('DD/MM/YYYY')}`, { align: 'center' });

      // Adicionar linha divisória
      doc.moveDown()
         .moveTo(50, doc.y)
         .lineTo(545, doc.y)
         .strokeColor(colors.border)
         .stroke();

      // Buscar dados para o relatório usando arrays de status
      const [
        pedidosEntregues,
        pedidosCancelados,
        restaurantes,
        clientes,
        faturamentoObj,
        novosClientes,
        topRestaurantes
      ] = await Promise.all([
        prisma.order.count({ 
          where: { 
            OR: statusEntregue.map(status => ({ status })),
            data_criacao: { gte: inicio.toDate(), lte: fim.toDate() }
          }
        }),
        prisma.order.count({ 
          where: { 
            OR: statusCancelado.map(status => ({ status })),
            data_criacao: { gte: inicio.toDate(), lte: fim.toDate() }
          }
        }),
        prisma.restaurant.count(),
        prisma.user.count({ where: { tipo: 'cliente' }}),
        prisma.order.aggregate({
          _sum: { total: true },
          where: { 
            OR: statusEntregue.map(status => ({ status })),
            data_criacao: { gte: inicio.toDate(), lte: fim.toDate() }
          }
        }),
        prisma.user.count({
          where: {
            tipo: 'cliente',
            createdAt: { gte: inicio.toDate(), lte: fim.toDate() }
          }
        }),
        prisma.order.groupBy({
          by: ['restaurantId'],
          where: { 
            OR: statusEntregue.map(status => ({ status })),
            data_criacao: { gte: inicio.toDate(), lte: fim.toDate() }
          },
          _sum: { total: true },
          orderBy: { _sum: { total: 'desc' } },
          take: 1
        })
      ]);

      const faturamento = faturamentoObj._sum.total || 0;
      const ticketMedio = pedidosEntregues > 0 ? faturamento / pedidosEntregues : 0;

      // Seção: Métricas Gerais
      doc.moveDown(2)
         .fontSize(18)
         .fillColor(colors.primary)
         .text('Métricas Gerais', { underline: false });

      // Grid de métricas
      const metricas = [
        [
          { label: 'Total de Vendas', valor: pedidosEntregues.toLocaleString('pt-BR') },
          { label: 'Faturamento Total', valor: formatarMoeda(faturamento) }
        ],
        [
          { label: 'Ticket Médio', valor: formatarMoeda(ticketMedio) },
          { label: 'Pedidos Cancelados', valor: pedidosCancelados.toLocaleString('pt-BR') }
        ],
        [
          { label: 'Total de Restaurantes', valor: restaurantes.toLocaleString('pt-BR') },
          { label: 'Total de Clientes', valor: clientes.toLocaleString('pt-BR') }
        ],
        [
          { label: 'Novos Clientes', valor: novosClientes.toLocaleString('pt-BR') },
          { label: 'Taxa de Conversão', valor: `${((pedidosEntregues / clientes * 100) || 0).toFixed(1)}%` }
        ]
      ];

      doc.moveDown();
      metricas.forEach((linha, i) => {
        doc.fontSize(12).fillColor(colors.text);
        
        // Calcular posições para grid de 2 colunas
        const colWidth = 247;
        const startX = 50;
        const startY = doc.y;

        linha.forEach((metrica, j) => {
          const x = startX + (j * colWidth);
          
          // Desenhar retângulo de fundo
          doc.save()
             .roundedRect(x, startY, colWidth - 10, 50, 5)
             .fillColor('#f8fafc')  // slate-50
             .fill()
             .restore();

          // Adicionar texto
          doc.fillColor(colors.subtext)
             .fontSize(10)
             .text(metrica.label, x + 10, startY + 10);
          
          doc.fillColor(colors.text)
             .fontSize(14)
             .text(metrica.valor, x + 10, startY + 25);
        });

        doc.moveDown(2);
      });

      // Linha divisória
      doc.moveTo(50, doc.y)
         .lineTo(545, doc.y)
         .strokeColor(colors.border)
         .stroke();

      // Top 5 Restaurantes
      if (topRestaurantes.length > 0) {
        doc.moveDown()
           .fontSize(18)
           .fillColor(colors.primary)
           .text('Top 5 Restaurantes por Faturamento', { underline: false });

        doc.moveDown();

        // Buscar nomes dos restaurantes
        const restaurantesDetalhes = await prisma.restaurant.findMany({
          where: { 
            id: { in: topRestaurantes.map(r => r.restaurantId) }
          },
          select: { id: true, nome: true }
        });

        // Cabeçalho da tabela
        doc.fontSize(10)
           .fillColor(colors.subtext)
           .text('Posição', 50, doc.y, { width: 50 })
           .text('Restaurante', 100, doc.y - 12, { width: 300 })
           .text('Faturamento', 400, doc.y - 12, { width: 100 });

        doc.moveTo(50, doc.y + 5)
           .lineTo(545, doc.y + 5)
           .strokeColor(colors.border)
           .stroke();

        doc.moveDown();

        // Lista de restaurantes
        for (const [index, restaurante] of topRestaurantes.entries()) {
          const detalhes = restaurantesDetalhes.find(r => r.id === restaurante.restaurantId);
          
          doc.fontSize(12)
             .fillColor(colors.text)
             .text(`${index + 1}º`, 50, doc.y, { width: 50 })
             .text(detalhes?.nome || 'Restaurante', 100, doc.y - 14, { width: 300 })
             .text(formatarMoeda(restaurante._sum.total || 0), 400, doc.y - 14, { width: 100 });
          
          doc.moveDown();
        }
      }

      // Adicionar rodapé
      const bottomOfPage = doc.page.height - 50;
      doc.fontSize(8)
         .fillColor(colors.subtext)
         .text('DeliveryX - Todos os direitos reservados', 50, bottomOfPage, { align: 'center' });

      // Finalizar o documento sem criar páginas extras
      doc.end();
      // Não usar resolve/reject aqui, Express lida com a resposta
    } catch (error) {
      console.error('[gerarRelatorioPDF] Erro ao gerar PDF:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Erro ao gerar PDF', details: error.message });
      }
    }
  },

  // NOVA ROTA: Listar todos os pedidos do sistema (admin)
  listAllOrders: async (req, res) => {
    try {
      const pageSize = 15;
      const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
      const skip = (page - 1) * pageSize;

      // NOVO: Filtro de datas
      let { dataInicio, dataFim } = req.query;
      let filtroData = {};
      if (dataInicio) {
        try {
          dataInicio = new Date(dataInicio);
          if (!isNaN(dataInicio.getTime())) filtroData.gte = dataInicio;
        } catch (e) {}
      }
      if (dataFim) {
        try {
          dataFim = new Date(dataFim);
          if (!isNaN(dataFim.getTime())) filtroData.lte = dataFim;
        } catch (e) {}
      }
      const filtroPedidos = Object.keys(filtroData).length > 0 ? { data_criacao: filtroData } : {};

      // Total de pedidos para paginação (com filtro de data)
      const totalPedidos = await prisma.order.count({ where: { ...filtroPedidos } });
      const totalPages = Math.ceil(totalPedidos / pageSize);

      // Buscar pedidos com dados relevantes (com filtro de data)
      const orders = await prisma.order.findMany({
        where: { ...filtroPedidos },
        include: {
          user: {
            select: { id: true, nome: true, email: true, telefone: true }
          },
          restaurant: {
            select: { id: true, nome: true, imagem: true }
          },
          orderItems: {
            include: {
              product: true,
              adicionais: {
                include: { adicional: true }
              }
            }
          },
          address: true
        },
        orderBy: { data_criacao: 'desc' },
        skip,
        take: pageSize
      });

      // Formatar resposta para o frontend admin
      const formattedOrders = orders.map(order => ({
        id: order.id,
        status: order.status,
        total: Number(order.total),
        data_criacao: order.data_criacao,
        usuario: order.user ? {
          id: order.user.id,
          nome: order.user.nome,
          email: order.user.email,
          telefone: order.user.telefone
        } : null,
        restaurant: order.restaurant ? {
          id: order.restaurant.id,
          nome: order.restaurant.nome,
          imagem: order.restaurant.imagem
        } : null,
        items: order.orderItems.map(item => ({
          id: item.id,
          quantidade: item.quantidade,
          nome: item.product?.nome || 'Produto',
          preco: item.product?.preco || 0,
          adicionais: item.adicionais.map(a => ({
            id: a.adicionalId,
            quantidade: a.quantidade,
            nome: a.adicional?.nome || 'Adicional',
            preco: a.adicional?.preco || 0
          }))
        })),
        taxa_entrega: Number(order.taxa_entrega),
        observacao: order.observacao,
        endereco: order.address || null,
        trocoPara: order.trocoPara || null, // <-- Adicionado trocoPara
      }));

      res.json({
        data: formattedOrders,
        pagination: {
          total: totalPedidos,
          page,
          pageSize,
          totalPages
        }
      });
    } catch (err) {
      console.error('[listAllOrders] Erro ao listar pedidos do admin:', err);
      res.status(500).json({ error: 'Erro ao listar pedidos do sistema', details: process.env.NODE_ENV === 'development' ? err.message : undefined });
    }
  },

  relatorioRestauranteAdmin: async (req, res) => {
    try {
      const { id } = req.params;
      let { dataInicio, dataFim } = req.query;
      const restaurantId = Number(id);
      if (!restaurantId) {
        return res.status(400).json({ error: 'ID do restaurante é obrigatório' });
      }
      // Arrays de status aceitando maiúsculo/minúsculo
      const statusEntregue = [
        'ENTREGUE', 'entregue', 'DELIVERED', 'delivered', 'COMPLETED', 'completed'
      ];
      const statusCancelado = [
        'CANCELADO', 'cancelado', 'CANCELED', 'canceled', 'CANCELLED', 'cancelled'
      ];
      // Filtro de datas
      let filtroData = {};
      if (dataInicio) {
        try {
          dataInicio = new Date(dataInicio);
          if (!isNaN(dataInicio.getTime())) filtroData.gte = dataInicio;
        } catch (e) {}
      }
      if (dataFim) {
        try {
          dataFim = new Date(dataFim);
          if (!isNaN(dataFim.getTime())) filtroData.lte = dataFim;
        } catch (e) {}
      }
      const filtroPedidos = Object.keys(filtroData).length > 0 ? { data_criacao: filtroData, restaurantId } : { restaurantId };
      // Pedidos entregues
      const pedidosEntregues = await prisma.order.count({
        where: {
          OR: statusEntregue.map(status => ({ status })),
          ...filtroPedidos
        }
      });
      const totalVendas = pedidosEntregues;
      // Total de pedidos
      const totalPedidos = await prisma.order.count({ where: { ...filtroPedidos } });
      // Faturamento (soma dos pedidos entregues)
      const faturamentoObj = await prisma.order.aggregate({
        _sum: { total: true },
        where: {
          OR: statusEntregue.map(status => ({ status })),
          ...filtroPedidos
        }
      });
      const faturamento = faturamentoObj._sum.total || 0;
      // Ticket médio
      const ticketMedio = totalVendas > 0 ? faturamento / totalVendas : 0;
      // Pedidos cancelados
      const pedidosCancelados = await prisma.order.count({
        where: {
          OR: statusCancelado.map(status => ({ status })),
          ...filtroPedidos
        }
      });
      // Restaurante info
      const restaurante = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
      // Produtos mais vendidos
      const produtosVendidos = await prisma.order.findMany({
        where: {
          OR: statusEntregue.map(status => ({ status })),
          ...filtroPedidos
        },
        include: {
          orderItems: {
            include: { product: true }
          }
        }
      });
      const produtosMaisVendidos = {};
      produtosVendidos.forEach(pedido => {
        pedido.orderItems.forEach(item => {
          const nome = item.product?.nome || 'Produto';
          produtosMaisVendidos[nome] = (produtosMaisVendidos[nome] || 0) + (item.quantidade || 0);
        });
      });
      const topProdutos = Object.entries(produtosMaisVendidos)
        .map(([nome, quantidade]) => ({ nome, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 5);
      // Buscar avaliações do restaurante
      const reviews = await prisma.review.findMany({
        where: { restaurantId },
        select: { nota: true }
      });
      const mediaAvaliacao = reviews.length > 0
        ? reviews.reduce((acc, r) => acc + (r.nota || 0), 0) / reviews.length
        : null;
      // Montar resposta
      res.json({
        restaurante: restaurante ? { id: restaurante.id, nome: restaurante.nome } : null,
        faturamento,
        totalVendas,
        ticketMedio,
        pedidosCancelados,
        produtosMaisVendidos: topProdutos,
        totalPedidos,
        mediaAvaliacao // novo campo
      });
    } catch (err) {
      console.error('[relatorioRestauranteAdmin] Erro ao gerar relatório individual:', err);
      res.status(500).json({ error: 'Erro ao gerar relatório do restaurante', details: err.message });
    }
  },

  getMaintenanceStatus: (req, res) => {
    res.json({ enabled: getMaintenance() });
  },
  enableMaintenance: (req, res) => {
    setMaintenance(true);
    res.json({ enabled: true });
  },
  disableMaintenance: (req, res) => {
    setMaintenance(false);
    res.json({ enabled: false });
  },
};
