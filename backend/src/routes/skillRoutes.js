const express = require('express');
const skillController = require('../controllers/skillController');

const router = express.Router();

// Esta rota será pública, pois qualquer um pode querer ver as sugestões
router.get('/suggestions', skillController.listSuggestedSkills);

module.exports = router;