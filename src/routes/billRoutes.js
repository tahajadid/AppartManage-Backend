const express = require('express');
const { createMonthlyBills } = require('../controllers/billController');

const router = express.Router();

router.post('/bills/monthly', createMonthlyBills);

module.exports = router;

