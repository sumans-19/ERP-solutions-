import axios from 'axios';

const API_URL = 'http://192.168.1.10:5001/api';

export const getParties = async () => {
    const response = await axios.get(`${API_URL}/parties`);
    return response.data;
};

export const getParty = async (id) => {
    const response = await axios.get(`${API_URL}/parties/${id}`);
    return response.data;
};

export const createParty = async (partyData) => {
    const response = await axios.post(`${API_URL}/parties`, partyData);
    return response.data;
};

export const updateParty = async (id, partyData) => {
    const response = await axios.put(`${API_URL}/parties/${id}`, partyData);
    return response.data;
};

export const deleteParty = async (id) => {
    const response = await axios.delete(`${API_URL}/parties/${id}`);
    return response.data;
};

export const getFollowUps = async (partyId) => {
    const response = await axios.get(`${API_URL}/parties/follow-ups`, { params: { partyId } });
    return response.data;
};

export const createFollowUp = async (followUpData) => {
    const response = await axios.post(`${API_URL}/parties/follow-ups`, followUpData);
    return response.data;
};
