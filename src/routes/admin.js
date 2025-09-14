const express = require('express');
const { db } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// All admin routes require admin authentication
router.use(auth);
router.use(authorize('admin'));

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    // Get overall statistics
    const stats = await db.raw(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'customer') as total_customers,
        (SELECT COUNT(*) FROM users WHERE role = 'collector') as total_collectors,
        (SELECT COUNT(*) FROM bookings) as total_bookings,
        (SELECT COUNT(*) FROM bookings WHERE status = 'completed') as completed_bookings,
        (SELECT COUNT(*) FROM bookings WHERE status = 'pending') as pending_bookings,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed') as total_payments,
        (SELECT COALESCE(SUM(weight), 0) FROM inventory) as total_weight_collected
    `);

    // Get recent bookings
    const recentBookings = await db('bookings')
      .select(
        'bookings.*',
        'customers.name as customer_name',
        'customers.phone as customer_phone',
        'collectors.name as collector_name'
      )
      .leftJoin('users as customers', 'bookings.customer_id', 'customers.id')
      .leftJoin('users as collectors', 'bookings.collector_id', 'collectors.id')
      .orderBy('bookings.created_at', 'desc')
      .limit(10);

    // Get top collectors by earnings
    const topCollectors = await db('inventory')
      .select(
        'collector_id',
        'collectors.name',
        'collectors.phone',
        db.raw('COUNT(*) as total_pickups'),
        db.raw('COALESCE(SUM(total_value), 0) as total_earnings')
      )
      .leftJoin('users as collectors', 'inventory.collector_id', 'collectors.id')
      .groupBy('collector_id', 'collectors.name', 'collectors.phone')
      .orderBy('total_earnings', 'desc')
      .limit(10);

    res.json({
      success: true,
      data: {
        stats: stats.rows[0],
        recentBookings,
        topCollectors
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const { role, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = db('users')
      .select('id', 'phone', 'email', 'name', 'role', 'status', 'is_verified', 'created_at', 'last_login')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    if (role) {
      query = query.where('role', role);
    }

    if (status) {
      query = query.where('status', status);
    }

    const users = await query;

    // Get total count
    let countQuery = db('users');
    if (role) countQuery = countQuery.where('role', role);
    if (status) countQuery = countQuery.where('status', status);
    const total = await countQuery.count('* as count').first();

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total.count),
          pages: Math.ceil(total.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update user status
router.put('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active, inactive, or suspended'
      });
    }

    const user = await db('users')
      .where('id', id)
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await db('users')
      .where('id', id)
      .update({
        status,
        updated_at: new Date()
      });

    res.json({
      success: true,
      message: 'User status updated successfully'
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify collector
router.put('/users/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await db('users')
      .where('id', id)
      .where('role', 'collector')
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Collector not found'
      });
    }

    await db('users')
      .where('id', id)
      .update({
        is_verified: true,
        updated_at: new Date()
      });

    res.json({
      success: true,
      message: 'Collector verified successfully'
    });
  } catch (error) {
    console.error('Verify collector error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all bookings
router.get('/bookings', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = db('bookings')
      .select(
        'bookings.*',
        'customers.name as customer_name',
        'customers.phone as customer_phone',
        'collectors.name as collector_name',
        'collectors.phone as collector_phone'
      )
      .leftJoin('users as customers', 'bookings.customer_id', 'customers.id')
      .leftJoin('users as collectors', 'bookings.collector_id', 'collectors.id')
      .orderBy('bookings.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    if (status) {
      query = query.where('bookings.status', status);
    }

    const bookings = await query;

    // Get total count
    let countQuery = db('bookings');
    if (status) countQuery = countQuery.where('status', status);
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

// Get all payments
router.get('/payments', async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = db('payments')
      .select(
        'payments.*',
        'customers.name as customer_name',
        'customers.phone as customer_phone',
        'collectors.name as collector_name',
        'collectors.phone as collector_phone'
      )
      .leftJoin('users as customers', 'payments.customer_id', 'customers.id')
      .leftJoin('users as collectors', 'payments.collector_id', 'collectors.id')
      .orderBy('payments.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    if (status) {
      query = query.where('payments.status', status);
    }

    if (type) {
      query = query.where('payments.type', type);
    }

    const payments = await query;

    // Get total count
    let countQuery = db('payments');
    if (status) countQuery = countQuery.where('status', status);
    if (type) countQuery = countQuery.where('type', type);
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
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get inventory reports
router.get('/inventory', async (req, res) => {
  try {
    const { material_id, collector_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = db('inventory')
      .select(
        'inventory.*',
        'materials.name as material_name',
        'materials.category',
        'collectors.name as collector_name',
        'customers.name as customer_name'
      )
      .leftJoin('materials', 'inventory.material_id', 'materials.id')
      .leftJoin('users as collectors', 'inventory.collector_id', 'collectors.id')
      .leftJoin('bookings', 'inventory.booking_id', 'bookings.id')
      .leftJoin('users as customers', 'bookings.customer_id', 'customers.id')
      .orderBy('inventory.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    if (material_id) {
      query = query.where('inventory.material_id', material_id);
    }

    if (collector_id) {
      query = query.where('inventory.collector_id', collector_id);
    }

    const inventory = await query;

    // Get total count
    let countQuery = db('inventory');
    if (material_id) countQuery = countQuery.where('material_id', material_id);
    if (collector_id) countQuery = countQuery.where('collector_id', collector_id);
    const total = await countQuery.count('* as count').first();

    res.json({
      success: true,
      data: {
        inventory,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total.count),
          pages: Math.ceil(total.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get analytics data
router.get('/analytics', async (req, res) => {
  try {
    const { period = '30' } = req.query; // days

    // Bookings over time
    const bookingsOverTime = await db('bookings')
      .select(
        db.raw('DATE(created_at) as date'),
        db.raw('COUNT(*) as count'),
        db.raw('COUNT(CASE WHEN status = \'completed\' THEN 1 END) as completed')
      )
      .where('created_at', '>=', db.raw(`NOW() - INTERVAL '${period} days'`))
      .groupBy('date')
      .orderBy('date');

    // Revenue over time
    const revenueOverTime = await db('payments')
      .select(
        db.raw('DATE(created_at) as date'),
        db.raw('COALESCE(SUM(amount), 0) as amount')
      )
      .where('status', 'completed')
      .where('created_at', '>=', db.raw(`NOW() - INTERVAL '${period} days'`))
      .groupBy('date')
      .orderBy('date');

    // Material distribution
    const materialDistribution = await db('inventory')
      .select(
        'materials.name',
        'materials.category',
        db.raw('COUNT(*) as count'),
        db.raw('COALESCE(SUM(weight), 0) as total_weight'),
        db.raw('COALESCE(SUM(total_value), 0) as total_value')
      )
      .leftJoin('materials', 'inventory.material_id', 'materials.id')
      .where('inventory.created_at', '>=', db.raw(`NOW() - INTERVAL '${period} days'`))
      .groupBy('materials.id', 'materials.name', 'materials.category')
      .orderBy('total_value', 'desc');

    res.json({
      success: true,
      data: {
        bookingsOverTime,
        revenueOverTime,
        materialDistribution
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
