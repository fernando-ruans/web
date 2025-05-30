const prisma = require('./prisma/prismaClient');

async function checkReviews() {
  try {
    console.log('=== VERIFICANDO DADOS DE REVIEW ===');
    
    // 1. Verificar se há reviews
    const reviews = await prisma.review.findMany({
      take: 3,
      include: {
        order: {
          select: {
            id: true,
            status: true
          }
        }
      }
    });
    console.log('Reviews encontrados:', reviews.length);
    reviews.forEach(r => console.log(`- Review ID ${r.id}: Nota ${r.nota}, Pedido #${r.orderId} (${r.order.status})`));
    
    // 2. Verificar pedidos entregues
    const pedidosEntregues = await prisma.order.findMany({
      where: {
        status: 'entregue'
      },
      take: 3,
      include: {
        review: true
      }
    });
    console.log('\nPedidos entregues:', pedidosEntregues.length);
    pedidosEntregues.forEach(p => {
      console.log(`- Pedido #${p.id}: Status ${p.status}, Review: ${p.review ? 'SIM' : 'NÃO'}`);
      if (p.review) {
        console.log(`  Nota: ${p.review.nota}, Comentário: ${p.review.comentario}`);
      }
    });
    
    // 3. Testar consulta específica como no lojistaController
    const pedidosComReview = await prisma.order.findMany({
      where: { 
        status: 'entregue'
      },
      include: {
        review: true,
        restaurant: {
          select: {
            userId: true
          }
        }
      },
      take: 5
    });
    
    console.log('\nConsulta tipo lojista controller:');
    pedidosComReview.forEach(p => {
      console.log(`- Pedido #${p.id}: Review ${p.review ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);
      if (p.review) {
        console.log(`  Review ID: ${p.review.id}, Nota: ${p.review.nota}`);
      }
    });
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkReviews();
