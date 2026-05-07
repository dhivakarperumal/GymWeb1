const express = require('express');
const router = express.Router();
const followupMasterController = require('../controllers/followupMasterController');
const followupInteractionController = require('../controllers/followupInteractionController');

// Followup Master Routes
router.get('/', followupMasterController.getAllFollowups);
router.get('/:id', followupMasterController.getFollowupById);
router.post('/', followupMasterController.createFollowup);
router.put('/:id', followupMasterController.updateFollowup);
router.delete('/:id', followupMasterController.deleteFollowup);
router.delete('/', followupMasterController.deleteAllFollowups);

// Followup Interaction Routes
router.get('/:followupId/interactions', followupInteractionController.getInteractionsByFollowupId);
router.post('/interactions', followupInteractionController.createInteraction);
router.delete('/interactions/:id', followupInteractionController.deleteInteraction);

module.exports = router;
