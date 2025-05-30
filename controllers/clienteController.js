const prisma = require('../prisma/prismaClient');

const formatarCEP = (cep) => {
  if (!cep) return '';
  
  // Garante que estamos trabalhando com uma string
  const cepStr = String(cep);
  
  // Limpa todos os caracteres não numéricos
  const cepNumeros = cepStr.replace(/\D/g, '');
  
  // Se o CEP tiver menos de 8 dígitos, retorna vazio
  if (cepNumeros.length < 8) return '';
  
  // Pega apenas os primeiros 8 dígitos caso tenha mais
  const cepOito = cepNumeros.substring(0, 8);
  
  // Formata o CEP no padrão 00000-000
  return cepOito.replace(/(\d{5})(\d{3})/, '$1-$2');
};

const formatarEndereco = (address) => {
  if (!address) return null;
  
  // Garante que todos os campos obrigatórios existem
  if (!address.rua || !address.numero || !address.bairro || !address.cidade || !address.estado || !address.cep) {
    return null;
  }

  // Valida e formata o CEP usando a função formatarCEP
  const cep = formatarCEP(address.cep);
  
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
      
      // Logging para debug
      console.log('Perfil recuperado com endereços:', 
                 cliente?.addresses ? `${cliente.addresses.length} endereços encontrados` : 'Sem endereços');

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
      console.log('Endereço recebido:', JSON.stringify(address));

      // Validação dos dados do usuário
      const updateData = {
        ...(nome?.trim() && { nome: nome.trim() }),
        ...(avatarUrl?.trim() && { avatarUrl: avatarUrl.trim() }),
        ...(telefone?.trim() && { telefone: telefone.trim() })
      };

      // Verificação e validação dos dados de endereço
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
        console.log('Iniciando transação para atualizar perfil e endereço');
        
        // Variável para armazenar o endereço formatado em string para o campo endereco
        let addressStr = existingUser.endereco;
        let userAddress = null;
        
        // Manipula o endereço primeiro, se foi fornecido
        if (address && addressData) {
          console.log('Processando dados de endereço:', addressData);
          
          // Formata o endereço como string para o campo endereco legado
          addressStr = formatarEndereco(addressData);
          
          try {
            // Verifica se o usuário já possui um endereço
            const userAddresses = await tx.address.findMany({
              where: { userId: req.user.id }
            });
            
            console.log(`Endereços existentes encontrados: ${userAddresses.length}`);
            
            // Upsert: atualiza se existir, cria se não existir
            if (userAddresses && userAddresses.length > 0) {
              console.log('Atualizando endereço existente:', userAddresses[0].id);
              userAddress = await tx.address.update({
                where: { id: userAddresses[0].id },
                data: addressData
              });
              console.log('Endereço atualizado com sucesso:', userAddress);
            } else {
              console.log('Criando novo endereço para o usuário:', req.user.id);
              userAddress = await tx.address.create({
                data: {
                  userId: req.user.id,
                  ...addressData
                }
              });
              console.log('Novo endereço criado com sucesso:', userAddress);
            }
          } catch (error) {
            console.error('ERRO ao processar endereço:', error);
            throw error;
          }
        }
        
        // Atualização do usuário
        console.log('Atualizando dados do usuário');
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
        
        console.log('Usuário atualizado com sucesso');
        
        // Criar o objeto de retorno completo
        const result = {
          ...updatedUser,
          addresses: userAddress ? [userAddress] : []
        };
        
        return result;

        // O retorno é construído diretamente (veja o bloco anterior)
      });

      if (!result) {
        throw new Error("Usuário não encontrado após atualização");
      }

      console.log('Perfil atualizado:', result);
      console.log('Chaves do objeto result:', Object.keys(result));
      
      // Verifica se os endereços estão no resultado
      if (!result.addresses || result.addresses.length === 0) {
        console.log('Endereços não encontrados no resultado da transação. Buscando novamente...');
        
        // Busca os endereços atualizados diretamente
        const addresses = await prisma.address.findMany({
          where: { userId: req.user.id }
        });
        
        console.log('Endereços encontrados após busca adicional:', addresses);
        
        if (addresses.length > 0) {
          console.log('Adicionando endereços ao resultado:', addresses);
          result.addresses = addresses;
        } else if (addressData) {
          console.warn('Nenhum endereço encontrado! Tentando criar como último recurso...');
          
          try {
            const newAddress = await prisma.address.create({
              data: {
                userId: req.user.id,
                ...addressData
              }
            });
            
            result.addresses = [newAddress];
            console.log('Novo endereço criado e adicionado ao resultado:', newAddress);
          } catch (error) {
            console.error('Erro ao criar endereço como último recurso:', error);
          }
        }
      }
      
      // Log final antes de enviar resposta
      console.log('Resposta final:', {
        msg: "Perfil atualizado com sucesso!",
        user: {
          ...result,
          addresses: result.addresses || []
        }
      });

      res.json({
        msg: "Perfil atualizado com sucesso!",
        user: {
          ...result,
          addresses: result.addresses || []
        }
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

      // Limpa o CEP recebido
      const cepNumeros = cep ? cep.replace(/\D/g, '') : '';
      
      // Valida se tem 8 dígitos
      if (cepNumeros.length !== 8) {
        return res.status(400).json({ error: "CEP inválido. Deve conter 8 dígitos numéricos." });
      }
      
      // Formata o CEP
      const cepFormatado = formatarCEP(cepNumeros);
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
        const cepNumeros = cep.replace(/\D/g, '');
        if (cepNumeros.length !== 8) {
          return res.status(400).json({ error: "CEP inválido. Deve conter 8 dígitos numéricos." });
        }
        
        cepFormatado = formatarCEP(cepNumeros);
        if (!cepFormatado.match(/^\d{5}-\d{3}$/)) {
          return res.status(400).json({ error: "Erro ao formatar CEP." });
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
        console.log('[createOrder] Falha na autenticação');
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      // Loga o body recebido para debug
      console.log('[createOrder] Body recebido:', req.body);

      const { restaurantId, addressId, observacao, items, formaPagamento, trocoPara } = req.body;

      // Validar se o restaurante existe
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId }
      });

      if (!restaurant) {
        console.log('[createOrder] Restaurante não encontrado:', restaurantId);
        return res.status(404).json({ error: "Restaurante não encontrado" });
      }

      // Validar se o endereço pertence ao usuário
      const address = await prisma.address.findUnique({
        where: { id: addressId }
      });

      if (!address || address.userId !== req.user.id) {
        console.log('[createOrder] Endereço não encontrado ou não pertence ao usuário:', addressId);
        return res.status(404).json({ error: "Endereço não encontrado" });
      }

      // Validação dos itens
      if (!items || !Array.isArray(items) || items.length === 0) {
        console.log('[createOrder][ERRO] Itens do pedido ausentes ou inválidos:', items);
        return res.status(400).json({ error: "Itens do pedido ausentes ou inválidos" });
      }

      // Validação da forma de pagamento
      if (!formaPagamento || typeof formaPagamento !== 'string') {
        console.log('[createOrder][ERRO] Forma de pagamento ausente ou inválida:', formaPagamento);
        return res.status(400).json({ error: "Forma de pagamento ausente ou inválida" });
      }

      // LOG DETALHADO DOS ITENS E ADICIONAIS
      for (const [idx, item] of items.entries()) {
        if (!item.productId || !item.quantidade || !item.preco_unitario) {
          console.log(`[createOrder][ERRO] Item do pedido inválido no índice ${idx}:`, item);
          return res.status(400).json({ error: `Item do pedido inválido no índice ${idx}` });
        }
        if (item.adicionais && Array.isArray(item.adicionais)) {
          for (const [aidx, adicional] of item.adicionais.entries()) {
            if (!adicional.adicionalId || adicional.quantidade == null || adicional.preco == null) {
              console.log(`[createOrder][ERRO] Adicional inválido no item ${idx}, adicional ${aidx}:`, adicional);
              return res.status(400).json({ error: `Adicional inválido no item ${idx}, adicional ${aidx}` });
            }
          }
        }
      }

      // Calcular total do pedido (produtos + adicionais + taxa de entrega)
      let subtotal = 0;
      for (const item of items) {
        let adicionaisTotal = 0;
        if (item.adicionais && Array.isArray(item.adicionais)) {
          adicionaisTotal = item.adicionais.reduce((acc, adicional) => acc + (adicional.preco * adicional.quantidade), 0);
        }
        subtotal += (item.preco_unitario * item.quantidade) + adicionaisTotal;
      }
      const taxaEntrega = restaurant.taxa_entrega || 0;
      const total = subtotal + taxaEntrega;

      // Criar o pedido em uma transação
      try {
        const order = await prisma.$transaction(async (tx) => {
          // Loga o objeto enviado ao Prisma
          const prismaOrderData = {
            userId: req.user.id,
            restaurantId,
            addressId,
            observacao: observacao || null,
            status: 'PENDING',
            total: Number(total),
            taxa_entrega: taxaEntrega,
            formaPagamento: formaPagamento || null,
            trocoPara: trocoPara !== undefined ? Number(trocoPara) : null,
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
          };
          console.log('[createOrder][PRISMA] Dados enviados para criação do pedido:', JSON.stringify(prismaOrderData, null, 2));
          // Criar o pedido
          const order = await tx.order.create({
            data: prismaOrderData,
            include: {
              orderItems: {
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
        // --- INÍCIO: Envio de atualização em tempo real para o lojista ---
        try {
          const sendWebSocketUpdate = req.app.get('sendWebSocketUpdate');
          if (sendWebSocketUpdate) {
            // Buscar restaurante do pedido
            const restaurante = await prisma.restaurant.findUnique({ where: { id: order.restaurantId } });
            if (restaurante && restaurante.userId) {
              // Buscar pedidos ativos do restaurante
              const pedidos = await prisma.order.findMany({
                where: { restaurantId: order.restaurantId },
                include: {
                  user: { select: { id: true, nome: true, email: true, telefone: true } },
                  restaurant: { select: { taxa_entrega: true } },                  orderItems: {
                    include: {
                      product: { select: { id: true, nome: true, preco: true } },
                      adicionais: { include: { adicional: true } }
                    }
                  },
                  address: true, // <-- Incluir endereço de entrega
                  review: true
                },
                orderBy: { data_criacao: 'desc' }
              });
              // Formatar pedidos igual ao controller do lojista
              const formattedOrders = pedidos.map(order => ({
                id: order.id,
                status: (order.status || '').toLowerCase(),
                createdAt: order.data_criacao,
                taxa_entrega: order.restaurant?.taxa_entrega || 0,
                formaPagamento: order.formaPagamento || null,
                trocoPara: order.trocoPara || null,
                observacao: order.observacao,
                usuario: {
                  id: order.user.id,
                  nome: order.user.nome,
                  email: order.user.email,
                  telefone: order.user.telefone
                },
                items: order.orderItems.map(item => ({
                  id: item.id,
                  quantidade: item.quantidade,
                  produto: item.product,
                  adicionais: item.adicionais.map(a => ({
                    id: a.adicional.id,
                    nome: a.adicional.nome,
                    preco: a.adicional.preco,
                    quantidade: a.quantidade
                  }))                })),
                endereco: order.address ? {
                  id: order.address.id,
                  rua: order.address.rua,
                  numero: order.address.numero,
                  bairro: order.address.bairro,
                  cidade: order.address.cidade,
                  estado: order.address.estado,
                  complemento: order.address.complemento,
                  cep: order.address.cep
                } : null, // <-- Incluir endereço de entrega
                review: order.review ? {
                  nota: order.review.nota,
                  comentario: order.review.comentario
                } : undefined
              }));
              // Enviar para o lojista responsável
              sendWebSocketUpdate(restaurante.userId, 'pedidos', formattedOrders);
            }
          }
        } catch (err) {
          console.error('[createOrder][WebSocket] Erro ao enviar atualização para lojista:', err);
        }
        // --- FIM: Envio de atualização em tempo real para o lojista ---
        res.status(201).json(order);
      } catch (errTx) {
        console.error('[createOrder] Erro PRISMA transação:', errTx);
        if (errTx.stack) console.error('[createOrder] Stack trace:', errTx.stack);
        if (errTx.code === 'P2003') {
          return res.status(400).json({ error: 'Produto ou adicional não encontrado (chave estrangeira inválida)' });
        }
        return res.status(500).json({ error: 'Erro ao criar pedido (transação)', details: errTx.message });
      }
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
      console.log('[createReview] Início da função');
      console.log('[createReview] req.user:', req.user);
      console.log('[createReview] req.body:', req.body);
      
      if (!req.user?.id) {
        console.log('[createReview] Usuário não autenticado');
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const { orderId, nota, comentario } = req.body;
      console.log('[createReview] Dados extraídos:', { orderId, nota, comentario });

      // Verificar se o pedido existe e pertence ao usuário
      const order = await prisma.order.findUnique({
        where: { id: orderId }
      });

      console.log('[createReview] Pedido encontrado:', order);

      if (!order) {
        console.log('[createReview] Pedido não encontrado');
        return res.status(404).json({ error: "Pedido não encontrado" });
      }

      if (order.userId !== req.user.id) {
        console.log('[createReview] Sem permissão - userId:', order.userId, 'req.user.id:', req.user.id);
        return res.status(403).json({ error: "Sem permissão para avaliar este pedido" });
      }

      // Verificar se já existe uma avaliação para este pedido
      const existingReview = await prisma.review.findFirst({
        where: { orderId }
      });

      console.log('[createReview] Avaliação existente:', existingReview);

      if (existingReview) {
        console.log('[createReview] Pedido já foi avaliado');
        return res.status(400).json({ error: "Este pedido já foi avaliado" });
      }

      // Criar a avaliação
      console.log('[createReview] Criando avaliação...');
      const review = await prisma.review.create({
        data: {
          orderId,
          restaurantId: order.restaurantId,
          nota,
          comentario
        },
        // Não há relação direta com user, então não inclui user
      });

      console.log('[createReview] Avaliação criada com sucesso:', review);
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
          horario_funcionamento: true, // <-- Adicionado aqui
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

      // Calcular média das avaliações e garantir parse do horario_funcionamento
      const restaurantsWithRating = restaurants.map(restaurant => {
        const avgRating = restaurant.reviews.length > 0
          ? restaurant.reviews.reduce((acc, review) => acc + review.nota, 0) / restaurant.reviews.length
          : null;

        const { reviews, ...rest } = restaurant;
        return {
          ...rest,
          horario_funcionamento: restaurant.horario_funcionamento
            ? (typeof restaurant.horario_funcionamento === 'object'
                ? restaurant.horario_funcionamento
                : JSON.parse(restaurant.horario_funcionamento))
            : null,
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

      console.log(`[getRestaurant] Parâmetro recebido id:`, id);

      if (!id || isNaN(Number(id))) {
        console.warn(`[getRestaurant] ID inválido recebido:`, id);
        return res.status(400).json({ error: "ID do restaurante inválido" });
      }

      const restaurant = await prisma.restaurant.findUnique({
        where: { 
          id: Number(id)
        }
        // Removido include de categorias, produtos, reviews, etc. para evitar erro
      });

      console.log(`[getRestaurant] Resultado do findUnique:`, restaurant);

      if (!restaurant) {
        console.warn(`[getRestaurant] Restaurante não encontrado para id:`, id);
        return res.status(404).json({ error: "Restaurante não encontrado" });
      }

      // Log dos campos principais
      console.log(`[getRestaurant] Campos principais extraídos:`, {
        id: restaurant.id,
        nome: restaurant.nome,
        taxa_entrega: restaurant.taxa_entrega,
        tempo_entrega: restaurant.tempo_entrega,
        status: restaurant.status,
        telefone: restaurant.telefone,
        aberto: restaurant.aberto,
        cep: restaurant.cep
      });

      // Retornar apenas os campos principais para o checkout
      res.json({
        id: restaurant.id,
        nome: restaurant.nome,
        taxa_entrega: restaurant.taxa_entrega,
        tempo_entrega: restaurant.tempo_entrega,
        status: restaurant.status,
        telefone: restaurant.telefone,
        aberto: restaurant.aberto,
        cep: restaurant.cep
      });
      // ...não retorna categorias, produtos, reviews, etc...
    } catch (err) {
      console.error("[getRestaurant] Erro ao buscar restaurante:", err);
      if (err instanceof Error) {
        console.error("[getRestaurant] Stack trace:", err.stack);
      }
      res.status(500).json({ 
        error: "Erro ao buscar restaurante",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },

  getRestaurantMenu: async (req, res) => {
    try {
      const { id } = req.params;
      const restaurantId = parseInt(id);

      console.log('[getRestaurantMenu] Iniciando busca - ID:', restaurantId);

      if (!restaurantId) {
        return res.status(400).json({ error: 'ID do restaurante inválido' });
      }

      // Primeiro busca apenas o restaurante
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId }
      });

      console.log('[getRestaurantMenu] Restaurante encontrado:', restaurant);

      if (!restaurant) {
        return res.status(404).json({ error: 'Restaurante não encontrado' });
      }

      // Depois busca as categorias
      const categories = await prisma.category.findMany({
        where: { 
          restaurantId: restaurantId 
        }
      });

      console.log('[getRestaurantMenu] Categorias encontradas:', categories);

      // Por fim, busca os produtos de cada categoria
      const menuData = [];
      for (const category of categories) {
        const products = await prisma.product.findMany({
          where: { 
            categoryId: category.id,
            ativo: true 
          },
          include: {
            adicionais: true
          }
        });

        console.log(`[getRestaurantMenu] Produtos da categoria ${category.nome}:`, products);

        if (products.length > 0) {
          menuData.push({
            id: category.id,
            nome: category.nome,
            produtos: products
          });
        }
      }

      console.log('[getRestaurantMenu] Menu completo montado:', {
        numCategorias: menuData.length,
        categorias: menuData.map(c => ({
          nome: c.nome,
          numProdutos: c.produtos.length
        }))
      });

      // Remove campos sensíveis do restaurante antes de enviar
      const { userId, ...restaurantInfo } = restaurant;
      // Garante que horario_funcionamento seja sempre um objeto ou null
      restaurantInfo.horario_funcionamento = restaurant.horario_funcionamento
        ? (typeof restaurant.horario_funcionamento === 'object' ? restaurant.horario_funcionamento : JSON.parse(restaurant.horario_funcionamento))
        : null;

      res.json({
        data: menuData,
        restaurant: restaurantInfo
      });
    } catch (error) {
      console.error('[getRestaurantMenu] Erro detalhado:', error);
      console.error('[getRestaurantMenu] Stack trace:', error.stack);
      res.status(500).json({ 
        error: 'Erro ao buscar menu do restaurante',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },

  listOrders: async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      // Paginação
      const pageSize = 15;
      const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
      const skip = (page - 1) * pageSize;

      // Total de pedidos para paginação
      const totalPedidos = await prisma.order.count({
        where: { userId: req.user.id }
      });
      const totalPages = Math.ceil(totalPedidos / pageSize);

      const orders = await prisma.order.findMany({
        where: { 
          userId: req.user.id 
        },
        include: {
          restaurant: {
            select: {
              id: true,
              nome: true,
              imagem: true // usando imagem ao invés de logoUrl
            }
          },
          orderItems: { // usando orderItems ao invés de items
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
          data_criacao: 'desc' // usando data_criacao ao invés de createdAt
        },
        skip,
        take: pageSize
      });

      // Formatar a resposta para garantir compatibilidade
      const formattedOrders = orders.map(order => {
        // Normaliza status para minúsculo e sem underscores
        let status = (order.status || '').toLowerCase();
        if (status === 'em_entrega' || status === 'em-entrega') status = 'em entrega';
        if (status === 'em preparo' || status === 'em_preparo' || status === 'em-preparo') status = 'em preparo';
        if (status === 'em rota' || status === 'em_rota' || status === 'em-rota') status = 'em entrega';
        // Mantém os demais status como estão
        return {
          id: order.id,
          status,
          total: Number(order.total),
          data_criacao: order.data_criacao,
          taxa_entrega: order.taxa_entrega,
          observacao: order.observacao,
          formaPagamento: order.formaPagamento || null,
          trocoPara: order.trocoPara || null,
          restaurant: {
            nome: order.restaurant?.nome,
            imagem: order.restaurant?.imagem
          },
          items: order.orderItems.map(item => ({
            quantidade: item.quantidade,
            product: item.product,
            adicionais: item.adicionais.map(a => ({
              quantidade: a.quantidade,
              adicional: a.adicional
            }))
          }))
        };
      });

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
          restaurant: {
            select: {
              id: true,
              nome: true,
              imagem: true,
              telefone: true,
              endereco: true,
              horario_funcionamento: true
            }
          },
          orderItems: {
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
          review: true
        }
      });

      if (!order) {
        return res.status(404).json({ error: "Pedido não encontrado" });
      }

      if (order.userId !== req.user.id) {
        return res.status(403).json({ error: "Sem permissão para acessar este pedido" });
      }

      // Verificar se o endereço existe
      if (!order.address) {
        return res.status(500).json({ error: "Endereço do pedido não encontrado" });
      }

      // Calcular o total do pedido
      let subtotal = 0;
      const items = order.orderItems.map(item => {
        // Calcular o total dos adicionais
        const adicionalTotal = item.adicionais.reduce((acc, adicional) => {
          return acc + (adicional.quantidade * adicional.adicional.preco);
        }, 0);

        // Calcular o total do item
        const itemTotal = (item.quantidade * item.product.preco) + adicionalTotal;
        subtotal += itemTotal;

        // Formatar o item
        return {
          id: item.id,
          quantidade: item.quantidade,
          nome: item.product.nome,
          preco: item.product.preco,
          adicionais: item.adicionais.map(a => ({
            id: a.adicionalId,
            quantidade: a.quantidade,
            nome: a.adicional.nome,
            preco: a.adicional.preco
          }))
        };
      });

      // Formatar a resposta mantendo a consistência
      let status = (order.status || '').toLowerCase();
      if (status === 'entregue') status = 'Entregue';
      else if (status === 'em entrega') status = 'Em Entrega';
      else if (status === 'em preparo') status = 'Em Preparo';      else if (status === 'pendente') status = 'Pendente';
      else if (status === 'cancelado') status = 'Cancelado';
      else status = order.status; // fallback para status original
      
      const formattedOrder = {
        id: order.id,
        status,
        data_criacao: order.data_criacao,
        total: Number(order.total), // Usa o valor salvo no pedido
        taxa_entrega: Number(order.taxa_entrega), // Usa o valor salvo no pedido
        observacao: order.observacao,
        formaPagamento: order.formaPagamento || null,
        trocoPara: order.trocoPara || null,
        items: items, // ADICIONADO: incluir os itens formatados na resposta
        restaurant: {
          ...order.restaurant,
          horario_funcionamento: order.restaurant?.horario_funcionamento
            ? (typeof order.restaurant.horario_funcionamento === 'object'
                ? order.restaurant.horario_funcionamento
                : JSON.parse(order.restaurant.horario_funcionamento))
            : null
        },
        endereco: {
          id: order.address.id,
          rua: order.address.rua,
          numero: order.address.numero,
          bairro: order.address.bairro,
          cidade: order.address.cidade,
          estado: order.address.estado,
          complemento: order.address.complemento,
          cep: order.address.cep
        },
        review: order.review ? {
          nota: order.review.nota,
          comentario: order.review.comentario
        } : undefined
      };

      res.json(formattedOrder);
    } catch (err) {
      console.error("[getOrder] Erro ao buscar pedido:", err);
      res.status(500).json({ 
        error: "Erro ao buscar pedido",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }
};
