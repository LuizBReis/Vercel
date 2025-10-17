const applicationService = require('../services/applicationService');

const updateStatus = async (req, res) => {
  try {
    const { id: applicationId } = req.params;
    const { status: newStatus } = req.body;
    const { userId: currentUserId } = req.user;

    // A lógica de validação do status está correta
    if (!newStatus || !['PENDING', 'SHORTLISTED', 'REJECTED'].includes(newStatus)) {
      return res.status(400).json({ message: 'Status inválido.' });
    }

    // A chamada ao serviço está correta
    const result = await applicationService.updateApplicationStatus(
      applicationId, 
      newStatus, 
      currentUserId
    );

    // A validação de resultado foi movida para o service, então podemos simplificar aqui.
    res.status(200).json(result);

  } catch (error) {
    // ==========================================================
    // ✅ A ÚNICA MUDANÇA É ADICIONAR ESTA LINHA:
    // Ela vai forçar a exibição do erro completo no terminal.
    // ==========================================================
    console.error('ERRO DETALHADO AO ATUALIZAR STATUS:', error);

    res.status(500).json({ message: 'Erro ao atualizar status da candidatura.', error: error.message });
  }
};

// --- A função de deletar continua a mesma ---
const deleteMyApplication = async (req, res) => {
  try {
    const { id: applicationId } = req.params;
    const { userId: applicantId } = req.user;

    const result = await applicationService.deleteApplication(applicationId, applicantId);

    if (result.count === 0) {
      return res.status(403).json({ message: 'Acesso negado ou candidatura não encontrada.' });
    }

    res.status(200).json({ message: 'Candidatura removida com sucesso.' });
  } catch (error) {
    // Para sermos consistentes, vamos adicionar o log aqui também.
    console.error('ERRO DETALHADO AO DELETAR CANDIDATURA:', error);
    res.status(500).json({ message: 'Erro ao remover candidatura.', error: error.message });
  }
};


module.exports = {
  updateStatus,
  deleteMyApplication,
};