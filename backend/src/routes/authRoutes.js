const express = require('express');
const router = express.Router();
const { register, login, googleLogin, setPassword } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/google-login', googleLogin);
router.post('/set-password', setPassword);

module.exports = router;