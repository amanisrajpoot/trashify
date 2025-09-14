import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocation } from '../contexts/LocationContext';

export default function BookPickupScreen({ navigation }) {
  const { location } = useLocation();
  const [selectedMaterials, setSelectedMaterials] = useState({});
  const [weights, setWeights] = useState({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const materials = [
    { id: '1', name: 'Paper', price: 10, unit: 'kg', image: '📄' },
    { id: '2', name: 'Plastic', price: 15, unit: 'kg', image: '🥤' },
    { id: '3', name: 'Metal', price: 25, unit: 'kg', image: '🔧' },
    { id: '4', name: 'Glass', price: 8, unit: 'kg', image: '🍾' },
    { id: '5', name: 'Cardboard', price: 12, unit: 'kg', image: '📦' },
    { id: '6', name: 'E-waste', price: 50, unit: 'kg', image: '💻' },
  ];

  const toggleMaterial = (materialId) => {
    setSelectedMaterials(prev => ({
      ...prev,
      [materialId]: !prev[materialId]
    }));
    if (!selectedMaterials[materialId]) {
      setWeights(prev => ({
        ...prev,
        [materialId]: '0'
      }));
    }
  };

  const updateWeight = (materialId, weight) => {
    setWeights(prev => ({
      ...prev,
      [materialId]: weight
    }));
  };

  const calculateTotal = () => {
    let total = 0;
    Object.keys(selectedMaterials).forEach(materialId => {
      if (selectedMaterials[materialId]) {
        const material = materials.find(m => m.id === materialId);
        const weight = parseFloat(weights[materialId]) || 0;
        total += material.price * weight;
      }
    });
    return total;
  };

  const handleBookPickup = async () => {
    const selectedCount = Object.values(selectedMaterials).filter(Boolean).length;
    
    if (selectedCount === 0) {
      Alert.alert('Error', 'Please select at least one material');
      return;
    }

    if (!location) {
      Alert.alert('Error', 'Location is required for pickup booking');
      return;
    }

    setLoading(true);
    try {
      // This would be an API call to book pickup
      const bookingData = {
        materials: selectedMaterials,
        weights,
        notes,
        location,
        estimatedValue: calculateTotal(),
      };
      
      console.log('Booking data:', bookingData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Booking Confirmed!',
        'Your pickup has been scheduled. A collector will contact you soon.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home')
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to book pickup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Book Pickup</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup Location</Text>
          <View style={styles.locationCard}>
            <Text style={styles.locationIcon}>📍</Text>
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>
                {location ? location.address : 'Location not available'}
              </Text>
              {location && (
                <Text style={styles.locationSubtext}>
                  {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Materials Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Materials</Text>
          <Text style={styles.sectionSubtitle}>Choose the materials you want to sell</Text>
          
          {materials.map((material) => (
            <View key={material.id} style={styles.materialItem}>
              <TouchableOpacity
                style={[
                  styles.materialCard,
                  selectedMaterials[material.id] && styles.materialCardSelected
                ]}
                onPress={() => toggleMaterial(material.id)}
              >
                <Text style={styles.materialIcon}>{material.image}</Text>
                <View style={styles.materialInfo}>
                  <Text style={styles.materialName}>{material.name}</Text>
                  <Text style={styles.materialPrice}>
                    ₹{material.price}/{material.unit}
                  </Text>
                </View>
                <View style={styles.checkbox}>
                  {selectedMaterials[material.id] && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
              
              {selectedMaterials[material.id] && (
                <View style={styles.weightInput}>
                  <Text style={styles.weightLabel}>Weight (kg):</Text>
                  <TextInput
                    style={styles.weightField}
                    value={weights[material.id] || '0'}
                    onChangeText={(value) => updateWeight(material.id, value)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any special instructions for the collector..."
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Total */}
        <View style={styles.totalSection}>
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Estimated Value</Text>
            <Text style={styles.totalAmount}>₹{calculateTotal().toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Book Button */}
      <View style={styles.bookButtonContainer}>
        <TouchableOpacity
          style={[styles.bookButton, loading && styles.bookButtonDisabled]}
          onPress={handleBookPickup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.bookButtonText}>Book Pickup</Text>
          )}
        </TouchableOpacity>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 50,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  locationIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  locationInfo: {
    flex: 1,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  locationSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  materialItem: {
    marginBottom: 15,
  },
  materialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  materialCardSelected: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  materialIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  materialInfo: {
    flex: 1,
  },
  materialName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  materialPrice: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  weightInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingLeft: 15,
  },
  weightLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  weightField: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    width: 80,
    textAlign: 'center',
  },
  notesInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  totalSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  totalCard: {
    backgroundColor: '#4CAF50',
    padding: 20,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  bookButtonContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  bookButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    opacity: 0.7,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
