const express = require('express');
const Joi = require('joi');
const { db } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');
const { sendNotification } = require('../services/notificationService');

const router = express.Router();

// Validation schemas
const createBookingSchema = Joi.object({
  pickup_address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    pincode: Joi.string().pattern(/^\d{6}$/).required(),
    latitude: Joi.number().required(),
    longitude: Joi.number().required(),
    landmark: Joi.string().optional()
  }).required(),
  materials: Joi.array().items(
    Joi.object({
      material_id: Joi.string().uuid().required(),
      estimated_weight: Joi.number().positive().required(),
      description: Joi.string().optional()
    })
  ).min(1).required(),
  scheduled_at: Joi.date().greater('now').required(),
  special_instructions: Joi.string().max(500).optional()
});

const updateBookingSchema = Joi.object({
  status: Joi.string().valid('cancelled').optional(),
  special_instructions: Joi.string().max(500).optional()
});

// Create booking
router.post('/', auth, authorize('customer'), async (req, res) => {
  try {
    const { error, value } = createBookingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { pickup_address, materials, scheduled_at, special_instructions } = value;

    // Calculate estimated value
    let estimatedValue = 0;
    for (const material of materials) {
      const materialData = await db('materials')
        .select('price_per_kg')
        .where('id', material.material_id)
        .where('is_active', true)
        .first();

      if (!materialData) {
        return res.status(400).json({
          success: false,
          message: `Material with ID ${material.material_id} not found or inactive`
        });
      }

      estimatedValue += materialData.price_per_kg * material.estimated_weight;
    }

    // Create booking
    const [booking] = await db('bookings')
      .insert({
        customer_id: req.user.id,
        pickup_address: JSON.stringify(pickup_address),
        materials: JSON.stringify(materials),
        estimated_value: estimatedValue,
        scheduled_at,
        special_instructions
      })
      .returning('*');

    // Find available collectors nearby
    const availableCollectors = await db('collector_locations')
      .select('collector_id', 'latitude', 'longitude')
      .where('status', 'available')
      .where('last_updated', '>', db.raw("NOW() - INTERVAL '30 minutes'"));

    // Send notifications to nearby collectors
    for (const collector of availableCollectors) {
      await sendNotification(collector.collector_id, {
        title: 'New Pickup Request',
        message: `New pickup request near your location. Estimated value: ₹${estimatedValue}`,
        type: 'booking',
        data: { booking_id: booking.id }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: { booking }
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user bookings
router.get('/', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = db('bookings')
      .select('*')
      .where('customer_id', req.user.id)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    if (status) {
      query = query.where('status', status);
    }

    const bookings = await query;

    // Get total count
    let countQuery = db('bookings').where('customer_id', req.user.id);
    if (status) {
      countQuery = countQuery.where('status', status);
    }
    const total = await countQuery.count('* as count').first();

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total.count),
          pages: Math.ceil(total.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get booking by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await db('bookings')
      .select('*')
      .where('id', id)
      .where(function() {
        this.where('customer_id', req.user.id)
            .orWhere('collector_id', req.user.id);
      })
      .first();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: { booking }
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update booking
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateBookingSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Check if booking exists and user has permission
    const booking = await db('bookings')
      .select('*')
      .where('id', id)
      .where(function() {
        this.where('customer_id', req.user.id)
            .orWhere('collector_id', req.user.id);
      })
      .first();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking can be updated
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update completed or cancelled booking'
      });
    }

    // Update booking
    const [updatedBooking] = await db('bookings')
      .where('id', id)
      .update({
        ...value,
        updated_at: new Date()
      })
      .returning('*');

    // Send notification to other party
    const otherUserId = booking.customer_id === req.user.id ? booking.collector_id : booking.customer_id;
    if (otherUserId) {
      await sendNotification(otherUserId, {
        title: 'Booking Updated',
        message: `Booking #${id} has been updated`,
        type: 'booking',
        data: { booking_id: id }
      });
    }

    res.json({
      success: true,
      message: 'Booking updated successfully',
      data: { booking: updatedBooking }
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Accept booking (for collectors)
router.post('/:id/accept', auth, authorize('collector'), async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await db('bookings')
      .where('id', id)
      .where('status', 'pending')
      .first();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not available'
      });
    }

    // Update booking
    const [updatedBooking] = await db('bookings')
      .where('id', id)
      .update({
        collector_id: req.user.id,
        status: 'accepted',
        updated_at: new Date()
      })
      .returning('*');

    // Send notification to customer
    await sendNotification(booking.customer_id, {
      title: 'Booking Accepted',
      message: 'Your pickup request has been accepted by a collector',
      type: 'booking',
      data: { booking_id: id }
    });

    res.json({
      success: true,
      message: 'Booking accepted successfully',
      data: { booking: updatedBooking }
    });
  } catch (error) {
    console.error('Accept booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Complete booking (for collectors)
router.post('/:id/complete', auth, authorize('collector'), async (req, res) => {
  try {
    const { id } = req.params;
    const { actual_materials, images } = req.body;

    const booking = await db('bookings')
      .where('id', id)
      .where('collector_id', req.user.id)
      .where('status', 'in_progress')
      .first();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not in progress'
      });
    }

    // Calculate actual value
    let actualValue = 0;
    for (const material of actual_materials) {
      const materialData = await db('materials')
        .select('price_per_kg')
        .where('id', material.material_id)
        .first();

      actualValue += materialData.price_per_kg * material.weight;
    }

    // Update booking
    const [updatedBooking] = await db('bookings')
      .where('id', id)
      .update({
        status: 'completed',
        actual_value: actualValue,
        picked_up_at: new Date(),
        images: JSON.stringify(images),
        updated_at: new Date()
      })
      .returning('*');

    // Create inventory records
    for (const material of actual_materials) {
      await db('inventory').insert({
        booking_id: id,
        material_id: material.material_id,
        collector_id: req.user.id,
        weight: material.weight,
        price_per_kg: material.price_per_kg,
        total_value: material.weight * material.price_per_kg,
        condition: material.condition || 'good',
        notes: material.notes,
        images: JSON.stringify(material.images || [])
      });
    }

    // Send notification to customer
    await sendNotification(booking.customer_id, {
      title: 'Pickup Completed',
      message: `Your pickup has been completed. Amount: ₹${actualValue}`,
      type: 'payment',
      data: { booking_id: id, amount: actualValue }
    });

    res.json({
      success: true,
      message: 'Booking completed successfully',
      data: { booking: updatedBooking }
    });
  } catch (error) {
    console.error('Complete booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
