const express = require('express');
const router = express.Router();
const ptFormController = require('../controllers/ptFormController');

router.post('/', ptFormController.savePTForm);
router.get('/:member_id', ptFormController.getPTForm);
router.delete('/:member_id/reset', ptFormController.resetPTForm);

module.exports = router;
