const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const notificationService = require('./notificationService');

class CollectorAssignmentService {
  // Find available collectors near a location
  async findNearbyCollectors(latitude, longitude, radiusKm = 10) {
    try {
      // Using Haversine formula for distance calculation
      const query = `
        SELECT 
          u.*,
          cl.latitude,
          cl.longitude,
          cl.last_updated,
          (
            6371 * acos(
              cos(radians(?)) * cos(radians(cl.latitude)) * 
              cos(radians(cl.longitude) - radians(?)) + 
              sin(radians(?)) * sin(radians(cl.latitude))
            )
          ) AS distance_km
        FROM users u
        LEFT JOIN collector_locations cl ON u.id = cl.collector_id
        WHERE u.role = 'collector' 
          AND u.status = 'active'
          AND cl.latitude IS NOT NULL 
          AND cl.longitude IS NOT NULL
          AND cl.last_updated > datetime('now', '-1 hour')
        HAVING distance_km <= ?
        ORDER BY distance_km ASC
      `;

      const collectors = await db.raw(query, [latitude, longitude, latitude, radiusKm]);
      
      return {
        success: true,
        collectors: collectors[0] || []
      };

    } catch (error) {
      console.error('Find nearby collectors error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Get collector availability and workload
  async getCollectorAvailability(collectorId, date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Get active bookings for the day
      const activeBookings = await db('bookings')
        .where('collector_id', collectorId)
        .where('status', 'in', ['assigned', 'in_progress'])
        .whereBetween('preferred_pickup_date', [startOfDay, endOfDay])
        .count('* as count')
        .first();

      // Get collector's max daily capacity
      const collector = await db('users')
        .where('id', collectorId)
        .select('metadata')
        .first();

      const maxDailyCapacity = collector?.metadata ? 
        JSON.parse(collector.metadata).max_daily_capacity || 10 : 10;

      const currentLoad = parseInt(activeBookings.count);
      const isAvailable = currentLoad < maxDailyCapacity;

      return {
        success: true,
        availability: {
          isAvailable,
          currentLoad,
          maxCapacity: maxDailyCapacity,
          remainingCapacity: maxDailyCapacity - currentLoad
        }
      };

    } catch (error) {
      console.error('Get collector availability error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Auto-assign collector to booking
  async autoAssignCollector(bookingId) {
    try {
      // Get booking details
      const booking = await db('bookings')
        .where('id', bookingId)
        .first();

      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.status !== 'pending') {
        throw new Error('Booking is not in pending status');
      }

      // Find nearby collectors
      const nearbyResult = await this.findNearbyCollectors(
        booking.latitude,
        booking.longitude,
        15 // 15km radius
      );

      if (!nearbyResult.success || nearbyResult.collectors.length === 0) {
        return {
          success: false,
          message: 'No collectors available in the area'
        };
      }

      // Check availability for each collector
      const availableCollectors = [];
      
      for (const collector of nearbyResult.collectors) {
        const availability = await this.getCollectorAvailability(
          collector.id,
          booking.preferred_pickup_date
        );

        if (availability.success && availability.availability.isAvailable) {
          availableCollectors.push({
            ...collector,
            availability: availability.availability
          });
        }
      }

      if (availableCollectors.length === 0) {
        return {
          success: false,
          message: 'No collectors available for the requested date'
        };
      }

      // Select best collector based on criteria
      const bestCollector = this.selectBestCollector(availableCollectors, booking);

      // Assign collector
      const assignmentResult = await this.assignCollectorToBooking(
        bookingId,
        bestCollector.id,
        'system'
      );

      if (assignmentResult.success) {
        // Send notification to collector
        await notificationService.sendNotification(bestCollector.id, {
          title: 'New Pickup Assignment',
          message: `You have been assigned a pickup in ${booking.city}`,
          type: 'booking_assigned',
          data: {
            booking_id: bookingId,
            customer_name: booking.contact_person,
            pickup_address: booking.pickup_address,
            scheduled_date: booking.preferred_pickup_date
          }
        });

        return {
          success: true,
          message: 'Collector assigned successfully',
          collector: {
            id: bestCollector.id,
            name: bestCollector.name,
            distance: bestCollector.distance_km
          }
        };
      }

      return assignmentResult;

    } catch (error) {
      console.error('Auto assign collector error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Select best collector based on multiple criteria
  selectBestCollector(collectors, booking) {
    // Scoring criteria:
    // 1. Distance (40% weight) - closer is better
    // 2. Availability (30% weight) - more capacity is better
    // 3. Rating (20% weight) - higher rating is better
    // 4. Response time (10% weight) - faster response is better

    const scoredCollectors = collectors.map(collector => {
      let score = 0;

      // Distance score (0-40 points, closer is better)
      const maxDistance = 15; // km
      const distanceScore = Math.max(0, 40 - (collector.distance_km / maxDistance) * 40);
      score += distanceScore;

      // Availability score (0-30 points, more capacity is better)
      const availabilityScore = (collector.availability.remainingCapacity / collector.availability.maxCapacity) * 30;
      score += availabilityScore;

      // Rating score (0-20 points, higher rating is better)
      const rating = collector.rating || 3.0; // default 3.0 if no rating
      const ratingScore = (rating / 5.0) * 20;
      score += ratingScore;

      // Response time score (0-10 points, faster is better)
      const responseTime = this.calculateResponseTime(collector);
      const responseScore = Math.max(0, 10 - (responseTime / 60) * 2); // 2 points per minute
      score += responseScore;

      return {
        ...collector,
        score
      };
    });

    // Sort by score (highest first)
    scoredCollectors.sort((a, b) => b.score - a.score);

    return scoredCollectors[0];
  }

  // Calculate collector's average response time
  calculateResponseTime(collector) {
    // This would typically be calculated from historical data
    // For now, return a default value based on distance
    return collector.distance_km * 2; // 2 minutes per km
  }

  // Assign collector to booking
  async assignCollectorToBooking(bookingId, collectorId, assignedBy) {
    const trx = await db.transaction();
    
    try {
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
        notes: `Auto-assigned to collector`,
        changed_by: assignedBy,
        changed_by_role: 'system',
        changed_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      });

      await trx.commit();

      return {
        success: true,
        message: 'Collector assigned successfully'
      };

    } catch (error) {
      await trx.rollback();
      console.error('Assign collector to booking error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Get collector performance metrics
  async getCollectorPerformance(collectorId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const metrics = await db('bookings')
        .where('collector_id', collectorId)
        .where('created_at', '>=', startDate)
        .select(
          db.raw('COUNT(*) as total_bookings'),
          db.raw('COUNT(CASE WHEN status = "completed" THEN 1 END) as completed_bookings'),
          db.raw('COUNT(CASE WHEN status = "cancelled" THEN 1 END) as cancelled_bookings'),
          db.raw('AVG(CASE WHEN status = "completed" THEN customer_rating END) as avg_rating'),
          db.raw('AVG(CASE WHEN status = "completed" THEN actual_amount END) as avg_earnings')
        )
        .first();

      const completionRate = metrics.total_bookings > 0 ? 
        (metrics.completed_bookings / metrics.total_bookings) * 100 : 0;

      return {
        success: true,
        performance: {
          totalBookings: parseInt(metrics.total_bookings),
          completedBookings: parseInt(metrics.completed_bookings),
          cancelledBookings: parseInt(metrics.cancelled_bookings),
          completionRate: Math.round(completionRate * 100) / 100,
          averageRating: parseFloat(metrics.avg_rating) || 0,
          averageEarnings: parseFloat(metrics.avg_earnings) || 0
        }
      };

    } catch (error) {
      console.error('Get collector performance error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Update collector location
  async updateCollectorLocation(collectorId, latitude, longitude) {
    try {
      const locationData = {
        collector_id: collectorId,
        latitude,
        longitude,
        last_updated: new Date(),
        updated_at: new Date()
      };

      // Check if location exists
      const existing = await db('collector_locations')
        .where('collector_id', collectorId)
        .first();

      if (existing) {
        await db('collector_locations')
          .where('collector_id', collectorId)
          .update(locationData);
      } else {
        await db('collector_locations').insert({
          id: uuidv4(),
          ...locationData,
          created_at: new Date()
        });
      }

      return {
        success: true,
        message: 'Location updated successfully'
      };

    } catch (error) {
      console.error('Update collector location error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

module.exports = new CollectorAssignmentService();
