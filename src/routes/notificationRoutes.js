const express = require('express');
const { notifyUser, notifyToken, notifyTopic, testNotificationToSyndic, health } = require('../controllers/notificationController');

const router = express.Router();

router.get('/health', health);
router.post('/notify/user', notifyUser);
router.post('/notify/token', notifyToken);
router.post('/notify/topic', notifyTopic);
router.post('/notify/test', testNotificationToSyndic);

module.exports = router;

