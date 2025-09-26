const express = require('express');
const Joi = require('joi');
const { db } = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const createReviewSchema = Joi.object({
  booking_id: Joi.string().required(),
  rating: Joi.number().min(1).max(5).required(),
  review_text: Joi.string().max(500).optional(),
  review_type: Joi.string().valid('customer_to_collector', 'collector_to_customer').required()
});

const updateReviewSchema = Joi.object({
  rating: Joi.number().min(1).max(5).optional(),
  review_text: Joi.string().max(500).optional()
});

// Create review
router.post('/', auth, async (req, res) => {
  try {
    const { error, value } = createReviewSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { booking_id, rating, review_text, review_type } = value;

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

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only review completed bookings'
      });
    }

    // Check if user has permission to review
    let canReview = false;
    if (review_type === 'customer_to_collector' && booking.customer_id === req.user.id) {
      canReview = true;
    } else if (review_type === 'collector_to_customer' && booking.collector_id === req.user.id) {
      canReview = true;
    }

    if (!canReview) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to review this booking'
      });
    }

    // Check if review already exists
    const existingReview = await db('reviews')
      .where('booking_id', booking_id)
      .where('reviewer_id', req.user.id)
      .where('review_type', review_type)
      .first();

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Review already exists for this booking'
      });
    }

    // Create review
    const [review] = await db('reviews')
      .insert({
        booking_id,
        reviewer_id: req.user.id,
        reviewee_id: review_type === 'customer_to_collector' ? booking.collector_id : booking.customer_id,
        rating,
        review_text,
        review_type,
        created_at: new Date()
      })
      .returning('*');

    // Update booking with rating
    if (review_type === 'customer_to_collector') {
      await db('bookings')
        .where('id', booking_id)
        .update({
          rating,
          review: review_text,
          updated_at: new Date()
        });
    }

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: { review }
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get reviews for a booking
router.get('/booking/:bookingId', auth, async (req, res) => {
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

    const reviews = await db('reviews')
      .select(
        'reviews.*',
        'reviewer.name as reviewer_name',
        'reviewer.phone as reviewer_phone',
        'reviewee.name as reviewee_name',
        'reviewee.phone as reviewee_phone'
      )
      .leftJoin('users as reviewer', 'reviews.reviewer_id', 'reviewer.id')
      .leftJoin('users as reviewee', 'reviews.reviewee_id', 'reviewee.id')
      .where('reviews.booking_id', bookingId)
      .orderBy('reviews.created_at', 'desc');

    res.json({
      success: true,
      data: { reviews }
    });
  } catch (error) {
    console.error('Get booking reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user reviews (reviews given by user)
router.get('/my-reviews', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const reviews = await db('reviews')
      .select(
        'reviews.*',
        'reviewee.name as reviewee_name',
        'reviewee.phone as reviewee_phone',
        'bookings.pickup_address'
      )
      .leftJoin('users as reviewee', 'reviews.reviewee_id', 'reviewee.id')
      .leftJoin('bookings', 'reviews.booking_id', 'bookings.id')
      .where('reviews.reviewer_id', req.user.id)
      .orderBy('reviews.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    // Get total count
    const total = await db('reviews')
      .where('reviewer_id', req.user.id)
      .count('* as count')
      .first();

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total.count),
          pages: Math.ceil(total.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get reviews about user (reviews received by user)
router.get('/about-me', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const reviews = await db('reviews')
      .select(
        'reviews.*',
        'reviewer.name as reviewer_name',
        'reviewer.phone as reviewer_phone',
        'bookings.pickup_address'
      )
      .leftJoin('users as reviewer', 'reviews.reviewer_id', 'reviewer.id')
      .leftJoin('bookings', 'reviews.booking_id', 'bookings.id')
      .where('reviews.reviewee_id', req.user.id)
      .orderBy('reviews.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    // Get total count
    const total = await db('reviews')
      .where('reviewee_id', req.user.id)
      .count('* as count')
      .first();

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total.count),
          pages: Math.ceil(total.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get reviews about me error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update review
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateReviewSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { rating, review_text } = value;

    // Check if review exists and user owns it
    const review = await db('reviews')
      .where('id', id)
      .where('reviewer_id', req.user.id)
      .first();

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or access denied'
      });
    }

    // Update review
    const [updatedReview] = await db('reviews')
      .where('id', id)
      .update({
        rating: rating || review.rating,
        review_text: review_text !== undefined ? review_text : review.review_text,
        updated_at: new Date()
      })
      .returning('*');

    // Update booking rating if it's a customer review
    if (review.review_type === 'customer_to_collector' && rating) {
      await db('bookings')
        .where('id', review.booking_id)
        .update({
          rating,
          review: review_text || review.review_text,
          updated_at: new Date()
        });
    }

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: { review: updatedReview }
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete review
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if review exists and user owns it
    const review = await db('reviews')
      .where('id', id)
      .where('reviewer_id', req.user.id)
      .first();

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or access denied'
      });
    }

    // Delete review
    await db('reviews').where('id', id).del();

    // Remove rating from booking if it was a customer review
    if (review.review_type === 'customer_to_collector') {
      await db('bookings')
        .where('id', review.booking_id)
        .update({
          rating: null,
          review: null,
          updated_at: new Date()
        });
    }

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
