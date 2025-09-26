const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const notificationService = require('./notificationService');

class BookingService {
  // Create a new booking
  async createBooking(bookingData) {
    const trx = await db.transaction();
    
    try {
      const {
        customer_id,
        pickup_address,
        latitude,
        longitude,
        landmark,
        city,
        state,
        pincode,
        preferred_pickup_date,
        time_slot,
        special_instructions,
        contact_person,
        contact_phone,
        materials,
        requires_assistance = false,
        priority = 'medium'
      } = bookingData;

      // Calculate estimated amount
      let estimated_weight = 0;
      let estimated_amount = 0;
      const materialDetails = [];

      for (const material of materials) {
        const materialInfo = await trx('materials')
          .where('id', material.material_id)
          .first();
        
        if (!materialInfo) {
          throw new Error(`Material with ID ${material.material_id} not found`);
        }

        const totalPrice = material.quantity * materialInfo.price_per_kg;
        estimated_weight += material.quantity;
        estimated_amount += totalPrice;

        materialDetails.push({
          material_id: material.material_id,
          quantity: material.quantity,
          unit_price: materialInfo.price_per_kg,
          total_price: totalPrice
        });
      }

      // Create booking
      const bookingId = uuidv4();
      const booking = {
        id: bookingId,
        customer_id,
        pickup_address,
        latitude,
        longitude,
        landmark,
        city,
        state,
        pincode,
        preferred_pickup_date,
        time_slot,
        special_instructions,
        contact_person,
        contact_phone,
        requires_assistance,
        priority,
        estimated_weight,
        estimated_amount,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date()
      };

      await trx('bookings').insert(booking);

      // Insert booking materials
      for (const material of materialDetails) {
        await trx('booking_materials').insert({
          id: uuidv4(),
          booking_id: bookingId,
          ...material,
          created_at: new Date(),
          updated_at: new Date()
        });
      }

      // Create initial status history
      await trx('booking_status_history').insert({
        id: uuidv4(),
        booking_id: bookingId,
        status: 'pending',
        previous_status: null,
        notes: 'Booking created',
        changed_by: customer_id,
        changed_by_role: 'customer',
        changed_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      });

      await trx.commit();

      // Send notification to customer
      await notificationService.sendNotification(customer_id, {
        title: 'Booking Confirmed',
        message: `Your pickup has been scheduled for ${preferred_pickup_date}`,
        type: 'booking_created'
      });

      return {
        success: true,
        booking: {
          ...booking,
          materials: materialDetails
        }
      };

    } catch (error) {
      await trx.rollback();
      console.error('Create booking error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Get bookings by customer
  async getCustomerBookings(customerId, status = null, limit = 20, offset = 0) {
    try {
      let query = db('bookings')
        .leftJoin('users as collectors', 'bookings.collector_id', 'collectors.id')
        .leftJoin('booking_materials', 'bookings.id', 'booking_materials.booking_id')
        .leftJoin('materials', 'booking_materials.material_id', 'materials.id')
        .where('bookings.customer_id', customerId)
        .select(
          'bookings.*',
          'collectors.name as collector_name',
          'collectors.phone as collector_phone',
          'collectors.profile_image_url as collector_image'
        );

      if (status) {
        query = query.where('bookings.status', status);
      }

      const bookings = await query
        .orderBy('bookings.created_at', 'desc')
        .limit(limit)
        .offset(offset);

      // Get materials for each booking
      for (const booking of bookings) {
        const materials = await db('booking_materials')
          .leftJoin('materials', 'booking_materials.material_id', 'materials.id')
          .where('booking_materials.booking_id', booking.id)
          .select(
            'booking_materials.*',
            'materials.name as material_name',
            'materials.category as material_category',
            'materials.image_url as material_image'
          );
        
        booking.materials = materials;
      }

      return {
        success: true,
        bookings
      };

    } catch (error) {
      console.error('Get customer bookings error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Get bookings by collector
  async getCollectorBookings(collectorId, status = null, limit = 20, offset = 0) {
    try {
      let query = db('bookings')
        .leftJoin('users as customers', 'bookings.customer_id', 'customers.id')
        .leftJoin('booking_materials', 'bookings.id', 'booking_materials.booking_id')
        .leftJoin('materials', 'booking_materials.material_id', 'materials.id')
        .where('bookings.collector_id', collectorId)
        .select(
          'bookings.*',
          'customers.name as customer_name',
          'customers.phone as customer_phone',
          'customers.profile_image_url as customer_image'
        );

      if (status) {
        query = query.where('bookings.status', status);
      }

      const bookings = await query
        .orderBy('bookings.created_at', 'desc')
        .limit(limit)
        .offset(offset);

      // Get materials for each booking
      for (const booking of bookings) {
        const materials = await db('booking_materials')
          .leftJoin('materials', 'booking_materials.material_id', 'materials.id')
          .where('booking_materials.booking_id', booking.id)
          .select(
            'booking_materials.*',
            'materials.name as material_name',
            'materials.category as material_category',
            'materials.image_url as material_image'
          );
        
        booking.materials = materials;
      }

      return {
        success: true,
        bookings
      };

    } catch (error) {
      console.error('Get collector bookings error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Update booking status
  async updateBookingStatus(bookingId, status, userId, userRole, notes = null) {
    const trx = await db.transaction();
    
    try {
      // Get current booking
      const booking = await trx('bookings').where('id', bookingId).first();
      if (!booking) {
        throw new Error('Booking not found');
      }

      const previousStatus = booking.status;

      // Update booking status
      const updateData = {
        status,
        updated_at: new Date()
      };

      // Set specific timestamps based on status
      switch (status) {
        case 'assigned':
          updateData.assigned_at = new Date();
          break;
        case 'in_progress':
          updateData.started_at = new Date();
          break;
        case 'completed':
          updateData.completed_at = new Date();
          break;
        case 'cancelled':
          updateData.cancelled_at = new Date();
          break;
      }

      await trx('bookings').where('id', bookingId).update(updateData);

      // Create status history entry
      await trx('booking_status_history').insert({
        id: uuidv4(),
        booking_id: bookingId,
        status,
        previous_status: previousStatus,
        notes: notes || `Status changed to ${status}`,
        changed_by: userId,
        changed_by_role: userRole,
        changed_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      });

      await trx.commit();

      // Send notifications
      const notificationData = this.getStatusNotificationData(status, booking);
      if (booking.customer_id) {
        await notificationService.sendNotification(booking.customer_id, notificationData.customer);
      }
      if (booking.collector_id) {
        await notificationService.sendNotification(booking.collector_id, notificationData.collector);
      }

      return {
        success: true,
        booking: {
          ...booking,
          ...updateData
        }
      };

    } catch (error) {
      await trx.rollback();
      console.error('Update booking status error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Assign collector to booking
  async assignCollector(bookingId, collectorId, assignedBy) {
    const trx = await db.transaction();
    
    try {
      // Check if collector is available
      const collector = await trx('users')
        .where('id', collectorId)
        .where('role', 'collector')
        .where('status', 'active')
        .first();

      if (!collector) {
        throw new Error('Collector not found or not available');
      }

      // Update booking
      await trx('bookings')
        .where('id', bookingId)
        .update({
          collector_id: collectorId,
          status: 'assigned',
          assigned_at: new Date(),
          updated_at: new Date()
        });

      // Create status history
      await trx('booking_status_history').insert({
        id: uuidv4(),
        booking_id: bookingId,
        status: 'assigned',
        previous_status: 'pending',
        notes: `Assigned to collector ${collector.name}`,
        changed_by: assignedBy,
        changed_by_role: 'admin',
        changed_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      });

      await trx.commit();

      // Send notification to collector
      await notificationService.sendNotification(collectorId, {
        title: 'New Pickup Assignment',
        message: 'You have been assigned a new pickup request',
        type: 'booking_assigned'
      });

      return {
        success: true,
        message: 'Collector assigned successfully'
      };

    } catch (error) {
      await trx.rollback();
      console.error('Assign collector error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Get status notification data
  getStatusNotificationData(status, booking) {
    const notifications = {
      customer: {},
      collector: {}
    };

    switch (status) {
      case 'assigned':
        notifications.customer = {
          title: 'Collector Assigned',
          message: 'A collector has been assigned to your pickup',
          type: 'booking_assigned'
        };
        break;
      case 'in_progress':
        notifications.customer = {
          title: 'Pickup Started',
          message: 'Your collector has started the pickup',
          type: 'booking_started'
        };
        break;
      case 'completed':
        notifications.customer = {
          title: 'Pickup Completed',
          message: 'Your pickup has been completed successfully',
          type: 'booking_completed'
        };
        break;
      case 'cancelled':
        notifications.customer = {
          title: 'Pickup Cancelled',
          message: 'Your pickup has been cancelled',
          type: 'booking_cancelled'
        };
        break;
    }

    return notifications;
  }

  // Cancel booking
  async cancelBooking(bookingId, userId, userRole, reason) {
    return await this.updateBookingStatus(
      bookingId,
      'cancelled',
      userId,
      userRole,
      `Cancelled: ${reason}`
    );
  }

  // Get booking by ID
  async getBookingById(bookingId) {
    try {
      const booking = await db('bookings')
        .leftJoin('users as customers', 'bookings.customer_id', 'customers.id')
        .leftJoin('users as collectors', 'bookings.collector_id', 'collectors.id')
        .where('bookings.id', bookingId)
        .select(
          'bookings.*',
          'customers.name as customer_name',
          'customers.phone as customer_phone',
          'customers.profile_image_url as customer_image',
          'collectors.name as collector_name',
          'collectors.phone as collector_phone',
          'collectors.profile_image_url as collector_image'
        )
        .first();

      if (!booking) {
        return {
          success: false,
          message: 'Booking not found'
        };
      }

      // Get materials
      const materials = await db('booking_materials')
        .leftJoin('materials', 'booking_materials.material_id', 'materials.id')
        .where('booking_materials.booking_id', bookingId)
        .select(
          'booking_materials.*',
          'materials.name as material_name',
          'materials.category as material_category',
          'materials.image_url as material_image'
        );

      booking.materials = materials;

      return {
        success: true,
        booking
      };

    } catch (error) {
      console.error('Get booking by ID error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Update booking details
  async updateBookingDetails(bookingId, updateData, userId, userRole) {
    const trx = await db.transaction();
    
    try {
      // Get current booking
      const booking = await trx('bookings').where('id', bookingId).first();
      if (!booking) {
        await trx.rollback();
        return {
          success: false,
          message: 'Booking not found'
        };
      }

      // Check permissions
      if (userRole === 'customer' && booking.customer_id !== userId) {
        await trx.rollback();
        return {
          success: false,
          message: 'Access denied'
        };
      }

      if (userRole === 'collector' && booking.collector_id !== userId) {
        await trx.rollback();
        return {
          success: false,
          message: 'Access denied'
        };
      }

      // Check if booking can be updated
      if (['completed', 'cancelled'].includes(booking.status)) {
        await trx.rollback();
        return {
          success: false,
          message: 'Cannot update completed or cancelled booking'
        };
      }

      // Update booking
      const allowedFields = ['pickup_address', 'special_instructions', 'preferred_pickup_date', 'time_slot'];
      const updateFields = {};
      
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          updateFields[field] = updateData[field];
        }
      }

      if (Object.keys(updateFields).length === 0) {
        await trx.rollback();
        return {
          success: false,
          message: 'No valid fields to update'
        };
      }

      updateFields.updated_at = new Date();

      const [updatedBooking] = await trx('bookings')
        .where('id', bookingId)
        .update(updateFields)
        .returning('*');

      await trx.commit();

      return {
        success: true,
        booking: updatedBooking
      };

    } catch (error) {
      await trx.rollback();
      console.error('Update booking details error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Add material to booking
  async addBookingMaterial(bookingId, materialId, quantity, userId) {
    const trx = await db.transaction();
    
    try {
      // Check if booking exists and user has access
      const booking = await trx('bookings')
        .where('id', bookingId)
        .where('customer_id', userId)
        .first();

      if (!booking) {
        await trx.rollback();
        return {
          success: false,
          message: 'Booking not found or access denied'
        };
      }

      // Check if booking can be modified
      if (['completed', 'cancelled'].includes(booking.status)) {
        await trx.rollback();
        return {
          success: false,
          message: 'Cannot modify completed or cancelled booking'
        };
      }

      // Check if material exists
      const material = await trx('materials')
        .where('id', materialId)
        .where('is_active', true)
        .first();

      if (!material) {
        await trx.rollback();
        return {
          success: false,
          message: 'Material not found or inactive'
        };
      }

      // Check if material already exists in booking
      const existingMaterial = await trx('booking_materials')
        .where('booking_id', bookingId)
        .where('material_id', materialId)
        .first();

      if (existingMaterial) {
        // Update quantity
        await trx('booking_materials')
          .where('id', existingMaterial.id)
          .update({
            quantity: existingMaterial.quantity + quantity,
            updated_at: new Date()
          });
      } else {
        // Add new material
        await trx('booking_materials').insert({
          booking_id: bookingId,
          material_id: materialId,
          quantity: quantity,
          created_at: new Date()
        });
      }

      // Recalculate estimated value
      const materials = await trx('booking_materials')
        .leftJoin('materials', 'booking_materials.material_id', 'materials.id')
        .where('booking_materials.booking_id', bookingId)
        .select('booking_materials.quantity', 'materials.price_per_kg');

      let estimatedValue = 0;
      for (const mat of materials) {
        estimatedValue += mat.quantity * mat.price_per_kg;
      }

      await trx('bookings')
        .where('id', bookingId)
        .update({
          estimated_value: estimatedValue,
          updated_at: new Date()
        });

      const updatedBooking = await trx('bookings').where('id', bookingId).first();

      await trx.commit();

      return {
        success: true,
        booking: updatedBooking
      };

    } catch (error) {
      await trx.rollback();
      console.error('Add booking material error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Remove material from booking
  async removeBookingMaterial(bookingId, materialId, userId) {
    const trx = await db.transaction();
    
    try {
      // Check if booking exists and user has access
      const booking = await trx('bookings')
        .where('id', bookingId)
        .where('customer_id', userId)
        .first();

      if (!booking) {
        await trx.rollback();
        return {
          success: false,
          message: 'Booking not found or access denied'
        };
      }

      // Check if booking can be modified
      if (['completed', 'cancelled'].includes(booking.status)) {
        await trx.rollback();
        return {
          success: false,
          message: 'Cannot modify completed or cancelled booking'
        };
      }

      // Remove material
      const deleted = await trx('booking_materials')
        .where('booking_id', bookingId)
        .where('material_id', materialId)
        .del();

      if (deleted === 0) {
        await trx.rollback();
        return {
          success: false,
          message: 'Material not found in booking'
        };
      }

      // Recalculate estimated value
      const materials = await trx('booking_materials')
        .leftJoin('materials', 'booking_materials.material_id', 'materials.id')
        .where('booking_materials.booking_id', bookingId)
        .select('booking_materials.quantity', 'materials.price_per_kg');

      let estimatedValue = 0;
      for (const mat of materials) {
        estimatedValue += mat.quantity * mat.price_per_kg;
      }

      await trx('bookings')
        .where('id', bookingId)
        .update({
          estimated_value: estimatedValue,
          updated_at: new Date()
        });

      const updatedBooking = await trx('bookings').where('id', bookingId).first();

      await trx.commit();

      return {
        success: true,
        booking: updatedBooking
      };

    } catch (error) {
      await trx.rollback();
      console.error('Remove booking material error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Get booking materials
  async getBookingMaterials(bookingId, userId) {
    try {
      // Check if booking exists and user has access
      const booking = await db('bookings')
        .where('id', bookingId)
        .where(function() {
          this.where('customer_id', userId)
            .orWhere('collector_id', userId);
        })
        .first();

      if (!booking) {
        return {
          success: false,
          message: 'Booking not found or access denied'
        };
      }

      const materials = await db('booking_materials')
        .leftJoin('materials', 'booking_materials.material_id', 'materials.id')
        .where('booking_materials.booking_id', bookingId)
        .select(
          'booking_materials.*',
          'materials.name as material_name',
          'materials.category as material_category',
          'materials.price_per_kg',
          'materials.unit',
          'materials.image_url as material_image'
        );

      return {
        success: true,
        materials
      };

    } catch (error) {
      console.error('Get booking materials error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

module.exports = new BookingService();
