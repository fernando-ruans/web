const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testReviewsInOrders() {
  try {
    console.log('🔍 Testando inclusão de avaliações nos pedidos...\n');

    // 1. Buscar pedidos com avaliações via controller (simulando a API)
    const pedidosComAvaliacao = await prisma.order.findMany({
      where: {
        review: {
          isNot: null
        }
      },
      include: {
        user: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true
          }
        },
        restaurant: {
          select: {
            id: true,
            nome: true,
            taxa_entrega: true,
            telefone: true
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
      },
      orderBy: { data_criacao: 'desc' }
    });

    console.log(`📊 Total de pedidos com avaliação: ${pedidosComAvaliacao.length}\n`);

    // 2. Formatar os pedidos como o controller faz
    const formattedOrders = pedidosComAvaliacao.map(order => ({
      id: order.id,
      status: order.status.toLowerCase(),
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
        }))
      })),
      endereco: order.address ? {
        id: order.address.id,
        rua: order.address.rua,
        numero: order.address.numero,
        bairro: order.address.bairro,
        cidade: order.address.cidade,
        estado: order.address.estado,
        complemento: order.address.complemento,
        cep: order.address.cep
      } : null,
      review: order.review ? {
        nota: order.review.nota,
        comentario: order.review.comentario
      } : undefined
    }));

    // 3. Exibir resultados
    formattedOrders.forEach(pedido => {
      console.log(`🛍️ Pedido #${pedido.id}`);
      console.log(`   Cliente: ${pedido.usuario.nome}`);
      console.log(`   Status: ${pedido.status}`);
      if (pedido.review) {
        console.log(`   ⭐ Avaliação: ${pedido.review.nota}/5 estrelas`);
        if (pedido.review.comentario) {
          console.log(`   💬 Comentário: "${pedido.review.comentario}"`);
        }
      } else {
        console.log(`   ❌ Avaliação: NÃO ENCONTRADA (Problema!)`);
      }
      console.log('');
    });

    // 4. Teste de um pedido específico para ver estrutura completa
    if (formattedOrders.length > 0) {
      console.log('📋 Estrutura completa do primeiro pedido:');
      console.log(JSON.stringify(formattedOrders[0], null, 2));
    }

  } catch (err) {
    console.error('❌ Erro no teste:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testReviewsInOrders();
