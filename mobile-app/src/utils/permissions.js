import { Platform, PermissionsAndroid, Alert } from 'react-native';

export const requestPermissions = async () => {
  const permissions = [];

  if (Platform.OS === 'android') {
    // Location permission
    permissions.push(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    permissions.push(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION);
    
    // Camera permission
    permissions.push(PermissionsAndroid.PERMISSIONS.CAMERA);
    
    // Storage permission
    permissions.push(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
    permissions.push(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
    
    // Phone permission
    permissions.push(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE);
    
    // SMS permission (for OTP)
    permissions.push(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS);
    permissions.push(PermissionsAndroid.PERMISSIONS.READ_SMS);
  }

  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple(permissions);
      
      const deniedPermissions = Object.keys(granted).filter(
        permission => granted[permission] !== PermissionsAndroid.RESULTS.GRANTED
      );

      if (deniedPermissions.length > 0) {
        console.warn('Some permissions were denied:', deniedPermissions);
        
        // Show alert for critical permissions
        const criticalPermissions = [
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.CAMERA,
        ];
        
        const deniedCritical = deniedPermissions.filter(permission =>
          criticalPermissions.includes(permission)
        );
        
        if (deniedCritical.length > 0) {
          Alert.alert(
            'Permissions Required',
            'Some features may not work properly without the required permissions. You can enable them later in Settings.',
            [{ text: 'OK' }]
          );
        }
      }
    }
  } catch (error) {
    console.error('Permission request error:', error);
  }
};

export const requestLocationPermission = async () => {
  if (Platform.OS === 'android') {
    try {
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
      
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.error('Location permission error:', error);
      return false;
    }
  }
  return true; // iOS handles this differently
};

export const requestCameraPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'Trashify needs access to your camera to take photos of recyclable materials.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.error('Camera permission error:', error);
      return false;
    }
  }
  return true; // iOS handles this differently
};

export const requestStoragePermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission',
          message: 'Trashify needs access to your storage to save and access photos.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.error('Storage permission error:', error);
      return false;
    }
  }
  return true; // iOS handles this differently
};
