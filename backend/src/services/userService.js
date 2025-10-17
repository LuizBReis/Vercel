const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      freelancerProfile: {
        include: {
          skills: true,
          workExperiences: { orderBy: { startDate: 'desc' } },
        },
      },
      clientProfile: true,
    },
  });
  if (user) delete user.password;
  return user;
};

const updateUserProfile = async (userId, profileData) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Usuário não encontrado.');

  await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: profileData.firstName,
      lastName: profileData.lastName,
    },
  });

  if (user.role === 'FREELANCER') {
    await prisma.freelancerProfile.update({
      where: { userId },
      data: { description: profileData.description },
    });
  } else if (user.role === 'CLIENT') {
    await prisma.clientProfile.update({
      where: { userId },
      data: {
        companyName: profileData.companyName,
        location: profileData.location,
        description: profileData.description // <-- ADICIONADO AQUI
      },
    });
  }

  return getUserById(userId);
};

const addSkillToUser = async (userId, skillName) => {
  // A ação agora é no FreelancerProfile, não no User
  const profile = await prisma.freelancerProfile.update({
    where: { userId },
    data: {
      skills: {
        connectOrCreate: {
          where: { name: skillName },
          create: { name: skillName },
        },
      },
    },
  });
  return getUserById(userId); // Retorna o user completo
};

const removeSkillFromUser = async (userId, skillName) => {
  await prisma.freelancerProfile.update({
    where: { userId },
    data: {
      skills: {
        disconnect: { name: skillName },
      },
    },
  });
  return getUserById(userId);
};

const addWorkExperience = async (userId, experienceData) => {
  const profile = await prisma.freelancerProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error('Perfil de freelancer não encontrado.');
  return prisma.workExperience.create({
    data: {
      ...experienceData,
      freelancerProfileId: profile.id, // Conecta com o ID do perfil, não do usuário
    },
  });
};

const updateWorkExperience = async (userId, experienceId, experienceData) => {
  const profile = await prisma.freelancerProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error('Perfil de freelancer não encontrado.');
  return prisma.workExperience.updateMany({
    where: { id: experienceId, freelancerProfileId: profile.id },
    data: experienceData,
  });
};

const deleteWorkExperience = async (userId, experienceId) => {
  const profile = await prisma.freelancerProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error('Perfil de freelancer não encontrado.');
  return prisma.workExperience.deleteMany({
    where: { id: experienceId, freelancerProfileId: profile.id },
  });
};

// Funções de segurança (delete, change password/email) não precisam de grandes mudanças
const deleteUser = async (userId) => {
  return prisma.user.delete({ where: { id: userId } });
};
const changePassword = async (userId, oldPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Usuário não encontrado.');
  const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
  if (!isPasswordValid) throw new Error('A senha antiga está incorreta.');
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedNewPassword },
  });
};

const changeEmail = async (userId, password, newEmail) => {
  // 1. Busca o usuário e sua senha atual
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('Usuário não encontrado.');
  }

  // 2. Compara a senha fornecida com a que está no banco
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error('A senha está incorreta.');
  }

  // 3. Verifica se o novo e-mail já está em uso por OUTRO usuário
  const existingEmail = await prisma.user.findUnique({
    where: { email: newEmail },
  });

  if (existingEmail && existingEmail.id !== userId) {
    throw new Error('Este e-mail já está em uso por outra conta.');
  }

  // 4. Se todas as verificações passarem, atualiza o e-mail
  return prisma.user.update({
    where: { id: userId },
    data: { email: newEmail },
  });
};
  const getPostedJobsByUser = async (userId) => {
  // Primeiro encontra o perfil de cliente
  const profile = await prisma.clientProfile.findUnique({ where: { userId } });
  if (!profile) return []; // Se não for um cliente, retorna array vazio
  // Depois busca as vagas associadas ao perfil
  return prisma.job.findMany({
    where: { authorId: profile.id },
    orderBy: { createdAt: 'desc' },
  });
};

const getApplicationsByUser = async (userId) => {
return prisma.jobApplication.findMany({
    where: { applicantId: userId },
    include: {
      job: {
        include: {
          author: { // ClientProfile
            select: {
              companyName: true, // Pega o nome da empresa
              user: { select: { firstName: true, lastName: true } } // Pega o nome como fallback
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

module.exports = {
  getUserById,
  updateUserProfile,
  addSkillToUser,
  removeSkillFromUser,
  addWorkExperience,
  updateWorkExperience,
  deleteWorkExperience,
  deleteUser,
  changePassword,
  changeEmail,
  getPostedJobsByUser,
  getApplicationsByUser,
};