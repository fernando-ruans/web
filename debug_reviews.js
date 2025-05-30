const { PrismaClient } = require('@prisma/client');

async function checkReviewData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verificando dados de avaliações no banco...');
    
    // Contar total de reviews
    const totalReviews = await prisma.review.count();
    console.log(`📊 Total de reviews no banco: ${totalReviews}`);
    
    if (totalReviews > 0) {
      // Buscar algumas reviews de exemplo
      const sampleReviews = await prisma.review.findMany({
        take: 5,
        include: {
          order: {
            include: {
              restaurant: {
                select: {
                  id: true,
                  nome: true
                }
              }
            }
          }
        }
      });
      
      console.log('\n📝 Exemplos de reviews encontradas:');
      sampleReviews.forEach((review, index) => {
        console.log(`\n${index + 1}. Review ID: ${review.id}`);
        console.log(`   Nota: ${review.nota}/5`);
        console.log(`   Comentário: "${review.comentario}"`);
        console.log(`   Pedido ID: ${review.orderId}`);
        console.log(`   Restaurante: ${review.order.restaurant.nome}`);
      });
    }
    
    // Verificar pedidos com reviews
    const ordersWithReviews = await prisma.order.findMany({
      where: {
        review: {
          isNot: null
        }
      },
      include: {
        review: true,
        restaurant: {
          select: {
            id: true,
            nome: true
          }
        }
      },
      take: 3
    });
    
    console.log(`\n🔗 Pedidos com reviews: ${ordersWithReviews.length}`);
    
    if (ordersWithReviews.length > 0) {
      console.log('\n📋 Detalhes dos pedidos com reviews:');
      ordersWithReviews.forEach((order, index) => {
        console.log(`\n${index + 1}. Pedido #${order.id}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Restaurante: ${order.restaurant.nome}`);
        console.log(`   Review nota: ${order.review.nota}/5`);
        console.log(`   Review comentário: "${order.review.comentario}"`);
      });
    }
    
    // Verificar se há pedidos sem reviews (entregues)
    const ordersWithoutReviews = await prisma.order.findMany({
      where: {
        status: 'entregue',
        review: null
      },
      include: {
        restaurant: {
          select: {
            id: true,
            nome: true
          }
        }
      },
      take: 3
    });
    
    console.log(`\n❌ Pedidos entregues sem reviews: ${ordersWithoutReviews.length}`);
    
    if (ordersWithoutReviews.length > 0) {
      console.log('\n📋 Exemplos de pedidos entregues sem review:');
      ordersWithoutReviews.forEach((order, index) => {
        console.log(`${index + 1}. Pedido #${order.id} - ${order.restaurant.nome}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkReviewData();
