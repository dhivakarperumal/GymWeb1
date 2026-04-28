const express = require("express");
const {
  getAllMembers,
  getMemberById,
  getMemberByUserId,
  createMember,
  updateMember,
  deleteMember,
  getMemberPlans,
} = require("../controllers/memberController.js");

const router = express.Router();

/**
 * @route   GET /api/members
 * @desc    Get all members
 */
router.get("/", getAllMembers);

/**
 * @route   GET /api/members/user/:user_id
 * @desc    Get member record by user id or fallback to the user profile
 */
router.get('/user/:user_id', getMemberByUserId);

/**
 * @route   GET /api/members/:id
 * @desc    Get single member
 */
router.get('/:id', getMemberById);

/**
 * @route   POST /api/members
 * @desc    Create new member
 */
router.post("/", createMember);

/**
 * @route   PUT /api/members/:id
 * @desc    Update member
 */
router.put("/:id", updateMember);

/**
 * @route   GET /api/members/:id/plans
 * @desc    Get plans for a member
 */
router.get("/:id/plans", getMemberPlans);

/**
 * @route   DELETE /api/members/:id
 * @desc    Delete member
 */
router.delete("/:id", deleteMember);

module.exports = router;