const express = require('express');
const { db } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all materials
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;

    let query = db('materials')
      .select('*')
      .where('is_active', true)
      .orderBy('category', 'asc')
      .orderBy('name', 'asc');

    if (category) {
      query = query.where('category', category);
    }

    const materials = await query;

    res.json({
      success: true,
      data: { materials }
    });
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get material by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const material = await db('materials')
      .select('*')
      .where('id', id)
      .where('is_active', true)
      .first();

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    res.json({
      success: true,
      data: { material }
    });
  } catch (error) {
    console.error('Get material error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create material (admin only)
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const {
      name,
      category,
      description,
      price_per_kg,
      unit = 'kg',
      requirements,
      image_url
    } = req.body;

    if (!name || !category || !price_per_kg) {
      return res.status(400).json({
        success: false,
        message: 'Name, category, and price per kg are required'
      });
    }

    const [material] = await db('materials')
      .insert({
        name,
        category,
        description,
        price_per_kg,
        unit,
        requirements: requirements ? JSON.stringify(requirements) : null,
        image_url
      })
      .returning('*');

    res.status(201).json({
      success: true,
      message: 'Material created successfully',
      data: { material }
    });
  } catch (error) {
    console.error('Create material error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update material (admin only)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      description,
      price_per_kg,
      unit,
      requirements,
      image_url,
      is_active
    } = req.body;

    const material = await db('materials')
      .where('id', id)
      .first();

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    const [updatedMaterial] = await db('materials')
      .where('id', id)
      .update({
        name: name || material.name,
        category: category || material.category,
        description: description !== undefined ? description : material.description,
        price_per_kg: price_per_kg || material.price_per_kg,
        unit: unit || material.unit,
        requirements: requirements ? JSON.stringify(requirements) : material.requirements,
        image_url: image_url !== undefined ? image_url : material.image_url,
        is_active: is_active !== undefined ? is_active : material.is_active,
        updated_at: new Date()
      })
      .returning('*');

    res.json({
      success: true,
      message: 'Material updated successfully',
      data: { material: updatedMaterial }
    });
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete material (admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const material = await db('materials')
      .where('id', id)
      .first();

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    // Soft delete by setting is_active to false
    await db('materials')
      .where('id', id)
      .update({
        is_active: false,
        updated_at: new Date()
      });

    res.json({
      success: true,
      message: 'Material deleted successfully'
    });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get material categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await db('materials')
      .select('category')
      .where('is_active', true)
      .distinct()
      .orderBy('category');

    res.json({
      success: true,
      data: { categories: categories.map(c => c.category) }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
