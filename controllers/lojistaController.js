// Exemplo de controller do lojista
const prisma = require('../prisma/prismaClient');

module.exports = {
  getProfile: async (req, res) => {
    try {
      const lojista = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          nome: true,
          email: true,
          tipo: true,
          telefone: true,
          cpf: true,
          endereco: true,
          avatarUrl: true,
          restaurants: true
        }
      });
      res.json(lojista);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
  },
  updateProfile: async (req, res) => {
    try {
      const { nome, avatarUrl, telefone, cpf, endereco } = req.body;
      
      // Prepara o objeto com os campos que foram enviados
      const data = {
        ...(nome && { nome }),
        ...(avatarUrl && { avatarUrl }),
        ...(telefone && { telefone }),
        ...(cpf && { cpf }),
        ...(endereco && { endereco })
      };

      // Atualiza apenas os campos fornecidos
      await prisma.user.update({ 
        where: { id: req.user.id }, 
        data 
      });

      // Retorna o perfil atualizado igual ao getProfile
      const lojista = await prisma.user.findUnique({
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
          restaurants: true
        }
      });
      res.json({ msg: 'Perfil atualizado!', user: lojista });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }
  },

  createRestaurant: async (req, res) => {
    try {
      const { nome, cnpj, cep, telefone, endereco, taxa_entrega, tempo_entrega, status, imagem, banner } = req.body;
      if (!nome || !endereco || !taxa_entrega || !tempo_entrega) {
        return res.status(400).json({ error: 'Dados obrigatórios faltando' });
      }
      const restaurante = await prisma.restaurant.create({
        data: {
          userId: req.user.id,
          nome,
          cnpj,
          cep,
          telefone,
          endereco,
          taxa_entrega: Number(taxa_entrega),
          tempo_entrega: Number(tempo_entrega),
          status: status || 'pendente',
          imagem: imagem || '',
          banner: banner || '/banner-default.png'
        }
      });
      res.status(201).json(restaurante);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao cadastrar restaurante' });
    }
  },

  listRestaurants: async (req, res) => {
    try {
      const restaurantes = await prisma.restaurant.findMany({
        where: { userId: req.user.id },
        include: { categories: true, orders: true, reviews: true }
      });
      res.json(restaurantes);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao listar restaurantes' });
    }
  },
  updateRestaurant: async (req, res) => {
    try {
      const { id } = req.params;
      const { nome, cnpj, cep, telefone, endereco, taxa_entrega, tempo_entrega, imagem, banner } = req.body;
      
      // Valida e converte os campos numéricos
      const taxaEntregaNum = taxa_entrega ? Number(taxa_entrega) : undefined;
      const tempoEntregaNum = tempo_entrega ? Number(tempo_entrega) : undefined;

      // Prepara o objeto de dados com campos opcionais
      const data = {
        ...(nome && { nome }),
        ...(cnpj && { cnpj }),
        ...(cep && { cep }),
        ...(telefone && { telefone }),
        ...(endereco && { endereco }),
        ...(taxaEntregaNum !== undefined && { taxa_entrega: taxaEntregaNum }),
        ...(tempoEntregaNum !== undefined && { tempo_entrega: tempoEntregaNum }),
        ...(imagem && { imagem }),
        ...(banner && { banner })
      };

      const restaurante = await prisma.restaurant.update({
        where: { id: Number(id), userId: req.user.id },
        data
      });
      res.json(restaurante);
    } catch (err) {
      console.error('Erro ao atualizar restaurante:', err);
      res.status(500).json({ error: 'Erro ao atualizar restaurante: ' + (err.message || 'Erro desconhecido') });
    }
  },

  deleteRestaurant: async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.restaurant.delete({ where: { id: Number(id), userId: req.user.id } });
      res.json({ msg: 'Restaurante excluído!' });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao excluir restaurante' });
    }
  },

  toggleRestaurantOpen: async (req, res) => {
    try {
      const { id } = req.params;
      const restaurante = await prisma.restaurant.findFirst({
        where: { id: Number(id), userId: req.user.id }
      });

      if (!restaurante) {
        return res.status(404).json({ error: 'Restaurante não encontrado' });
      }

      const restauranteAtualizado = await prisma.restaurant.update({
        where: { id: Number(id) },
        data: { aberto: !restaurante.aberto }
      });

      res.json(restauranteAtualizado);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao alterar status do restaurante' });
    }
  },

  listOrders: async (req, res) => {
    try {
      const pedidos = await prisma.order.findMany({
        where: { restaurant: { userId: req.user.id } },
        include: {
          user: true,
          orderItems: { include: { product: true } },
          address: true,
          review: true
        },
        orderBy: { data_criacao: 'desc' }
      });
      res.json(pedidos);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao listar pedidos' });
    }
  },

  updateOrderStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const pedido = await prisma.order.update({ where: { id: Number(id) }, data: { status } });
      res.json(pedido);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao atualizar status do pedido' });
    }
  },

  listReviews: async (req, res) => {
    try {
      const { page = 1, limit = 10, orderBy = 'id', order = 'desc', notaMin, notaMax } = req.query;
      const where = {
        restaurant: { userId: req.user.id },
        ...(notaMin && { nota: { gte: Number(notaMin) } }),
        ...(notaMax && { nota: { lte: Number(notaMax) } })
      };
      const total = await prisma.review.count({ where });
      const reviews = await prisma.review.findMany({
        where,
        include: { order: true },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { [orderBy]: order }
      });
      res.json({ total, page: Number(page), limit: Number(limit), data: reviews });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao listar avaliações' });
    }
  },

  createCategory: async (req, res) => {
    try {
      const { restaurantId, nome } = req.body;
      const categoria = await prisma.category.create({ data: { restaurantId, nome } });
      res.status(201).json(categoria);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao criar categoria' });
    }
  },

  updateCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const { nome } = req.body;
      const categoria = await prisma.category.update({ where: { id: Number(id) }, data: { nome } });
      res.json(categoria);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao atualizar categoria' });
    }
  },

  deleteCategory: async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.category.delete({ where: { id: Number(id) } });
      res.json({ msg: 'Categoria excluída!' });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao excluir categoria' });
    }
  },

  createProduct: async (req, res) => {
    try {
      console.log('Body recebido em createProduct:', req.body); // DEBUG
      let { categoryId, nome, descricao, preco, imagem, ativo } = req.body;
      // Validação básica
      if (
        categoryId === undefined || categoryId === null || categoryId === '' ||
        nome === undefined || nome === null || nome === '' ||
        descricao === undefined || descricao === null || descricao === '' ||
        preco === undefined || preco === null || preco === ''
      ) {
        console.error('Body inválido:', req.body); // LOG
        return res.status(400).json({ error: 'Campos obrigatórios faltando: categoryId, nome, descricao, preco', bodyRecebido: req.body });
      }
      const categoryIdNum = Number(categoryId);
      const precoNum = Number(preco);
      console.log('categoryId convertido:', categoryIdNum, 'preco convertido:', precoNum); // DEBUG
      if (isNaN(categoryIdNum) || isNaN(precoNum)) {
        return res.status(400).json({ error: 'categoryId e preco devem ser numéricos', bodyRecebido: req.body });
      }
      if (categoryIdNum <= 0) {
        return res.status(400).json({ error: 'categoryId deve ser maior que zero', bodyRecebido: req.body });
      }
      if (precoNum < 0) {
        return res.status(400).json({ error: 'preco não pode ser negativo', bodyRecebido: req.body });
      }
      const produto = await prisma.product.create({
        data: {
          categoryId: categoryIdNum,
          nome,
          descricao,
          preco: precoNum,
          imagem: imagem || '',
          ativo: ativo ?? true
        }
      });
      res.status(201).json(produto);
    } catch (err) {
      console.error('Erro ao criar produto:', err);
      res.status(500).json({ error: 'Erro ao criar produto' });
    }
  },

  updateProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const produto = await prisma.product.update({ where: { id: Number(id) }, data });
      res.json(produto);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao atualizar produto' });
    }
  },

  deleteProduct: async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.product.delete({ where: { id: Number(id) } });
      res.json({ msg: 'Produto excluído!' });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao excluir produto' });
    }
  },

  // Lista todos os produtos do lojista autenticado
  listProducts: async (req, res) => {
    try {
      // Busca todos os restaurantes do lojista
      const restaurantes = await prisma.restaurant.findMany({
        where: { userId: req.user.id },
        select: { id: true }
      });
      const restaurantesIds = restaurantes.map(r => r.id);
      // Busca todas as categorias desses restaurantes
      const categorias = await prisma.category.findMany({
        where: { restaurantId: { in: restaurantesIds } },
        select: { id: true }
      });
      const categoriasIds = categorias.map(c => c.id);
      // Busca todos os produtos dessas categorias
      const produtos = await prisma.product.findMany({
        where: { categoryId: { in: categoriasIds } },
        include: { category: { select: { nome: true, restaurantId: true } } }
      });
      res.json(produtos);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao listar produtos' });
    }
  },
  // Lista todas as categorias dos restaurantes do lojista autenticado
  listCategories: async (req, res) => {
    try {
      const restaurantes = await prisma.restaurant.findMany({
        where: { userId: req.user.id },
        select: { id: true, nome: true }
      });
      const restaurantesIds = restaurantes.map(r => r.id);
      const categorias = await prisma.category.findMany({
        where: { restaurantId: { in: restaurantesIds } },
        select: { id: true, nome: true, restaurantId: true }
      });
      res.json(categorias);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao listar categorias' });
    }  },

  // Obtém relatórios e estatísticas para um restaurante específico
  getRelatorioRestaurante: async (req, res) => {
    try {
      const { id } = req.params;
      const { inicio, fim } = req.query;
      const restauranteId = parseInt(id);
      
      // Converter datas se fornecidas
      let dataInicio, dataFim;
      if (inicio) {
        try {
          dataInicio = new Date(inicio);
        } catch (err) {
          console.error("Erro ao converter data início:", err);
        }
      }
      
      if (fim) {
        try {
          dataFim = new Date(fim);
        } catch (err) {
          console.error("Erro ao converter data fim:", err);
        }
      }

      // Verificar se o restaurante pertence ao lojista autenticado
      const restaurante = await prisma.restaurant.findFirst({
        where: { 
          id: restauranteId,
          userId: req.user.id
        }
      });

      if (!restaurante) {
        return res.status(404).json({ error: 'Restaurante não encontrado ou não pertence ao lojista autenticado' });
      }
        // Configurar filtros para a consulta
      const whereClause = {
        restaurantId: restauranteId
      };
      
      // Adicionar filtro de data se fornecido
      if (dataInicio && dataFim) {
        whereClause.data_criacao = {
          gte: dataInicio,
          lte: dataFim
        };
      }

      // Buscar todos os pedidos do restaurante com filtros
      const pedidos = await prisma.order.findMany({
        where: whereClause,
        include: { 
          orderItems: {
            include: { 
              product: {
                include: { 
                  category: true 
                } 
              } 
            } 
          },
          review: true
        }
      });// Log para debug
      console.log("Status dos pedidos:", pedidos.map(p => p.status));
      
      // Calcular métricas - usando valores diferentes de status
      const pedidosConcluidos = pedidos.filter(p => ['ENTREGUE', 'DELIVERED', 'COMPLETED'].includes(p.status.toUpperCase()));
      const pedidosCancelados = pedidos.filter(p => ['CANCELADO', 'CANCELLED', 'CANCELED'].includes(p.status.toUpperCase()));
      
      // Faturamento total
      const faturamentoTotal = pedidosConcluidos.reduce((acc, p) => acc + p.total, 0);
      
      // Ticket médio
      const ticketMedio = pedidosConcluidos.length > 0 
        ? faturamentoTotal / pedidosConcluidos.length 
        : 0;
        // Média de avaliação
      const avaliacoes = pedidos
        .filter(p => p.review && typeof p.review.nota === 'number' && p.review.nota > 0)
        .map(p => p.review.nota);
      
      const mediaAvaliacao = avaliacoes.length > 0 
        ? avaliacoes.reduce((acc, nota) => acc + nota, 0) / avaliacoes.length 
        : 0;
        // Contagem de produtos vendidos
      const produtosVendidos = {};
      pedidosConcluidos.forEach(pedido => {
        if (pedido.orderItems && Array.isArray(pedido.orderItems)) {
          pedido.orderItems.forEach(item => {
            if (item.product) {
              const produtoNome = item.product.nome || 'Produto sem nome';
              if (!produtosVendidos[produtoNome]) {
                produtosVendidos[produtoNome] = 0;
              }
              produtosVendidos[produtoNome] += item.quantidade || 0;
            }
          });
        }
      });
      
      // Produtos mais vendidos (top 5)
      const produtosMaisVendidos = Object.entries(produtosVendidos)
        .map(([nome, quantidade]) => ({ nome, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 5);
        // Faturamento por categoria
      const faturamentoPorCategoria = {};
      pedidosConcluidos.forEach(pedido => {
        if (pedido.orderItems && Array.isArray(pedido.orderItems)) {
          pedido.orderItems.forEach(item => {
            if (item.product && item.product.category) {
              const categoria = item.product.category.nome || 'Sem categoria';
              const valorItem = (item.quantidade || 0) * (item.preco_unitario || 0);
              
              if (!faturamentoPorCategoria[categoria]) {
                faturamentoPorCategoria[categoria] = 0;
              }
              faturamentoPorCategoria[categoria] += valorItem;
            }
          });
        }
      });
      
      // Converter para array e ordenar por valor
      const faturamentoPorCategoriaArray = Object.entries(faturamentoPorCategoria)
        .map(([categoria, valor]) => ({ categoria, valor }))
        .sort((a, b) => b.valor - a.valor);
        // Criar array de pedidos dos últimos 7 dias
      const hoje = new Date();
      const ultimos7Dias = Array(7).fill(0);
      
      pedidosConcluidos.forEach(pedido => {
        try {
          if (pedido.data_criacao) {
            const dataPedido = new Date(pedido.data_criacao);
            if (!isNaN(dataPedido.getTime())) {
              const diferencaDias = Math.floor((hoje - dataPedido) / (1000 * 60 * 60 * 24));
              
              if (diferencaDias >= 0 && diferencaDias < 7) {
                ultimos7Dias[6 - diferencaDias]++;
              }
            }
          }
        } catch (error) {
          console.error("Erro ao processar data do pedido:", error);
        }
      });
        // Calcular dias da semana mais movimentados
      const diasDaSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const pedidosPorDiaDaSemana = [0, 0, 0, 0, 0, 0, 0]; // Um contador para cada dia
      
      pedidosConcluidos.forEach(pedido => {
        try {
          if (pedido.data_criacao) {
            const dataPedido = new Date(pedido.data_criacao);
            if (!isNaN(dataPedido.getTime())) {
              const diaDaSemana = dataPedido.getDay(); // 0 = Domingo, 1 = Segunda, etc.
              if (diaDaSemana >= 0 && diaDaSemana < 7) {
                pedidosPorDiaDaSemana[diaDaSemana]++;
              }
            }
          }
        } catch (error) {
          console.error("Erro ao processar dia da semana do pedido:", error);
        }
      });
      
      const diasMaisMovimentados = diasDaSemana.map((dia, index) => ({
        dia,
        pedidos: pedidosPorDiaDaSemana[index]
      })).sort((a, b) => b.pedidos - a.pedidos);
      
      // Calcular novos clientes no último mês
      const umMesAtras = new Date();
      umMesAtras.setMonth(umMesAtras.getMonth() - 1);
      
      // Como não temos acesso à data de cadastro de cliente diretamente, 
      // vamos usar a data do primeiro pedido como proxy
      const clientesPorId = {};
      pedidos.forEach(pedido => {
        const clienteId = pedido.userId;
        const dataPedido = new Date(pedido.data_criacao);
        
        if (!clientesPorId[clienteId] || dataPedido < clientesPorId[clienteId]) {
          clientesPorId[clienteId] = dataPedido;
        }
      });
      
      const clientesNovos = Object.values(clientesPorId)
        .filter(data => data >= umMesAtras)
        .length;
        // Garantir que temos dados para exibir mesmo que não haja pedidos
      const produtosMaisVendidosData = produtosMaisVendidos.length > 0 ? 
        produtosMaisVendidos : 
        [{ nome: 'Sem dados', quantidade: 0 }];

      const faturamentoPorCategoriaData = faturamentoPorCategoriaArray.length > 0 ?
        faturamentoPorCategoriaArray :
        [{ categoria: 'Sem dados', valor: 0 }];

      const diasMaisMovimentadosData = diasMaisMovimentados.length > 0 ?
        diasMaisMovimentados :
        diasDaSemana.map(dia => ({ dia, pedidos: 0 }));
        
      // Montar objeto de resposta
      const relatorio = {
        faturamentoTotal: faturamentoTotal || 0,
        totalVendas: pedidosConcluidos.length,
        mediaAvaliacao: mediaAvaliacao || 0,
        pedidosCancelados: pedidosCancelados.length,
        ticketMedio: ticketMedio || 0,
        clientesNovos: clientesNovos || 0,
        pedidosUltimos7Dias: ultimos7Dias,
        faturamentoPorCategoria: faturamentoPorCategoriaData,
        produtosMaisVendidos: produtosMaisVendidosData,
        diasMaisMovimentados: diasMaisMovimentadosData
      };
      
      res.json(relatorio);    } catch (err) {
      console.error('Erro ao gerar relatório:', err);
      console.error('Stack trace:', err.stack);
      res.status(500).json({ error: 'Erro ao gerar relatório: ' + err.message });
    }
  },

  // CRUD de Adicionais para produtos
  createAdicional: async (req, res) => {
    try {
      const { productId, nome, preco, quantidadeMax } = req.body;
      if (!productId || !nome || preco === undefined || quantidadeMax === undefined) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando' });
      }
      const adicional = await prisma.adicional.create({
        data: { productId: Number(productId), nome, preco: Number(preco), quantidadeMax: Number(quantidadeMax) }
      });
      res.status(201).json(adicional);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao criar adicional' });
    }
  },

  listAdicionais: async (req, res) => {
    try {
      const { productId } = req.query;
      if (!productId) return res.status(400).json({ error: 'productId é obrigatório' });
      const adicionais = await prisma.adicional.findMany({ where: { productId: Number(productId) } });
      res.json(adicionais);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao listar adicionais' });
    }
  },

  updateAdicional: async (req, res) => {
    try {
      const { id } = req.params;
      const { nome, preco, quantidadeMax } = req.body;
      const adicional = await prisma.adicional.update({
        where: { id: Number(id) },
        data: { nome, preco: Number(preco), quantidadeMax: Number(quantidadeMax) }
      });
      res.json(adicional);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao atualizar adicional' });
    }
  },

  deleteAdicional: async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.adicional.delete({ where: { id: Number(id) } });
      res.json({ msg: 'Adicional excluído!' });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao excluir adicional' });
    }
  },
};
