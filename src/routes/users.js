const express = require('express');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const { db } = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  email: Joi.string().email().optional(),
  address: Joi.object().optional(),
  profile_image_url: Joi.string().uri().optional()
});

const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string().min(6).required()
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await db('users')
      .select('id', 'phone', 'email', 'name', 'role', 'status', 'is_verified', 'profile_image_url', 'address', 'created_at', 'last_login')
      .where('id', req.user.id)
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { name, email, address, profile_image_url } = value;

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await db('users')
        .where('email', email)
        .where('id', '!=', req.user.id)
        .first();

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already taken by another user'
        });
      }
    }

    const [updatedUser] = await db('users')
      .where('id', req.user.id)
      .update({
        name: name || req.user.name,
        email: email !== undefined ? email : req.user.email,
        address: address ? JSON.stringify(address) : req.user.address,
        profile_image_url: profile_image_url !== undefined ? profile_image_url : req.user.profile_image_url,
        updated_at: new Date()
      })
      .returning(['id', 'phone', 'email', 'name', 'role', 'status', 'is_verified', 'profile_image_url', 'address', 'created_at', 'last_login']);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Change password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { current_password, new_password } = value;

    // Get user with password hash
    const user = await db('users')
      .select('password_hash')
      .where('id', req.user.id)
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(current_password, user.password_hash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(new_password, saltRounds);

    // Update password
    await db('users')
      .where('id', req.user.id)
      .update({
        password_hash: newPasswordHash,
        updated_at: new Date()
      });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let stats = {};

    if (userRole === 'customer') {
      // Customer stats
      const bookingStats = await db('bookings')
        .where('customer_id', userId)
        .select(
          db.raw('COUNT(*) as total_bookings'),
          db.raw('COUNT(CASE WHEN status = \'completed\' THEN 1 END) as completed_bookings'),
          db.raw('COUNT(CASE WHEN status = \'pending\' THEN 1 END) as pending_bookings'),
          db.raw('COALESCE(SUM(actual_value), 0) as total_earnings')
        )
        .first();

      const paymentStats = await db('payments')
        .where('customer_id', userId)
        .where('status', 'completed')
        .select(
          db.raw('COUNT(*) as total_payments'),
          db.raw('COALESCE(SUM(amount), 0) as total_amount')
        )
        .first();

      stats = {
        ...bookingStats,
        ...paymentStats
      };
    } else if (userRole === 'collector') {
      // Collector stats
      const bookingStats = await db('bookings')
        .where('collector_id', userId)
        .select(
          db.raw('COUNT(*) as total_pickups'),
          db.raw('COUNT(CASE WHEN status = \'completed\' THEN 1 END) as completed_pickups'),
          db.raw('COUNT(CASE WHEN status = \'in_progress\' THEN 1 END) as in_progress_pickups'),
          db.raw('COALESCE(AVG(rating), 0) as average_rating')
        )
        .first();

      const inventoryStats = await db('inventory')
        .where('collector_id', userId)
        .select(
          db.raw('COUNT(*) as total_items_collected'),
          db.raw('COALESCE(SUM(weight), 0) as total_weight_collected'),
          db.raw('COALESCE(SUM(total_value), 0) as total_value_collected')
        )
        .first();

      stats = {
        ...bookingStats,
        ...inventoryStats
      };
    }

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update collector location
router.put('/location', auth, async (req, res) => {
  try {
    if (req.user.role !== 'collector') {
      return res.status(403).json({
        success: false,
        message: 'Only collectors can update location'
      });
    }

    const { latitude, longitude, address, status = 'available' } = req.body;

    if (!latitude || !longitude || !address) {
      return res.status(400).json({
        success: false,
        message: 'Latitude, longitude, and address are required'
      });
    }

    // Update or insert location
    const existingLocation = await db('collector_locations')
      .where('collector_id', req.user.id)
      .first();

    if (existingLocation) {
      await db('collector_locations')
        .where('collector_id', req.user.id)
        .update({
          latitude,
          longitude,
          address,
          status,
          last_updated: new Date(),
          updated_at: new Date()
        });
    } else {
      await db('collector_locations').insert({
        collector_id: req.user.id,
        latitude,
        longitude,
        address,
        status,
        last_updated: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Location updated successfully'
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get nearby collectors (for customers)
router.get('/nearby-collectors', auth, async (req, res) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Find collectors within radius (in kilometers)
    const collectors = await db('collector_locations')
      .select(
        'collector_id',
        'latitude',
        'longitude',
        'address',
        'status',
        'last_updated',
        db.raw(`
          6371 * acos(
            cos(radians(?)) * cos(radians(latitude)) * 
            cos(radians(longitude) - radians(?)) + 
            sin(radians(?)) * sin(radians(latitude))
          ) AS distance
        `, [latitude, longitude, latitude])
      )
      .where('status', 'available')
      .where('last_updated', '>', db.raw("NOW() - INTERVAL '30 minutes'"))
      .having('distance', '<=', radius)
      .orderBy('distance')
      .limit(10);

    res.json({
      success: true,
      data: { collectors }
    });
  } catch (error) {
    console.error('Get nearby collectors error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
