const express = require('express');
const protect = require('../middleware/auth');
const { deleteMyAccount } = require('../controllers/userController');

const router = express.Router();

router.delete('/me', protect, deleteMyAccount);

module.exports = router;
