import apiService from './api';

class PaymentService {
  // Calculate payment amount
  async calculatePayment(materials) {
    try {
      const response = await apiService.post('/payments/calculate', { materials });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Create Razorpay order
  async createOrder(amount, bookingId) {
    try {
      const response = await apiService.post('/payments/create-order', {
        amount,
        booking_id: bookingId,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Verify payment
  async verifyPayment(orderId, paymentId, signature, bookingId) {
    try {
      const response = await apiService.post('/payments/verify', {
        order_id: orderId,
        payment_id: paymentId,
        signature,
        booking_id: bookingId,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get payment history
  async getPaymentHistory(page = 1, limit = 10, type = null) {
    try {
      const params = { page, limit };
      if (type) params.type = type;
      
      const response = await apiService.get('/payments/history', params);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get payment by ID
  async getPaymentById(paymentId) {
    try {
      const response = await apiService.get(`/payments/${paymentId}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Refund payment (admin)
  async refundPayment(paymentId, reason) {
    try {
      const response = await apiService.post(`/payments/${paymentId}/refund`, {
        reason,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default new PaymentService();
