const express = require('express');
const router = express.Router();
const { sendMessages, getMessageHistory, sendSingleMessage } = require('../controllers/messageController');

router.post('/', sendMessages);
router.post('/send-message', sendSingleMessage);
router.get('/history', getMessageHistory);

module.exports = router;
