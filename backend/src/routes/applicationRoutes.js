const express = require('express');
const applicationController = require('../controllers/applicationController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Rota para atualizar o status de uma candidatura específica
router.patch('/:id/status', authMiddleware, applicationController.updateStatus);

// --- NOVA ROTA PARA DELETAR UMA CANDIDATURA ---
router.delete('/:id', authMiddleware, applicationController.deleteMyApplication);

module.exports = router;