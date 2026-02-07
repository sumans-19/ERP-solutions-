import axios from 'axios';

const API_URL = 'http://192.168.1.10:5001/api/employees';

const employeeApi = {
  // Get all employees
  getAllEmployees: async () => {
    const response = await axios.get(API_URL);
    return response.data;
  },

  // Get employee by ID
  getEmployeeById: async (employeeId) => {
    const response = await axios.get(`${API_URL}/${employeeId}`);
    return response.data;
  },

  // Create new employee
  createEmployee: async (employeeData) => {
    const response = await axios.post(API_URL, employeeData);
    return response.data;
  },

  // Update employee
  updateEmployee: async (employeeId, employeeData) => {
    const response = await axios.put(`${API_URL}/${employeeId}`, employeeData);
    return response.data;
  },

  // Delete employee
  deleteEmployee: async (employeeId) => {
    const response = await axios.delete(`${API_URL}/${employeeId}`);
    return response.data;
  },

  // Get employees by status
  getEmployeesByStatus: async (status) => {
    const response = await axios.get(`${API_URL}?status=${status}`);
    return response.data;
  }
};

export default employeeApi;
