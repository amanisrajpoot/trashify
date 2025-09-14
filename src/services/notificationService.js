const admin = require('firebase-admin');
const { db } = require('../config/database');

// Initialize Firebase Admin SDK only if credentials are available
let firebaseApp = null;

if (process.env.FCM_PROJECT_ID && process.env.FCM_PRIVATE_KEY && process.env.FCM_CLIENT_EMAIL) {
  try {
    if (!admin.apps.length) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FCM_PROJECT_ID,
          privateKey: process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FCM_CLIENT_EMAIL,
        }),
      });
      console.log('✅ Firebase Admin SDK initialized');
    }
  } catch (error) {
    console.warn('⚠️  Firebase Admin SDK initialization failed:', error.message);
    console.warn('   Notifications will be logged but not sent');
  }
} else {
  console.warn('⚠️  Firebase credentials not found. Notifications will be logged but not sent');
}

// Send notification to a specific user
async function sendNotification(userId, notificationData) {
  try {
    const { title, message, type = 'system', data = {} } = notificationData;

    // Save notification to database
    const [notification] = await db('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        data: JSON.stringify(data),
        status: 'unread'
      })
      .returning('*');

    // Get user's FCM token (you'll need to store this when users register)
    const user = await db('users')
      .select('fcm_token')
      .where('id', userId)
      .first();

    if (user && user.fcm_token && firebaseApp) {
      // Send push notification
      const message = {
        notification: {
          title,
          body: message
        },
        data: {
          type,
          ...data
        },
        token: user.fcm_token
      };

      await admin.messaging().send(message);
    } else if (user && user.fcm_token) {
      console.log('📱 Notification would be sent (Firebase not available):', { title, message });
    }

    return notification;
  } catch (error) {
    console.error('Send notification error:', error);
    throw error;
  }
}

// Send notification to multiple users
async function sendBulkNotification(userIds, notificationData) {
  try {
    const { title, message, type = 'system', data = {} } = notificationData;

    // Save notifications to database
    const notifications = [];
    for (const userId of userIds) {
      const [notification] = await db('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          data: JSON.stringify(data),
          status: 'unread'
        })
        .returning('*');
      notifications.push(notification);
    }

    // Get FCM tokens for all users
    const users = await db('users')
      .select('id', 'fcm_token')
      .whereIn('id', userIds)
      .whereNotNull('fcm_token');

    if (users.length > 0 && firebaseApp) {
      // Send push notifications
      const messages = users.map(user => ({
        notification: {
          title,
          body: message
        },
        data: {
          type,
          ...data
        },
        token: user.fcm_token
      }));

      await admin.messaging().sendAll(messages);
    } else if (users.length > 0) {
      console.log('📱 Bulk notification would be sent (Firebase not available):', { title, message, count: users.length });
    }

    return notifications;
  } catch (error) {
    console.error('Send bulk notification error:', error);
    throw error;
  }
}

// Send notification to users by role
async function sendNotificationByRole(role, notificationData) {
  try {
    const users = await db('users')
      .select('id')
      .where('role', role)
      .where('status', 'active');

    const userIds = users.map(user => user.id);
    
    if (userIds.length > 0) {
      return await sendBulkNotification(userIds, notificationData);
    }

    return [];
  } catch (error) {
    console.error('Send notification by role error:', error);
    throw error;
  }
}

// Send notification to nearby collectors
async function sendNotificationToNearbyCollectors(latitude, longitude, radius, notificationData) {
  try {
    const collectors = await db('collector_locations')
      .select('collector_id')
      .where('status', 'available')
      .where('last_updated', '>', db.raw("NOW() - INTERVAL '30 minutes'"))
      .where(db.raw(`
        6371 * acos(
          cos(radians(?)) * cos(radians(latitude)) * 
          cos(radians(longitude) - radians(?)) + 
          sin(radians(?)) * sin(radians(latitude))
        ) <= ?
      `, [latitude, longitude, latitude, radius]));

    const collectorIds = collectors.map(collector => collector.collector_id);
    
    if (collectorIds.length > 0) {
      return await sendBulkNotification(collectorIds, notificationData);
    }

    return [];
  } catch (error) {
    console.error('Send notification to nearby collectors error:', error);
    throw error;
  }
}

// Update user's FCM token
async function updateFCMToken(userId, fcmToken) {
  try {
    await db('users')
      .where('id', userId)
      .update({
        fcm_token: fcmToken,
        updated_at: new Date()
      });

    return true;
  } catch (error) {
    console.error('Update FCM token error:', error);
    throw error;
  }
}

// Send booking status update notification
async function sendBookingStatusNotification(bookingId, status) {
  try {
    const booking = await db('bookings')
      .select('customer_id', 'collector_id', 'estimated_value', 'actual_value')
      .where('id', bookingId)
      .first();

    if (!booking) {
      throw new Error('Booking not found');
    }

    let title, message;
    const data = { booking_id: bookingId };

    switch (status) {
      case 'accepted':
        title = 'Pickup Request Accepted';
        message = 'Your pickup request has been accepted by a collector';
        break;
      case 'in_progress':
        title = 'Pickup In Progress';
        message = 'The collector is on their way to your location';
        break;
      case 'completed':
        title = 'Pickup Completed';
        message = `Your pickup has been completed. Amount: ₹${booking.actual_value || booking.estimated_value}`;
        data.amount = booking.actual_value || booking.estimated_value;
        break;
      case 'cancelled':
        title = 'Pickup Cancelled';
        message = 'Your pickup request has been cancelled';
        break;
      default:
        return;
    }

    // Send to customer
    if (booking.customer_id) {
      await sendNotification(booking.customer_id, {
        title,
        message,
        type: 'booking',
        data
      });
    }

    // Send to collector if applicable
    if (booking.collector_id && ['in_progress', 'completed'].includes(status)) {
      await sendNotification(booking.collector_id, {
        title: `Booking ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Booking #${bookingId} has been ${status}`,
        type: 'booking',
        data
      });
    }
  } catch (error) {
    console.error('Send booking status notification error:', error);
    throw error;
  }
}

module.exports = {
  sendNotification,
  sendBulkNotification,
  sendNotificationByRole,
  sendNotificationToNearbyCollectors,
  updateFCMToken,
  sendBookingStatusNotification
};
