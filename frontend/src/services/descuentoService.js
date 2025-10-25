import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

const descuentoService = {
  // Obtener todos los descuentos con filtros opcionales
  getAllDescuentos: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.estado !== undefined) queryParams.append('estado', params.estado);
      if (params.item_id) queryParams.append('item_id', params.item_id);
      if (params.presentacion_id) queryParams.append('presentacion_id', params.presentacion_id);
      if (params.tipo) queryParams.append('tipo', params.tipo);
      if (params.vigentes) queryParams.append('vigentes', params.vigentes);

      const url = `${API_BASE_URL}/descuentos${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await axios.get(url, getAuthHeaders());
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Obtener solo descuentos vigentes
  getDescuentosVigentes: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/descuentos/vigentes`, getAuthHeaders());
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Obtener un descuento por ID
  getDescuentoById: async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/descuentos/${id}`, getAuthHeaders());
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Obtener descuentos aplicables a un item
  getDescuentosByItem: async (itemId, cantidad = 1) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/descuentos/item/${itemId}?cantidad=${cantidad}`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Obtener descuentos aplicables a una presentación
  getDescuentosByPresentacion: async (presentacionId, cantidad = 1) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/descuentos/presentacion/${presentacionId}?cantidad=${cantidad}`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Calcular descuento aplicable
  calcularDescuento: async (data) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/descuentos/calcular`,
        data,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Crear descuento
  createDescuento: async (descuentoData) => {
    try {
      // Formatear fechas para SQL Server (YYYY-MM-DD HH:mm:ss)
      const formattedData = {
        ...descuentoData,
        Descuento_Fecha_Inicio: descuentoData.Descuento_Fecha_Inicio 
          ? new Date(descuentoData.Descuento_Fecha_Inicio).toISOString().slice(0, 19).replace('T', ' ')
          : null,
        Descuento_Fecha_Fin: descuentoData.Descuento_Fecha_Fin 
          ? new Date(descuentoData.Descuento_Fecha_Fin).toISOString().slice(0, 19).replace('T', ' ')
          : null
      };

      const response = await axios.post(
        `${API_BASE_URL}/descuentos`,
        formattedData,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Actualizar descuento
  updateDescuento: async (id, descuentoData) => {
    try {
      // Formatear fechas para SQL Server (YYYY-MM-DD HH:mm:ss)
      const formattedData = {
        ...descuentoData,
        Descuento_Fecha_Inicio: descuentoData.Descuento_Fecha_Inicio 
          ? new Date(descuentoData.Descuento_Fecha_Inicio).toISOString().slice(0, 19).replace('T', ' ')
          : null,
        Descuento_Fecha_Fin: descuentoData.Descuento_Fecha_Fin 
          ? new Date(descuentoData.Descuento_Fecha_Fin).toISOString().slice(0, 19).replace('T', ' ')
          : null
      };

      const response = await axios.put(
        `${API_BASE_URL}/descuentos/${id}`,
        formattedData,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Cambiar estado de descuento (activar/desactivar)
  toggleEstadoDescuento: async (id) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/descuentos/${id}/toggle-estado`,
        {},
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Eliminar descuento
  deleteDescuento: async (id) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/descuentos/${id}`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  }
};

export { descuentoService };
export default descuentoService;
