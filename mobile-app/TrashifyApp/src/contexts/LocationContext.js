import React, { createContext, useContext, useEffect, useState } from 'react';
import Geolocation from 'react-native-geolocation-service';
import { Platform, PermissionsAndroid, Alert } from 'react-native';

const LocationContext = createContext();

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        setPermissionGranted(granted);
        if (granted) {
          getCurrentLocation();
        }
      } else {
        // iOS permission check
        const granted = await Geolocation.requestAuthorization('whenInUse');
        setPermissionGranted(granted === 'granted');
        if (granted === 'granted') {
          getCurrentLocation();
        }
      }
    } catch (error) {
      console.error('Permission check error:', error);
      setError('Failed to check location permission');
    }
  };

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Trashify needs access to your location to find nearby collectors and schedule pickups.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setPermissionGranted(true);
          getCurrentLocation();
          return true;
        } else {
          Alert.alert(
            'Permission Denied',
            'Location permission is required to use this feature. Please enable it in settings.'
          );
          return false;
        }
      } else {
        // iOS permission request
        const granted = await Geolocation.requestAuthorization('whenInUse');
        if (granted === 'granted') {
          setPermissionGranted(true);
          getCurrentLocation();
          return true;
        } else {
          Alert.alert(
            'Permission Denied',
            'Location permission is required to use this feature. Please enable it in settings.'
          );
          return false;
        }
      }
    } catch (error) {
      console.error('Permission request error:', error);
      setError('Failed to request location permission');
      return false;
    }
  };

  const getCurrentLocation = () => {
    setIsLoading(true);
    setError(null);

    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({
          latitude,
          longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
        setIsLoading(false);
      },
      (error) => {
        console.error('Location error:', error);
        setError(error.message);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  };

  const refreshLocation = () => {
    if (permissionGranted) {
      getCurrentLocation();
    } else {
      requestLocationPermission();
    }
  };

  const value = {
    location,
    isLoading,
    error,
    permissionGranted,
    requestLocationPermission,
    refreshLocation,
    getCurrentLocation,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};
