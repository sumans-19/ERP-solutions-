import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/employees';

// Helper to get headers with token if needed (currently implementation doesn't strictly enforce token on backend for this, but good practice)
// Note: Backend currently doesn't check auth for /api/employees based on the code I wrote, 
// but in a real app we'd add the token. I'll add a simplified version.
const getConfig = () => {
    return {
        headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${token}` // If auth is added later
        }
    };
};

export const getEmployees = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const createEmployee = async (employeeData) => {
    const response = await axios.post(API_URL, employeeData, getConfig());
    return response.data;
};

export const updateEmployee = async (id, employeeData) => {
    const response = await axios.put(`${API_URL}/${id}`, employeeData, getConfig());
    return response.data;
};

export const toggleEmployeeStatus = async (id, status) => {
    const response = await axios.patch(`${API_URL}/${id}/status`, { status }, getConfig());
    return response.data;
};

export const deleteEmployee = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`, getConfig());
    return response.data;
};
