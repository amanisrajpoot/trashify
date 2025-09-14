import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useTheme, Card, Button, Chip, FAB } from 'react-native-paper';
import { useQuery } from 'react-query';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { bookingAPI, materialAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from '../../contexts/LocationContext';

export default function HomeScreen({ navigation }) {
  const theme = useTheme();
  const { user } = useAuth();
  const { location, requestLocationPermission } = useLocation();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch recent bookings
  const { data: bookingsData, refetch: refetchBookings } = useQuery(
    'recentBookings',
    () => bookingAPI.getAll({ limit: 3 }),
    {
      enabled: !!user,
    }
  );

  // Fetch materials
  const { data: materialsData } = useQuery(
    'materials',
    () => materialAPI.getAll(),
    {
      enabled: !!user,
    }
  );

  // Fetch user stats
  const { data: statsData } = useQuery(
    'userStats',
    () => bookingAPI.getStats(),
    {
      enabled: !!user,
    }
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchBookings();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateBooking = () => {
    if (!location) {
      Alert.alert(
        'Location Required',
        'Please enable location services to create a booking.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Enable', onPress: requestLocationPermission },
        ]
      );
      return;
    }
    navigation.navigate('CreateBooking');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return theme.colors.primary;
      case 'in_progress':
        return theme.colors.tertiary;
      case 'accepted':
        return theme.colors.secondary;
      case 'pending':
        return theme.colors.outline;
      default:
        return theme.colors.outline;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'accepted':
        return 'Accepted';
      case 'pending':
        return 'Pending';
      default:
        return status;
    }
  };

  const recentBookings = bookingsData?.data?.bookings || [];
  const materials = materialsData?.data?.materials || [];
  const stats = statsData?.data?.stats || {};

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name}!</Text>
            <Text style={styles.subGreeting}>
              Ready to turn your waste into wealth?
            </Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Icon name="notifications" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="assignment" size={24} color={theme.colors.primary} />
              <Text style={styles.statNumber}>{stats.total_bookings || 0}</Text>
              <Text style={styles.statLabel}>Total Bookings</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="check-circle" size={24} color={theme.colors.primary} />
              <Text style={styles.statNumber}>{stats.completed_bookings || 0}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="account-balance-wallet" size={24} color={theme.colors.primary} />
              <Text style={styles.statNumber}>₹{stats.total_earnings || 0}</Text>
              <Text style={styles.statLabel}>Total Earnings</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={handleCreateBooking}
            >
              <Icon name="add-circle" size={32} color={theme.colors.primary} />
              <Text style={styles.quickActionText}>Schedule Pickup</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('Bookings')}
            >
              <Icon name="assignment" size={32} color={theme.colors.primary} />
              <Text style={styles.quickActionText}>My Bookings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('PaymentHistory')}
            >
              <Icon name="account-balance-wallet" size={32} color={theme.colors.primary} />
              <Text style={styles.quickActionText}>Payments</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Material Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What We Collect</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.materialChips}>
              {materials.slice(0, 6).map((material) => (
                <Chip
                  key={material.id}
                  style={styles.materialChip}
                  textStyle={styles.materialChipText}
                >
                  {material.name}
                </Chip>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Recent Bookings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Bookings</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Bookings')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentBookings.length > 0 ? (
            recentBookings.map((booking) => (
              <Card
                key={booking.id}
                style={styles.bookingCard}
                onPress={() => navigation.navigate('BookingDetails', { bookingId: booking.id })}
              >
                <Card.Content>
                  <View style={styles.bookingHeader}>
                    <Text style={styles.bookingId}>#{booking.id.slice(-8)}</Text>
                    <Chip
                      style={[styles.statusChip, { backgroundColor: getStatusColor(booking.status) }]}
                      textStyle={styles.statusChipText}
                    >
                      {getStatusText(booking.status)}
                    </Chip>
                  </View>
                  <Text style={styles.bookingDate}>
                    {new Date(booking.scheduled_at).toLocaleDateString()}
                  </Text>
                  <Text style={styles.bookingValue}>
                    Estimated: ₹{booking.estimated_value}
                  </Text>
                </Card.Content>
              </Card>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <Icon name="assignment" size={48} color={theme.colors.outline} />
                <Text style={styles.emptyText}>No bookings yet</Text>
                <Text style={styles.emptySubtext}>
                  Schedule your first pickup to get started
                </Text>
              </Card.Content>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        style={styles.fab}
        icon="add"
        onPress={handleCreateBooking}
        label="Schedule Pickup"
      />
    </View>
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
    padding: 20,
    backgroundColor: 'white',
    elevation: 2,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subGreeting: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  notificationButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    elevation: 2,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  materialChips: {
    flexDirection: 'row',
    gap: 8,
  },
  materialChip: {
    backgroundColor: '#E8F5E8',
  },
  materialChipText: {
    color: '#2E7D32',
  },
  bookingCard: {
    marginBottom: 12,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusChip: {
    paddingHorizontal: 8,
  },
  statusChipText: {
    color: 'white',
    fontSize: 12,
  },
  bookingDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  bookingValue: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  emptyCard: {
    elevation: 1,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2E7D32',
  },
});
