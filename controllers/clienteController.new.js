const prisma = require('../prisma/prismaClient');

module.exports = {
  getProfile: async (req, res) => {
    try {
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
      res.json(cliente);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const { nome, email, avatarUrl, telefone, address } = req.body;

      // Preparar dados para atualização do usuário
      const updateData = {
        ...(nome && { nome }),
        ...(avatarUrl && { avatarUrl }),
        ...(telefone && { telefone })
      };

      // Verifica se há dados para atualizar
      if (Object.keys(updateData).length === 0 && !address) {
        return res.status(400).json({ error: 'Nenhum dado válido para atualização' });
      }

      // Inicia uma transação para garantir consistência
      await prisma.$transaction(async (tx) => {
        // Atualiza os dados do usuário
        if (Object.keys(updateData).length > 0) {
          await tx.user.update({
            where: { id: req.user.id },
            data: updateData
          });
        }

        // Se tiver dados de endereço
        if (address) {
          const { rua, numero, bairro, cidade, estado, complemento, cep } = address;

          // Verifica se já existe um endereço para o usuário
          const existingAddress = await tx.address.findFirst({
            where: { userId: req.user.id }
          });

          if (existingAddress) {
            // Atualiza o endereço existente
            await tx.address.update({
              where: { id: existingAddress.id },
              data: {
                rua,
                numero,
                bairro,
                cidade,
                estado,
                complemento,
                cep
              }
            });
          } else {
            // Cria um novo endereço
            await tx.address.create({
              data: {
                userId: req.user.id,
                rua,
                numero,
                bairro,
                cidade,
                estado,
                complemento,
                cep
              }
            });
          }
        }
      });

      // Busca o usuário atualizado com seus endereços
      const updatedUser = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          nome: true,
          email: true,
          tipo: true,
          avatarUrl: true,
          telefone: true,
          endereco: true,
          addresses: true
        }
      });

      res.json({
        msg: 'Perfil atualizado com sucesso!',
        user: updatedUser
      });
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }
  },

  // Resto dos métodos existentes...
};
