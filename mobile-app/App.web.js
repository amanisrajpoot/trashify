import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';

// Simple web version of the mobile app for testing
export default function App() {
  const [currentScreen, setCurrentScreen] = React.useState('welcome');
  const [phone, setPhone] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');

  const handleLogin = () => {
    if (phone && password) {
      Alert.alert('Success', 'Login successful! (This is a demo)');
      setCurrentScreen('home');
    } else {
      Alert.alert('Error', 'Please fill in all fields');
    }
  };

  const handleRegister = () => {
    if (phone && password && name) {
      Alert.alert('Success', 'Registration successful! (This is a demo)');
      setCurrentScreen('home');
    } else {
      Alert.alert('Error', 'Please fill in all fields');
    }
  };

  const renderWelcomeScreen = () => (
    <View style={styles.container}>
      <Text style={styles.title}>🗑️ Trashify</Text>
      <Text style={styles.subtitle}>Home Pickup Service for Recyclable Waste</Text>
      <Text style={styles.description}>
        Book a pickup for your recyclable waste and earn money!
      </Text>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => setCurrentScreen('login')}
      >
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, styles.secondaryButton]} 
        onPress={() => setCurrentScreen('register')}
      >
        <Text style={[styles.buttonText, styles.secondaryButtonText]}>Register</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoginScreen = () => (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => setCurrentScreen('welcome')}>
        <Text style={styles.linkText}>Back to Welcome</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRegisterScreen = () => (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => setCurrentScreen('welcome')}>
        <Text style={styles.linkText}>Back to Welcome</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHomeScreen = () => (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Trashify!</Text>
      <Text style={styles.subtitle}>What would you like to do?</Text>
      
      <TouchableOpacity 
        style={styles.menuButton} 
        onPress={() => Alert.alert('Feature', 'Book Pickup - Coming Soon!')}
      >
        <Text style={styles.menuButtonText}>📦 Book Pickup</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuButton} 
        onPress={() => Alert.alert('Feature', 'My Bookings - Coming Soon!')}
      >
        <Text style={styles.menuButtonText}>📋 My Bookings</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuButton} 
        onPress={() => Alert.alert('Feature', 'Profile - Coming Soon!')}
      >
        <Text style={styles.menuButtonText}>👤 Profile</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuButton} 
        onPress={() => Alert.alert('Feature', 'Earnings - Coming Soon!')}
      >
        <Text style={styles.menuButtonText}>💰 Earnings</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, styles.logoutButton]} 
        onPress={() => setCurrentScreen('welcome')}
      >
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.scrollView}>
      {currentScreen === 'welcome' && renderWelcomeScreen()}
      {currentScreen === 'login' && renderLoginScreen()}
      {currentScreen === 'register' && renderRegisterScreen()}
      {currentScreen === 'home' && renderHomeScreen()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    minHeight: '100vh',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#2E7D32',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#888',
    lineHeight: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: 'white',
  },
  button: {
    backgroundColor: '#2E7D32',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2E7D32',
  },
  logoutButton: {
    backgroundColor: '#d32f2f',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: '#2E7D32',
  },
  linkText: {
    color: '#2E7D32',
    textAlign: 'center',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  menuButton: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
});
