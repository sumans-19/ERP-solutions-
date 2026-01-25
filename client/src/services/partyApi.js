import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const getParties = async () => {
    const response = await axios.get(`${API_URL}/api/parties`);
    return response.data;
};

export const getFollowUps = async (partyId) => {
    const response = await axios.get(`${API_URL}/api/parties/follow-ups`, {
        params: { partyId }
    });
    return response.data;
};

export const createFollowUp = async (data) => {
    const response = await axios.post(`${API_URL}/api/parties/follow-ups`, data);
    return response.data;
};

// Seed/Create Party (for dev)
export const createParty = async (data) => {
    const response = await axios.post(`${API_URL}/api/parties`, data);
    return response.data;
};
