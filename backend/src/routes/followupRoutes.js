const express = require('express');
const router = express.Router();
const followupController = require('../controllers/followupController');

router.get('/enquiry/:enquiryId', followupController.getFollowupsByEnquiryId);
router.post('/', followupController.createFollowup);
router.put('/:id', followupController.updateFollowup);
router.delete('/:id', followupController.deleteFollowup);

module.exports = router;
