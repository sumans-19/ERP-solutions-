import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Personnel API
export const getEmployees = async () => (await axios.get('/api/employees')).data;

// Configure axios defaults
axios.defaults.baseURL = API_URL;

// Add token to requests if available
axios.interceptors.request.use(
  (config) => {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      config.headers['x-user-role'] = userData.role || 'development';
      config.headers['x-user-id'] = userData.id || userData._id;
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

export const getOrderStateCounts = async () => (await axios.get('/api/orders/stats/stage-counts')).data;
export const getOrdersByStage = async (stage) => (await axios.get(`/api/orders/stage/${stage}`)).data;

export const getAllEmployees = async () => {
  try {
    const response = await axios.get('/api/employees');
    return response.data;
  } catch (error) {
    console.error('Error fetching employees:', error);
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

// Inventory V2 API functions
export const getRawMaterials = async () => (await axios.get('/api/raw-materials')).data;
export const createRawMaterial = async (data) => (await axios.post('/api/raw-materials', data)).data;
export const updateRawMaterial = async (id, data) => (await axios.put(`/api/raw-materials/${id}`, data)).data;
export const deleteRawMaterial = async (id) => (await axios.delete(`/api/raw-materials/${id}`)).data;

export const getMaterialRequests = async () => (await axios.get('/api/material-requests')).data;
export const getNextMRNumber = async () => (await axios.get('/api/material-requests/next-number')).data;
export const createMaterialRequest = async (data) => (await axios.post('/api/material-requests', data)).data;

export const getGRNs = async () => (await axios.get('/api/grn')).data;
export const getNextGRNNumber = async () => (await axios.get('/api/grn/next-number')).data;
export const createGRN = async (data) => (await axios.post('/api/grn', data)).data;

export const getWIPStock = async () => (await axios.get('/api/wip-stock')).data;
export const createWIPStock = async (data) => (await axios.post('/api/wip-stock', data)).data;

export const getFinishedGoods = async () => (await axios.get('/api/finished-goods')).data;
export const createFinishedGood = async (data) => (await axios.post('/api/finished-goods', data)).data;

export const getRejectedGoods = async () => (await axios.get('/api/rejected-goods')).data;
export const createRejectedGood = async (data) => (await axios.post('/api/rejected-goods', data)).data;

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

// Party API functions
export const getAllParties = async () => {
  try {
    const response = await axios.get('/api/parties');
    return response.data;
  } catch (error) {
    console.error('Error fetching parties:', error);
    throw error;
  }
};

export const updateParty = async (id, data) => {
  try {
    const response = await axios.put(`/api/parties/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating party:', error);
    throw error;
  }
};

// System Settings API functions
export const getSystemSettings = async () => {
  try {
    const response = await axios.get('/api/system-settings');
    return response.data;
  } catch (error) {
    console.error('Error fetching system settings:', error);
    throw error;
  }
};

export const updateSystemSettings = async (data) => {
  try {
    const response = await axios.put('/api/system-settings', data);
    return response.data;
  } catch (error) {
    console.error('Error updating system settings:', error);
    throw error;
  }
};

// Role Permission API functions
export const getRolePermissions = async () => {
  try {
    const response = await axios.get('/api/role-permissions');
    return response.data;
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    throw error;
  }
};

export const updateRolePermissions = async (role, data) => {
  try {
    const response = await axios.put(`/api/role-permissions/${role}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating role permissions:', error);
    throw error;
  }
};

// Task API functions
export const getEmployeeTasks = async (employeeId) => {
  try {
    const response = await axios.get(`/api/tasks/employee/${employeeId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

export const createTask = async (taskData) => {
  try {
    const response = await axios.post('/api/tasks', taskData);
    return response.data;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

export const updateTask = async (id, data) => {
  try {
    const response = await axios.patch(`/api/tasks/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

export const deleteTask = async (id) => {
  try {
    const response = await axios.delete(`/api/tasks/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

// Chat API functions
export const getChatMessages = async (userId, contactId) => {
  try {
    const response = await axios.get(`/api/chat/${userId}/${contactId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

export const sendMessage = async (messageData) => {
  try {
    const response = await axios.post('/api/chat', messageData);
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const getContacts = async () => {
  try {
    const response = await axios.get('/api/chat/contacts/all');
    return response.data;
  } catch (error) {
    console.error('Error fetching contacts:', error);
    throw error;
  }
};

export const markMessagesAsRead = async (userId, contactId) => {
  try {
    const response = await axios.patch(`/api/chat/read/${userId}/${contactId}`);
    return response.data;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

// Bulletin API functions
export const getBulletins = async () => {
  try {
    const response = await axios.get('/api/bulletins');
    return response.data;
  } catch (error) {
    console.error('Error fetching bulletins:', error);
    throw error;
  }
};

export const createBulletin = async (data) => {
  try {
    const response = await axios.post('/api/bulletins', data);
    return response.data;
  } catch (error) {
    console.error('Error creating bulletin:', error);
    throw error;
  }
};

export const deleteBulletin = async (id) => {
  try {
    const response = await axios.delete(`/api/bulletins/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting bulletin:', error);
    throw error;
  }
};

// Job/Process Tracking API
export const getEmployeeWorkload = async () => {
  try {
    const response = await axios.get('/api/employees/workload');
    return response.data;
  } catch (error) {
    console.error('Error fetching employee workload:', error);
    throw error;
  }
};

export const getStateCounts = async () => (await axios.get('/api/job-cards/stats/state-counts')).data;
export const getItemsByState = async (state) => (await axios.get(`/api/job-cards/state/${state}`)).data;

export const getAssignedJobs = async (employeeId) => {
  try {
    const response = await axios.get(`/api/employees/${employeeId}/assignments`);
    return response.data;
  } catch (error) {
    console.error('Error fetching assigned jobs:', error);
    throw error;
  }
};

export const startStep = async (itemId, processStepId) => {
  try {
    const response = await axios.post(`/api/items/${itemId}/start-step`, { processStepId });
    return response.data;
  } catch (error) {
    console.error('Error starting step:', error);
    throw error;
  }
};

export const completeStep = async (itemId, processStepId, notes) => {
  try {
    const response = await axios.post(`/api/items/${itemId}/complete-step`, { processStepId, notes });
    return response.data;
  } catch (error) {
    console.error('Error completing step:', error);
    throw error;
  }
};

export const holdItem = async (itemId, reason) => (await axios.post(`/api/items/${itemId}/hold`, { reason })).data;
export const resumeItem = async (itemId) => (await axios.post(`/api/items/${itemId}/resume`)).data;
export const completeVerification = async (itemId) => (await axios.post(`/api/items/${itemId}/complete-verification`)).data;
export const completeDocumentation = async (itemId, remarks) => (await axios.post(`/api/items/${itemId}/complete-documentation`, { remarks })).data;

export const toggleSubstep = async (itemId, processStepId, subStepId, status) => {
  try {
    const response = await axios.post(`/api/items/${itemId}/toggle-substep`, { processStepId, subStepId, status });
    return response.data;
  } catch (error) {
    console.error('Error toggling substep:', error);
    throw error;
  }
};

export const saveStepNote = async (itemId, processStepId, notes, employeeId) => {
  try {
    const response = await axios.post(`/api/items/${itemId}/save-step-note`, { processStepId, notes, employeeId });
    return response.data;
  } catch (error) {
    console.error('Error saving note:', error);
    throw error;
  }
};

// Job Card API functions
export const getJobCards = async (filters) => (await axios.get('/api/job-cards', { params: filters })).data;
export const getJobCardById = async (id) => (await axios.get(`/api/job-cards/${id}`)).data;
export const getJobCardsByEmployee = async (employeeId) => (await axios.get(`/api/job-cards/employee/${employeeId}`)).data;

export const toggleJobSubstep = async (jobCardId, stepId, subStepId, status) => {
  try {
    const response = await axios.patch(`/api/job-cards/${jobCardId}/steps/${stepId}/substeps/${subStepId}/toggle`, { status });
    return response.data;
  } catch (error) {
    console.error('Error toggling job substep:', error);
    throw error;
  }
};
export const updateJobCardSteps = async (id, steps) => (await axios.patch(`/api/job-cards/${id}/steps`, { steps })).data;
export const splitJobCard = async (id, splitQty) => (await axios.post(`/api/job-cards/${id}/split`, { splitQty })).data;

export const getCalendarEvents = async (start, end) => (await axios.get('/api/calendar/events', { params: { start, end } })).data;
