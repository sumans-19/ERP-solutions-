import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/orders';

// Standard config helper
const getConfig = () => {
    return {
        headers: {
            'Content-Type': 'application/json'
        }
    };
};

export const getOrders = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const assignProcess = async (orderId, processName, employeeId) => {
    const response = await axios.patch(
        `${API_URL}/${orderId}/process-assign`,
        { process: processName, employeeId },
        getConfig()
    );
    return response.data;
};
