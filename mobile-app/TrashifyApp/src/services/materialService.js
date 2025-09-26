import apiService from './api';

class MaterialService {
  // Get all materials
  async getMaterials(category = null) {
    try {
      const params = {};
      if (category) params.category = category;
      
      const response = await apiService.get('/materials', params);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get material by ID
  async getMaterialById(materialId) {
    try {
      const response = await apiService.get(`/materials/${materialId}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get materials by category
  async getMaterialsByCategory(category) {
    try {
      const response = await apiService.get('/materials', { category });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Search materials
  async searchMaterials(query) {
    try {
      const response = await apiService.get('/materials', { search: query });
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default new MaterialService();
