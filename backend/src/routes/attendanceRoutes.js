const express = require('express');
const { getAttendance, markAttendance, reverseGeocode, checkOut, biometricAttendance } = require('../controllers/attendanceController');

const router = express.Router();

router.get('/', getAttendance);
router.post('/', markAttendance);
router.post('/checkout', checkOut);
router.post('/biometric', biometricAttendance);
router.get('/reverse-geocode', reverseGeocode);

module.exports = router;
