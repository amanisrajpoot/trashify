const express = require('express');
const Joi = require('joi');
const { db } = require('../config/database');
const { auth } = require('../middleware/auth');
const { emitToBooking } = require('../services/realtimeService');

const router = express.Router();

// Validation schemas
const sendMessageSchema = Joi.object({
  booking_id: Joi.string().required(),
  message_text: Joi.string().min(1).max(1000).required(),
  message_type: Joi.string().valid('text', 'image', 'location').default('text'),
  attachment_url: Joi.string().uri().optional()
});

// Send message
router.post('/', auth, async (req, res) => {
  try {
    const { error, value } = sendMessageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { booking_id, message_text, message_type, attachment_url } = value;

    // Check if booking exists and user has permission
    const booking = await db('bookings')
      .select('id', 'customer_id', 'collector_id', 'status')
      .where('id', booking_id)
      .first();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is part of this booking
    if (booking.customer_id !== req.user.id && booking.collector_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to send messages for this booking'
      });
    }

    // Create message
    const [message] = await db('messages')
      .insert({
        booking_id,
        sender_id: req.user.id,
        receiver_id: booking.customer_id === req.user.id ? booking.collector_id : booking.customer_id,
        message_text,
        message_type,
        attachment_url,
        is_read: false,
        created_at: new Date()
      })
      .returning('*');

    // Emit real-time message
    try {
      await emitToBooking(booking_id, 'new_message', {
        message,
        sender_name: req.user.name,
        sender_phone: req.user.phone
      });
    } catch (realtimeError) {
      console.warn('Failed to emit real-time message:', realtimeError);
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get messages for a booking
router.get('/booking/:bookingId', auth, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Check if user has access to this booking
    const booking = await db('bookings')
      .select('customer_id', 'collector_id')
      .where('id', bookingId)
      .first();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.customer_id !== req.user.id && booking.collector_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const messages = await db('messages')
      .select(
        'messages.*',
        'sender.name as sender_name',
        'sender.phone as sender_phone',
        'receiver.name as receiver_name',
        'receiver.phone as receiver_phone'
      )
      .leftJoin('users as sender', 'messages.sender_id', 'sender.id')
      .leftJoin('users as receiver', 'messages.receiver_id', 'receiver.id')
      .where('messages.booking_id', bookingId)
      .orderBy('messages.created_at', 'asc')
      .limit(limit)
      .offset(offset);

    // Get total count
    const total = await db('messages')
      .where('booking_id', bookingId)
      .count('* as count')
      .first();

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total.count),
          pages: Math.ceil(total.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get booking messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Mark message as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if message exists and user is the receiver
    const message = await db('messages')
      .where('id', id)
      .where('receiver_id', req.user.id)
      .first();

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or access denied'
      });
    }

    // Mark as read
    await db('messages')
      .where('id', id)
      .update({
        is_read: true,
        read_at: new Date(),
        updated_at: new Date()
      });

    res.json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Mark all messages in a booking as read
router.put('/booking/:bookingId/read-all', auth, async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Check if user has access to this booking
    const booking = await db('bookings')
      .select('customer_id', 'collector_id')
      .where('id', bookingId)
      .first();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.customer_id !== req.user.id && booking.collector_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Mark all unread messages as read
    await db('messages')
      .where('booking_id', bookingId)
      .where('receiver_id', req.user.id)
      .where('is_read', false)
      .update({
        is_read: true,
        read_at: new Date(),
        updated_at: new Date()
      });

    res.json({
      success: true,
      message: 'All messages marked as read'
    });
  } catch (error) {
    console.error('Mark all messages as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get unread message count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await db('messages')
      .where('receiver_id', req.user.id)
      .where('is_read', false)
      .count('* as count')
      .first();

    res.json({
      success: true,
      data: {
        unread_count: parseInt(count.count)
      }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get recent conversations
router.get('/conversations', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Get unique booking conversations with latest message
    const conversations = await db('messages')
      .select(
        'messages.booking_id',
        'bookings.status as booking_status',
        'bookings.pickup_address',
        'other_user.name as other_user_name',
        'other_user.phone as other_user_phone',
        'other_user.role as other_user_role',
        db.raw('MAX(messages.created_at) as last_message_time'),
        db.raw('COUNT(CASE WHEN messages.receiver_id = ? AND messages.is_read = false THEN 1 END) as unread_count', [req.user.id])
      )
      .leftJoin('bookings', 'messages.booking_id', 'bookings.id')
      .leftJoin('users as other_user', function() {
        this.on('other_user.id', '=', function() {
          this.select('customer_id')
            .from('bookings')
            .where('bookings.id', db.raw('messages.booking_id'))
            .andWhere('bookings.customer_id', '!=', req.user.id)
            .union(function() {
              this.select('collector_id')
                .from('bookings')
                .where('bookings.id', db.raw('messages.booking_id'))
                .andWhere('bookings.collector_id', '!=', req.user.id);
            });
        });
      })
      .where(function() {
        this.where('messages.sender_id', req.user.id)
          .orWhere('messages.receiver_id', req.user.id);
      })
      .groupBy('messages.booking_id', 'bookings.status', 'bookings.pickup_address', 'other_user.name', 'other_user.phone', 'other_user.role')
      .orderBy('last_message_time', 'desc')
      .limit(limit)
      .offset(offset);

    // Get total count
    const total = await db('messages')
      .countDistinct('booking_id as count')
      .where(function() {
        this.where('sender_id', req.user.id)
          .orWhere('receiver_id', req.user.id);
      })
      .first();

    res.json({
      success: true,
      data: {
        conversations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total.count),
          pages: Math.ceil(total.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
