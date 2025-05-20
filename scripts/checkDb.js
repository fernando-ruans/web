const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Verificando banco de dados...');
  
  // Verificar endereços
  const addresses = await prisma.address.findMany({
    include: {
      user: {
        select: {
          id: true,
          nome: true,
          endereco: true
        }
      }
    }
  });
  
  console.log('\nEndereços encontrados:', addresses.length);
  console.log(JSON.stringify(addresses, null, 2));
  
  // Verificar usuários com endereços
  const users = await prisma.user.findMany({
    where: {
      addresses: {
        some: {}
      }
    },
    include: {
      addresses: true
    }
  });
  
  console.log('\nUsuários com endereços:', users.length);
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
