import React, { useEffect, useState } from 'react';
import { StatusBar, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from 'react-query';
import FlashMessage from 'react-native-flash-message';
import SplashScreen from 'react-native-splash-screen';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BookingProvider } from './contexts/BookingContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { LocationProvider } from './contexts/LocationContext';
import AuthNavigator from './navigation/AuthNavigator';
import AppNavigator from './navigation/AppNavigator';
import { theme } from './styles/theme';
import { requestPermissions } from './utils/permissions';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function AppContent() {
  const { user, isLoading } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Request necessary permissions
        await requestPermissions();
        
        // Hide splash screen
        SplashScreen.hide();
        setIsReady(true);
      } catch (error) {
        console.error('App initialization error:', error);
        SplashScreen.hide();
        setIsReady(true);
      }
    };

    initializeApp();
  }, []);

  if (!isReady || isLoading) {
    return null;
  }

  return (
    <NavigationContainer>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={theme.colors.primary}
        translucent={Platform.OS === 'android'}
      />
      {user ? <AppNavigator /> : <AuthNavigator />}
      <FlashMessage position="top" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <BookingProvider>
            <LocationProvider>
              <NotificationProvider>
                <AppContent />
              </NotificationProvider>
            </LocationProvider>
          </BookingProvider>
        </AuthProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}
