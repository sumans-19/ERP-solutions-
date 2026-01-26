import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to include user role
api.interceptors.request.use((config) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role) {
        config.headers['x-user-role'] = user.role;
    }
    return config;
});

export const getEmployees = async () => {
    const response = await api.get('/api/employees');
    return response.data;
};

export const createEmployee = async (employeeData) => {
    const response = await api.post('/api/employees', employeeData);
    return response.data;
};

export const updateEmployee = async (id, employeeData) => {
    const response = await api.put(`/api/employees/${id}`, employeeData);
    return response.data;
};

export const updateEmployeeStatus = async (id, status) => {
    const response = await api.patch(`/api/employees/${id}/status`, { status });
    return response.data;
};

// Order APIs for Employee View
export const getEmployeeOrders = (employeeId) => {
    return api.get(`/api/orders/employee/${employeeId}`);
};

export const getEmployeeOrderStats = (employeeId) => {
    return api.get(`/api/orders/employee/${employeeId}/stats`);
};

export const updateOrderProgress = (orderId, data) => {
    return api.put(`/api/orders/${orderId}/progress`, data);
};

// Message APIs for Employee View
export const getConversation = (userId1, userId2) => {
    return api.get(`/api/messages/conversation/${userId1}/${userId2}`);
};

export const getUserConversations = (userId) => {
    return api.get(`/api/messages/user/${userId}`);
};

export const sendMessage = (messageData) => {
    return api.post('/api/messages', messageData);
};

export const markMessagesAsRead = (userId, partnerId) => {
    return api.put('/api/messages/mark-read', { userId, partnerId });
};

export const deleteMessage = (messageId) => {
    return api.delete(`/api/messages/${messageId}`);
};
