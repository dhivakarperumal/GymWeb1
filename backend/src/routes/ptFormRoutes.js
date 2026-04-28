const express = require('express');
const router = express.Router();
const ptFormController = require('../controllers/ptFormController');

router.post('/', ptFormController.savePTForm);
router.get('/:member_id', ptFormController.getPTForm);

module.exports = router;
