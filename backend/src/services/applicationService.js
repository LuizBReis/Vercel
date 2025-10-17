const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const updateApplicationStatus = async (applicationId, newStatus, currentUserId) => {
  // 1. Busca a candidatura e informações importantes em uma única query
  const application = await prisma.jobApplication.findFirst({
    where: { id: applicationId, job: { author: { userId: currentUserId } } },
    include: {
      job: { select: { title: true } },
      applicant: { select: { id: true, firstName: true } }
    }
  });

  // 2. Se não encontrar, nega o acesso
  if (!application) {
    throw new Error('Acesso negado ou candidatura não encontrada.');
  }

  // 3. Atualiza o status da candidatura
  await prisma.jobApplication.update({
    where: { id: applicationId },
    data: { status: newStatus },
  });

  // 4. Lógica de Mensagens Automáticas
  let conversation = await prisma.conversation.findUnique({
    where: { applicationId: applicationId },
  });

  // Se a conversa não existe, cria
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { applicationId: applicationId },
    });
  }

  // Se o status for SELECIONADO...
  if (newStatus === 'SHORTLISTED') {
    const messageContent = `Olá ${application.applicant.firstName}, gostei do seu perfil para a vaga "${application.job.title}" e gostaria de conversar mais.`;
    await prisma.message.create({
      data: {
        content: messageContent,
        conversationId: conversation.id,
        senderId: currentUserId, // O cliente é o remetente
      },
    });
  }
  // Se o status for REJEITADO...
  else if (newStatus === 'REJECTED') {
    const messageContent = `Olá ${application.applicant.firstName}. Agradecemos seu interesse na vaga "${application.job.title}". Neste momento, optamos por seguir com outros candidatos. Desejamos sucesso em sua busca!`;
    await prisma.message.create({
      data: {
        content: messageContent,
        conversationId: conversation.id,
        senderId: currentUserId,
      },
    });
    // Trava a conversa
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { isLocked: true },
    });
  }
};

const deleteApplication = async (applicationId, applicantId) => {
  // A cláusula 'where' garante que um usuário só pode deletar sua PRÓPRIA candidatura
  const result = await prisma.jobApplication.deleteMany({
    where: {
      id: applicationId,
      applicantId: applicantId, // Verificação de segurança
    },
  });
  return result;
};

module.exports = {
  updateApplicationStatus,
  deleteApplication,
};