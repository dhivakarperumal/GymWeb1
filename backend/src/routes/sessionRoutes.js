const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');

router.get('/', sessionController.getSessions);
router.post('/', sessionController.createSession);
router.delete('/:id', sessionController.deleteSession);

module.exports = router;
