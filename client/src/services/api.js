import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Configure axios defaults
axios.defaults.baseURL = API_URL;

// Add token to requests if available
axios.interceptors.request.use(
  (config) => {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      config.headers['x-user-role'] = userData.role || 'development';
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Item API functions
export const getAllItems = async () => {
  try {
    const response = await axios.get('/api/items');
    return response.data;
  } catch (error) {
    console.error('Error fetching items:', error);
    throw error;
  }
};

export const getItemById = async (id) => {
  try {
    const response = await axios.get(`/api/items/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching item:', error);
    throw error;
  }
};

export const createItem = async (itemData) => {
  try {
    const response = await axios.post('/api/items', itemData);
    return response.data;
  } catch (error) {
    console.error('Error creating item:', error);
    throw error;
  }
};

export const updateItem = async (id, itemData) => {
  try {
    const response = await axios.put(`/api/items/${id}`, itemData);
    return response.data;
  } catch (error) {
    console.error('Error updating item:', error);
    throw error;
  }
};

export const deleteItem = async (id) => {
  try {
    const response = await axios.delete(`/api/items/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting item:', error);
    throw error;
  }
};

export const completeItem = async (id, data) => {
  try {
    const response = await axios.post(`/api/items/${id}/complete`, data);
    return response.data;
  } catch (error) {
    console.error('Error completing item:', error);
    throw error;
  }
};

export const getItemTransactions = async (id) => {
  try {
    const response = await axios.get(`/api/items/${id}/transactions`);
    return response.data;
  } catch (error) {
    console.error('Error fetching item transactions:', error);
    throw error;
  }
};

// Order API functions
export const getAllOrders = async () => {
  try {
    const response = await axios.get('/api/orders');
    return response.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

export const getOrderById = async (id) => {
  try {
    const response = await axios.get(`/api/orders/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
};

export const createOrder = async (orderData) => {
  try {
    const response = await axios.post('/api/orders', orderData);
    return response.data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

export const updateOrder = async (id, orderData) => {
  try {
    const response = await axios.put(`/api/orders/${id}`, orderData);
    return response.data;
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
};

export const deleteOrder = async (id) => {
  try {
    const response = await axios.delete(`/api/orders/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
};

export const updateOrderStatus = async (id, status) => {
  try {
    const response = await axios.patch(`/api/orders/${id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

// Inventory API functions
export const getInventory = async () => {
  try {
    const response = await axios.get('/api/inventory');
    return response.data;
  } catch (error) {
    console.error('Error fetching inventory:', error);
    throw error;
  }
};

export const addInventoryItem = async (data) => {
  try {
    const response = await axios.post('/api/inventory', data);
    return response.data;
  } catch (error) {
    console.error('Error adding inventory item:', error);
    throw error;
  }
};
