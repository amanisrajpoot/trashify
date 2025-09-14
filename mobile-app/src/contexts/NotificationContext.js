import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform, Alert } from 'react-native';
import PushNotification from 'react-native-push-notification';
import messaging from '@react-native-firebase/messaging';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [fcmToken, setFcmToken] = useState(null);

  useEffect(() => {
    initializeNotifications();
    requestPermission();
    getFCMToken();
    setupMessageHandlers();
  }, []);

  const initializeNotifications = () => {
    PushNotification.configure({
      onRegister: function (token) {
        console.log('TOKEN:', token);
      },
      onNotification: function (notification) {
        console.log('NOTIFICATION:', notification);
        
        if (notification.userInteraction) {
          // Handle notification tap
          handleNotificationTap(notification);
        }
      },
      onAction: function (notification) {
        console.log('ACTION:', notification.action);
        console.log('NOTIFICATION:', notification);
      },
      onRegistrationError: function(err) {
        console.error(err.message, err);
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    // Create notification channel for Android
    PushNotification.createChannel(
      {
        channelId: 'trashify-notifications',
        channelName: 'Trashify Notifications',
        channelDescription: 'Notifications for Trashify app',
        playSound: true,
        soundName: 'default',
        importance: 4,
        vibrate: true,
      },
      (created) => console.log(`createChannel returned '${created}'`)
    );
  };

  const requestPermission = async () => {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Authorization status:', authStatus);
      }
    } catch (error) {
      console.error('Permission request error:', error);
    }
  };

  const getFCMToken = async () => {
    try {
      const token = await messaging().getToken();
      setFcmToken(token);
      console.log('FCM Token:', token);
      return token;
    } catch (error) {
      console.error('FCM token error:', error);
    }
  };

  const setupMessageHandlers = () => {
    // Handle background messages
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Message handled in the background!', remoteMessage);
    });

    // Handle foreground messages
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log('A new FCM message arrived!', remoteMessage);
      
      // Show local notification
      PushNotification.localNotification({
        channelId: 'trashify-notifications',
        title: remoteMessage.notification?.title || 'Trashify',
        message: remoteMessage.notification?.body || 'You have a new notification',
        data: remoteMessage.data,
        playSound: true,
        soundName: 'default',
        importance: 'high',
        priority: 'high',
      });
    });

    // Handle notification opened app
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification caused app to open from background state:', remoteMessage);
      handleNotificationTap(remoteMessage);
    });

    // Check whether an initial notification is available
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('Notification caused app to open from quit state:', remoteMessage);
          handleNotificationTap(remoteMessage);
        }
      });

    return unsubscribe;
  };

  const handleNotificationTap = (notification) => {
    const data = notification.data || {};
    
    // Handle different notification types
    switch (data.type) {
      case 'booking':
        // Navigate to booking details
        console.log('Navigate to booking:', data.booking_id);
        break;
      case 'payment':
        // Navigate to payment details
        console.log('Navigate to payment:', data.payment_id);
        break;
      case 'system':
        // Show system message
        Alert.alert('System Notification', notification.body);
        break;
      default:
        console.log('Unknown notification type:', data.type);
    }
  };

  const sendLocalNotification = (title, message, data = {}) => {
    PushNotification.localNotification({
      channelId: 'trashify-notifications',
      title,
      message,
      data,
      playSound: true,
      soundName: 'default',
      importance: 'high',
      priority: 'high',
    });
  };

  const scheduleNotification = (title, message, date, data = {}) => {
    PushNotification.localNotificationSchedule({
      channelId: 'trashify-notifications',
      title,
      message,
      date,
      data,
      playSound: true,
      soundName: 'default',
    });
  };

  const cancelAllNotifications = () => {
    PushNotification.cancelAllLocalNotifications();
  };

  const getDeliveredNotifications = () => {
    PushNotification.getDeliveredNotifications((notifications) => {
      setNotifications(notifications);
    });
  };

  const removeDeliveredNotifications = (identifiers) => {
    PushNotification.removeDeliveredNotifications(identifiers);
  };

  const value = {
    notifications,
    unreadCount,
    fcmToken,
    sendLocalNotification,
    scheduleNotification,
    cancelAllNotifications,
    getDeliveredNotifications,
    removeDeliveredNotifications,
    setUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
