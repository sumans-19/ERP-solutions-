import axios from 'axios';

const API_URL = 'http://10.98.94.149:5001/api/step-assignments';

const stepAssignmentApi = {
  // Get all step assignments
  getAllAssignments: async () => {
    const response = await axios.get(API_URL);
    return response.data;
  },

  // Get assignments for a specific employee
  getAssignmentsByEmployee: async (employeeId) => {
    const response = await axios.get(`${API_URL}/by-employee/${employeeId}`);
    return response.data;
  },

  // Get all assignments for an item
  getAssignmentsByItem: async (itemId) => {
    const response = await axios.get(`${API_URL}/by-item/${itemId}`);
    return response.data;
  },

  // Get all assignments for an order
  getAssignmentsByOrder: async (orderId) => {
    const response = await axios.get(`${API_URL}/by-order/${orderId}`);
    return response.data;
  },

  // Create new step assignment
  createAssignment: async (assignmentData) => {
    const response = await axios.post(API_URL, assignmentData);
    return response.data;
  },

  // Update step assignment status and details
  updateAssignment: async (assignmentId, updateData) => {
    const response = await axios.put(`${API_URL}/${assignmentId}`, updateData);
    return response.data;
  },

  // Reassign step to different employee
  reassignStep: async (assignmentId, newEmployeeId, newEmployeeName) => {
    const response = await axios.put(`${API_URL}/${assignmentId}/reassign`, {
      newEmployeeId,
      newEmployeeName
    });
    return response.data;
  },

  // Delete assignment
  deleteAssignment: async (assignmentId) => {
    const response = await axios.delete(`${API_URL}/${assignmentId}`);
    return response.data;
  },

  // Get employee workload analytics
  getEmployeeWorkload: async () => {
    const response = await axios.get(`${API_URL}/analytics/employee-workload`);
    return response.data;
  },

  // Get manufacturing step progress analytics
  getStepProgress: async () => {
    const response = await axios.get(`${API_URL}/analytics/step-progress`);
    return response.data;
  }
};

export default stepAssignmentApi;
