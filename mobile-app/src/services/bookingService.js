import apiService from './api';

class BookingService {
  // Create new booking
  async createBooking(bookingData) {
    try {
      const response = await apiService.post('/bookings', bookingData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get user's bookings
  async getMyBookings(status = null, limit = 20, offset = 0) {
    try {
      const params = { limit, offset };
      if (status) params.status = status;
      
      const response = await apiService.get('/bookings/my-bookings', params);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get booking by ID
  async getBookingById(bookingId) {
    try {
      const response = await apiService.get(`/bookings/${bookingId}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Update booking details
  async updateBooking(bookingId, updateData) {
    try {
      const response = await apiService.put(`/bookings/${bookingId}`, updateData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Cancel booking
  async cancelBooking(bookingId) {
    try {
      const response = await apiService.delete(`/bookings/${bookingId}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Update booking status
  async updateBookingStatus(bookingId, status, notes = null) {
    try {
      const response = await apiService.put(`/bookings/${bookingId}/status`, {
        status,
        notes,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Add material to booking
  async addMaterial(bookingId, materialId, quantity) {
    try {
      const response = await apiService.post(`/bookings/${bookingId}/materials`, {
        material_id: materialId,
        quantity,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Remove material from booking
  async removeMaterial(bookingId, materialId) {
    try {
      const response = await apiService.delete(`/bookings/${bookingId}/materials/${materialId}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get booking materials
  async getBookingMaterials(bookingId) {
    try {
      const response = await apiService.get(`/bookings/${bookingId}/materials`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get all bookings (admin)
  async getAllBookings(status = null, limit = 20, offset = 0) {
    try {
      const params = { limit, offset };
      if (status) params.status = status;
      
      const response = await apiService.get('/bookings', params);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Assign collector to booking (admin)
  async assignCollector(bookingId, collectorId) {
    try {
      const response = await apiService.post(`/bookings/${bookingId}/assign`, {
        collector_id: collectorId,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default new BookingService();
