import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.1.10:5001';

export const getTodos = async () => {
    const response = await axios.get(`${API_URL}/api/todos`);
    return response.data;
};

export const getEmployeeTodos = async (employeeId) => {
    const response = await axios.get(`${API_URL}/api/todos/employee/${employeeId}`);
    return response.data;
};

export const createTodo = async (todoData) => {
    const response = await axios.post(`${API_URL}/api/todos`, todoData);
    return response.data;
};

export const updateTodo = async (id, todoData) => {
    const response = await axios.put(`${API_URL}/api/todos/${id}`, todoData);
    return response.data;
};

export const deleteTodo = async (id) => {
    const response = await axios.delete(`${API_URL}/api/todos/${id}`);
    return response.data;
};
