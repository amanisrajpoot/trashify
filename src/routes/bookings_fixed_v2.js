const express = require('express');
const router = express.Router();
const bookingService = require('../services/bookingService');
const auth = require('../middleware/auth');
const { body, validationResult, query } = require('express-validator');

// Create a new booking
router.post('/', auth, [
  body('pickup_address').notEmpty().withMessage('Pickup address is required'),
  body('latitude').isFloat().withMessage('Valid latitude is required'),
  body('longitude').isFloat().withMessage('Valid longitude is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('state').notEmpty().withMessage('State is required'),
  body('pincode').isLength({ min: 6, max: 6 }).withMessage('Valid pincode is required'),
  body('preferred_pickup_date').isISO8601().withMessage('Valid pickup date is required'),
  body('time_slot').notEmpty().withMessage('Time slot is required'),
  body('materials').isArray({ min: 1 }).withMessage('At least one material is required'),
  body('materials.*.material_id').notEmpty().withMessage('Material ID is required'),
  body('materials.*.quantity').isFloat({ min: 0.1 }).withMessage('Valid quantity is required'),
  body('contact_person').optional().isLength({ min: 2, max: 100 }),
  body('contact_phone').optional().isMobilePhone('en-IN'),
  body('special_instructions').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const bookingData = {
      ...req.body,
      customer_id: req.user.id
    };

    const result = await bookingService.createBooking(bookingData);

    if (result.success) {
      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        booking: result.booking
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking'
    });
  }
});

// Get customer bookings
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    
    const result = await bookingService.getCustomerBookings(
      req.user.id,
      status,
      parseInt(limit),
      parseInt(offset)
    );

    if (result.success) {
      res.json({
        success: true,
        bookings: result.bookings
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Get customer bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bookings'
    });
  }
});

// Get collector bookings
router.get('/collector-bookings', auth, async (req, res) => {
  try {
    if (req.user.role !== 'collector') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Collector role required.'
      });
    }

    const { status, limit = 20, offset = 0 } = req.query;
    
    const result = await bookingService.getCollectorBookings(
      req.user.id,
      status,
      parseInt(limit),
      parseInt(offset)
    );

    if (result.success) {
      res.json({
        success: true,
        bookings: result.bookings
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Get collector bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bookings'
    });
  }
});

// Get booking by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await bookingService.getBookingById(id);

    if (result.success) {
      // Check if user has access to this booking
      const booking = result.booking;
      if (booking.customer_id !== req.user.id && 
          booking.collector_id !== req.user.id && 
          req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        booking
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Get booking by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get booking'
    });
  }
});

// Update booking status
router.patch('/:id/status', auth, [
  body('status').isIn(['pending', 'assigned', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Valid status is required'),
  body('notes').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { status, notes } = req.body;
    
    const result = await bookingService.updateBookingStatus(
      id,
      status,
      req.user.id,
      req.user.role,
      notes
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'Booking status updated successfully',
        booking: result.booking
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status'
    });
  }
});

// Assign collector to booking (Admin only)
router.post('/:id/assign', auth, [
  body('collector_id').notEmpty().withMessage('Collector ID is required')
], async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { collector_id } = req.body;
    
    const result = await bookingService.assignCollector(id, collector_id, req.user.id);

    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Assign collector error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign collector'
    });
  }
});

// Cancel booking
router.post('/:id/cancel', auth, [
  body('reason').notEmpty().withMessage('Cancellation reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { reason } = req.body;
    
    const result = await bookingService.cancelBooking(
      id,
      req.user.id,
      req.user.role,
      reason
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'Booking cancelled successfully',
        booking: result.booking
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking'
    });
  }
});

// Get all bookings (Admin only)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const { status, limit = 50, offset = 0 } = req.query;
    
    const db = require('../config/database');
    let query = db('bookings')
      .leftJoin('users as customers', 'bookings.customer_id', 'customers.id')
      .leftJoin('users as collectors', 'bookings.collector_id', 'collectors.id')
      .select(
        'bookings.*',
        'customers.name as customer_name',
        'customers.phone as customer_phone',
        'collectors.name as collector_name',
        'collectors.phone as collector_phone'
      );

    if (status) {
      query = query.where('bookings.status', status);
    }

    const bookings = await query
      .orderBy('bookings.created_at', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    res.json({
      success: true,
      bookings
    });

  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bookings'
    });
  }
});

module.exports = router;