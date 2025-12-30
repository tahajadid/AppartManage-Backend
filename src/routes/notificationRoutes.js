const express = require('express');
const { notifyUser, notifyToken, notifyTopic, health } = require('../controllers/notificationController');

const router = express.Router();

router.get('/health', health);
router.post('/notify/user', notifyUser);
router.post('/notify/token', notifyToken);
router.post('/notify/topic', notifyTopic);

module.exports = router;

