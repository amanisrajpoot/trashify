const express = require('express');
const { db } = require('../config/database');
const { auth } = require('../middleware/auth');
const { sendNotification } = require('../services/notificationService');

const router = express.Router();

// Get user notifications
router.get('/', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = db('notifications')
      .select('*')
      .where('user_id', req.user.id)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    if (status) {
      query = query.where('status', status);
    }

    const notifications = await query;

    // Get total count
    let countQuery = db('notifications').where('user_id', req.user.id);
    if (status) {
      countQuery = countQuery.where('status', status);
    }
    const total = await countQuery.count('* as count').first();

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total.count),
          pages: Math.ceil(total.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await db('notifications')
      .where('id', id)
      .where('user_id', req.user.id)
      .first();

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await db('notifications')
      .where('id', id)
      .update({
        status: 'read',
        read_at: new Date(),
        updated_at: new Date()
      });

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Mark all notifications as read
router.put('/read-all', auth, async (req, res) => {
  try {
    await db('notifications')
      .where('user_id', req.user.id)
      .where('status', 'unread')
      .update({
        status: 'read',
        read_at: new Date(),
        updated_at: new Date()
      });

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete notification
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await db('notifications')
      .where('id', id)
      .where('user_id', req.user.id)
      .first();

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await db('notifications')
      .where('id', id)
      .update({
        status: 'archived',
        updated_at: new Date()
      });

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get unread notification count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const result = await db('notifications')
      .where('user_id', req.user.id)
      .where('status', 'unread')
      .count('* as count')
      .first();

    res.json({
      success: true,
      data: { count: parseInt(result.count) }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Send test notification (for development)
router.post('/send-test', auth, async (req, res) => {
  try {
    const { title, message, type = 'system' } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    await sendNotification(req.user.id, {
      title,
      message,
      type,
      data: { test: true }
    });

    res.json({
      success: true,
      message: 'Test notification sent'
    });
  } catch (error) {
    console.error('Send test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
