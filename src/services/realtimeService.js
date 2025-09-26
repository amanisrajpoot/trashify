const { Server } = require('socket.io');
const db = require('../config/database');
const notificationService = require('./notificationService');

class RealtimeService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId
    this.collectorLocations = new Map(); // collectorId -> location data
  }

  // Initialize Socket.io
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://yourdomain.com'] 
          : ['http://localhost:3000', 'http://localhost:3001'],
        methods: ['GET', 'POST']
      }
    });

    this.setupEventHandlers();
    console.log('✅ Socket.io initialized');
  }

  // Setup event handlers
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`📱 User connected: ${socket.id}`);

      // User authentication
      socket.on('authenticate', async (data) => {
        try {
          const { userId, userRole } = data;
          this.connectedUsers.set(userId, socket.id);
          socket.userId = userId;
          socket.userRole = userRole;
          
          // Join role-based rooms
          socket.join(`user_${userId}`);
          socket.join(`role_${userRole}`);
          
          console.log(`✅ User ${userId} authenticated as ${userRole}`);
          
          socket.emit('authenticated', {
            success: true,
            message: 'Authentication successful'
          });
        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('auth_error', {
            success: false,
            message: 'Authentication failed'
          });
        }
      });

      // Join booking room for real-time updates
      socket.on('join_booking', (bookingId) => {
        socket.join(`booking_${bookingId}`);
        console.log(`📋 User joined booking room: ${bookingId}`);
      });

      // Leave booking room
      socket.on('leave_booking', (bookingId) => {
        socket.leave(`booking_${bookingId}`);
        console.log(`📋 User left booking room: ${bookingId}`);
      });

      // Handle location updates from collectors
      socket.on('location_update', async (data) => {
        try {
          if (socket.userRole !== 'collector') {
            socket.emit('error', { message: 'Only collectors can update location' });
            return;
          }

          const { latitude, longitude, bookingId } = data;
          
          // Update collector location in database
          await this.updateCollectorLocation(socket.userId, latitude, longitude);
          
          // Store in memory for quick access
          this.collectorLocations.set(socket.userId, {
            latitude,
            longitude,
            timestamp: new Date(),
            bookingId
          });

          // Broadcast to booking room if bookingId provided
          if (bookingId) {
            this.io.to(`booking_${bookingId}`).emit('collector_location_update', {
              collectorId: socket.userId,
              latitude,
              longitude,
              timestamp: new Date()
            });
          }

          console.log(`📍 Collector ${socket.userId} location updated`);
        } catch (error) {
          console.error('Location update error:', error);
          socket.emit('error', { message: 'Failed to update location' });
        }
      });

      // Handle status updates
      socket.on('status_update', async (data) => {
        try {
          const { bookingId, status, notes } = data;
          
          // Update booking status in database
          const result = await this.updateBookingStatus(
            bookingId,
            status,
            socket.userId,
            socket.userRole,
            notes
          );

          if (result.success) {
            // Broadcast to booking room
            this.io.to(`booking_${bookingId}`).emit('booking_status_update', {
              bookingId,
              status,
              notes,
              updatedBy: socket.userId,
              timestamp: new Date()
            });

            // Send push notification
            await this.sendStatusNotification(bookingId, status, socket.userId);
          } else {
            socket.emit('error', { message: result.message });
          }
        } catch (error) {
          console.error('Status update error:', error);
          socket.emit('error', { message: 'Failed to update status' });
        }
      });

      // Handle messages
      socket.on('send_message', async (data) => {
        try {
          const { bookingId, message, receiverId } = data;
          
          // Save message to database
          const messageId = await this.saveMessage({
            bookingId,
            senderId: socket.userId,
            receiverId,
            message,
            messageType: 'text'
          });

          // Send to receiver
          const receiverSocketId = this.connectedUsers.get(receiverId);
          if (receiverSocketId) {
            this.io.to(receiverSocketId).emit('new_message', {
              id: messageId,
              bookingId,
              senderId: socket.userId,
              message,
              timestamp: new Date()
            });
          }

          // Send to booking room
          this.io.to(`booking_${bookingId}`).emit('new_message', {
            id: messageId,
            bookingId,
            senderId: socket.userId,
            message,
            timestamp: new Date()
          });

          console.log(`💬 Message sent in booking ${bookingId}`);
        } catch (error) {
          console.error('Send message error:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
          console.log(`📱 User disconnected: ${socket.userId}`);
        }
      });
    });
  }

  // Update collector location in database
  async updateCollectorLocation(collectorId, latitude, longitude) {
    try {
      const { v4: uuidv4 } = require('uuid');
      
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

      return { success: true };
    } catch (error) {
      console.error('Update collector location error:', error);
      return { success: false, message: error.message };
    }
  }

  // Update booking status
  async updateBookingStatus(bookingId, status, userId, userRole, notes) {
    try {
      const bookingService = require('./bookingService');
      return await bookingService.updateBookingStatus(bookingId, status, userId, userRole, notes);
    } catch (error) {
      console.error('Update booking status error:', error);
      return { success: false, message: error.message };
    }
  }

  // Save message to database
  async saveMessage(messageData) {
    try {
      const { v4: uuidv4 } = require('uuid');
      
      const message = {
        id: uuidv4(),
        ...messageData,
        created_at: new Date(),
        updated_at: new Date()
      };

      await db('messages').insert(message);
      return message.id;
    } catch (error) {
      console.error('Save message error:', error);
      throw error;
    }
  }

  // Send status notification
  async sendStatusNotification(bookingId, status, updatedBy) {
    try {
      // Get booking details
      const booking = await db('bookings')
        .where('id', bookingId)
        .first();

      if (!booking) return;

      // Send notification to customer
      if (booking.customer_id && booking.customer_id !== updatedBy) {
        const customerNotification = this.getStatusNotification(status, 'customer');
        await notificationService.sendNotification(booking.customer_id, customerNotification);
      }

      // Send notification to collector
      if (booking.collector_id && booking.collector_id !== updatedBy) {
        const collectorNotification = this.getStatusNotification(status, 'collector');
        await notificationService.sendNotification(booking.collector_id, collectorNotification);
      }
    } catch (error) {
      console.error('Send status notification error:', error);
    }
  }

  // Get status notification data
  getStatusNotification(status, userType) {
    const notifications = {
      customer: {
        pending: { title: 'Booking Pending', message: 'Your pickup request is being processed' },
        assigned: { title: 'Collector Assigned', message: 'A collector has been assigned to your pickup' },
        in_progress: { title: 'Pickup Started', message: 'Your collector has started the pickup' },
        completed: { title: 'Pickup Completed', message: 'Your pickup has been completed successfully' },
        cancelled: { title: 'Pickup Cancelled', message: 'Your pickup has been cancelled' }
      },
      collector: {
        assigned: { title: 'New Assignment', message: 'You have been assigned a new pickup' },
        in_progress: { title: 'Pickup Started', message: 'You have started the pickup' },
        completed: { title: 'Pickup Completed', message: 'Pickup completed successfully' },
        cancelled: { title: 'Pickup Cancelled', message: 'The pickup has been cancelled' }
      }
    };

    return notifications[userType]?.[status] || {
      title: 'Status Update',
      message: `Booking status updated to ${status}`
    };
  }

  // Broadcast to specific user
  broadcastToUser(userId, event, data) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  // Broadcast to booking room
  broadcastToBooking(bookingId, event, data) {
    this.io.to(`booking_${bookingId}`).emit(event, data);
  }

  // Broadcast to role
  broadcastToRole(role, event, data) {
    this.io.to(`role_${role}`).emit(event, data);
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Get collector locations
  getCollectorLocations() {
    return Array.from(this.collectorLocations.entries()).map(([collectorId, location]) => ({
      collectorId,
      ...location
    }));
  }
}

module.exports = new RealtimeService();
