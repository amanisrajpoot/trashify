import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

import HomeScreen from '../screens/HomeScreen';
import BookingsScreen from '../screens/BookingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import BookPickupScreen from '../screens/BookPickupScreen';

import CollectorHomeScreen from '../screens/collector/CollectorHomeScreen';
import CollectorBookingsScreen from '../screens/collector/CollectorBookingsScreen';
import CollectorProfileScreen from '../screens/collector/CollectorProfileScreen';
import CollectorBookingDetailsScreen from '../screens/collector/CollectorBookingDetailsScreen';
import CollectorStatsScreen from '../screens/collector/CollectorStatsScreen';

import { useAuth } from '../contexts/AuthContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function CustomerStack() {
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BookPickup"
        component={BookPickupScreen}
        options={{
          title: 'Book Pickup',
          headerBackTitle: 'Back',
        }}
      />
    </Stack.Navigator>
  );
}

function CollectorStack() {
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="CollectorHome"
        component={CollectorHomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CollectorBookingDetails"
        component={CollectorBookingDetailsScreen}
        options={{
          title: 'Booking Details',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="CollectorStats"
        component={CollectorStatsScreen}
        options={{
          title: 'My Statistics',
          headerBackTitle: 'Back',
        }}
      />
    </Stack.Navigator>
  );
}

function BookingsStack() {
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="BookingsList"
        component={BookingsScreen}
        options={{ title: 'My Bookings' }}
      />
      <Stack.Screen
        name="BookingDetails"
        component={BookingDetailsScreen}
        options={{
          title: 'Booking Details',
          headerBackTitle: 'Back',
        }}
      />
    </Stack.Navigator>
  );
}

function CollectorBookingsStack() {
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="CollectorBookingsList"
        component={CollectorBookingsScreen}
        options={{ title: 'Available Pickups' }}
      />
      <Stack.Screen
        name="CollectorBookingDetails"
        component={CollectorBookingDetailsScreen}
        options={{
          title: 'Booking Details',
          headerBackTitle: 'Back',
        }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user } = useAuth();
  const theme = useTheme();

  if (user?.role === 'collector') {
    return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'CollectorHome') {
              iconName = 'home';
            } else if (route.name === 'CollectorBookings') {
              iconName = 'assignment';
            } else if (route.name === 'CollectorProfile') {
              iconName = 'person';
            }

            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.outline,
          },
        })}
      >
        <Tab.Screen
          name="CollectorHome"
          component={CollectorStack}
          options={{ tabBarLabel: 'Home' }}
        />
        <Tab.Screen
          name="CollectorBookings"
          component={CollectorBookingsStack}
          options={{ tabBarLabel: 'Pickups' }}
        />
        <Tab.Screen
          name="CollectorProfile"
          component={CollectorProfileScreen}
          options={{ tabBarLabel: 'Profile' }}
        />
      </Tab.Navigator>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Bookings') {
            iconName = 'assignment';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={CustomerStack}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Bookings"
        component={BookingsStack}
        options={{ tabBarLabel: 'Bookings' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
