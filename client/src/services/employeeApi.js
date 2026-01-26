import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

export const getEmployees = async () => {
    const response = await axios.get(`${API_URL}/employees`);
    return response.data;
};

export const createEmployee = async (employeeData) => {
    const response = await axios.post(`${API_URL}/employees`, employeeData);
    return response.data;
};

export const updateEmployee = async (id, employeeData) => {
    const response = await axios.put(`${API_URL}/employees/${id}`, employeeData);
    return response.data;
};

export const updateEmployeeStatus = async (id, status) => {
    const response = await axios.patch(`${API_URL}/employees/${id}/status`, { status });
    return response.data;
};
