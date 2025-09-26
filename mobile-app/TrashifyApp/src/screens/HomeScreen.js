import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import { useBooking } from '../contexts/BookingContext';
import materialService from '../services/materialService';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { location } = useLocation();
  const { bookings, refreshBookings } = useBooking();
  const [materials, setMaterials] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadMaterials(),
        refreshBookings()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMaterials = async () => {
    try {
      const response = await materialService.getMaterials();
      setMaterials(response.data.materials || []);
    } catch (error) {
      console.error('Error loading materials:', error);
      // Fallback to mock data
      const mockMaterials = [
        { id: '1', name: 'Paper', price_per_kg: 10, unit: 'kg', image_url: '📄' },
        { id: '2', name: 'Plastic', price_per_kg: 15, unit: 'kg', image_url: '🥤' },
        { id: '3', name: 'Metal', price_per_kg: 25, unit: 'kg', image_url: '🔧' },
        { id: '4', name: 'Glass', price_per_kg: 8, unit: 'kg', image_url: '🍾' },
        { id: '5', name: 'Cardboard', price_per_kg: 12, unit: 'kg', image_url: '📦' },
        { id: '6', name: 'E-waste', price_per_kg: 50, unit: 'kg', image_url: '💻' },
      ];
      setMaterials(mockMaterials);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleBookPickup = () => {
    navigation.navigate('BookPickup');
  };

  const handleViewBookings = () => {
    navigation.navigate('Bookings');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name || 'User'}!</Text>
            <Text style={styles.subtitle}>Ready to turn waste into wealth?</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.primaryAction} onPress={handleBookPickup}>
            <Text style={styles.primaryActionIcon}>📱</Text>
            <Text style={styles.primaryActionText}>Book Pickup</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryAction} onPress={handleViewBookings}>
            <Text style={styles.secondaryActionIcon}>📋</Text>
            <Text style={styles.secondaryActionText}>My Bookings</Text>
          </TouchableOpacity>
        </View>

        {/* Materials Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Prices</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>Loading materials...</Text>
            </View>
          ) : (
            <View style={styles.materialsGrid}>
              {materials.map((material) => (
                <View key={material.id} style={styles.materialCard}>
                  <Text style={styles.materialIcon}>{material.image_url || '📦'}</Text>
                  <Text style={styles.materialName}>{material.name}</Text>
                  <Text style={styles.materialPrice}>
                    ₹{material.price_per_kg}/{material.unit}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{bookings.length}</Text>
              <Text style={styles.statLabel}>Total Bookings</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {bookings.filter(b => b.status === 'completed').length}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {bookings.filter(b => b.status === 'pending').length}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        </View>

        {/* Location Status */}
        {location ? (
          <View style={styles.locationStatus}>
            <Text style={styles.locationText}>📍 Location: {location.address}</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.locationButton}
            onPress={() => navigation.navigate('LocationPermission')}
          >
            <Text style={styles.locationButtonText}>Enable Location Services</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'white',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 24,
    color: 'white',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 15,
  },
  primaryAction: {
    flex: 2,
    backgroundColor: '#4CAF50',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  primaryActionIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  primaryActionText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  secondaryActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  secondaryActionText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  materialsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  materialCard: {
    width: '30%',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  materialIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  materialName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  materialPrice: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  locationStatus: {
    backgroundColor: 'white',
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  locationText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  locationButton: {
    backgroundColor: '#FF9800',
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  locationButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});
