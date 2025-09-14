const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { db } = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Calculate payment amount
router.post('/calculate', auth, async (req, res) => {
  try {
    const { materials } = req.body;

    if (!materials || !Array.isArray(materials)) {
      return res.status(400).json({
        success: false,
        message: 'Materials array is required'
      });
    }

    let totalAmount = 0;
    const materialDetails = [];

    for (const material of materials) {
      const materialData = await db('materials')
        .select('id', 'name', 'price_per_kg', 'unit')
        .where('id', material.material_id)
        .where('is_active', true)
        .first();

      if (!materialData) {
        return res.status(400).json({
          success: false,
          message: `Material with ID ${material.material_id} not found or inactive`
        });
      }

      const amount = materialData.price_per_kg * material.weight;
      totalAmount += amount;

      materialDetails.push({
        ...materialData,
        weight: material.weight,
        amount
      });
    }

    res.json({
      success: true,
      data: {
        totalAmount,
        materialDetails,
        currency: 'INR'
      }
    });
  } catch (error) {
    console.error('Calculate payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create Razorpay order
router.post('/create-order', auth, async (req, res) => {
  try {
    const { amount, booking_id } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt: `booking_${booking_id}_${Date.now()}`,
      notes: {
        booking_id,
        user_id: req.user.id
      }
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      data: {
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order'
    });
  }
});

// Verify payment
router.post('/verify', auth, async (req, res) => {
  try {
    const { order_id, payment_id, signature, booking_id } = req.body;

    if (!order_id || !payment_id || !signature) {
      return res.status(400).json({
        success: false,
        message: 'Order ID, Payment ID, and Signature are required'
      });
    }

    // Verify signature
    const body = order_id + '|' + payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Get payment details from Razorpay
    const payment = await razorpay.payments.fetch(payment_id);

    if (payment.status !== 'captured') {
      return res.status(400).json({
        success: false,
        message: 'Payment not captured'
      });
    }

    // Create payment record
    const [paymentRecord] = await db('payments')
      .insert({
        booking_id,
        customer_id: req.user.id,
        amount: payment.amount / 100, // Convert from paise
        type: 'payout',
        status: 'completed',
        razorpay_payment_id: payment_id,
        razorpay_order_id: order_id,
        razorpay_signature: signature,
        payment_details: JSON.stringify(payment),
        processed_at: new Date()
      })
      .returning('*');

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: { payment: paymentRecord }
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed'
    });
  }
});

// Get payment history
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const offset = (page - 1) * limit;

    let query = db('payments')
      .select('*')
      .where('customer_id', req.user.id)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    if (type) {
      query = query.where('type', type);
    }

    const payments = await query;

    // Get total count
    let countQuery = db('payments').where('customer_id', req.user.id);
    if (type) {
      countQuery = countQuery.where('type', type);
    }
    const total = await countQuery.count('* as count').first();

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total.count),
          pages: Math.ceil(total.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get payment by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await db('payments')
      .select('*')
      .where('id', id)
      .where('customer_id', req.user.id)
      .first();

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: { payment }
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Refund payment (admin only)
router.post('/:id/refund', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const payment = await db('payments')
      .where('id', id)
      .where('status', 'completed')
      .first();

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found or not completed'
      });
    }

    // Create refund with Razorpay
    const refund = await razorpay.payments.refund(payment.razorpay_payment_id, {
      amount: Math.round(payment.amount * 100),
      notes: {
        reason: reason || 'Customer request'
      }
    });

    // Update payment record
    const [updatedPayment] = await db('payments')
      .where('id', id)
      .update({
        status: 'refunded',
        payment_details: JSON.stringify({
          ...JSON.parse(payment.payment_details),
          refund
        }),
        updated_at: new Date()
      })
      .returning('*');

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: { payment: updatedPayment }
    });
  } catch (error) {
    console.error('Refund payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Refund processing failed'
    });
  }
});

module.exports = router;
