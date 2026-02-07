import axios from 'axios';

const API_URL = 'http://192.168.1.10:5001/api/parties';

const partyApi = {
  // Get all parties
  getAllParties: async () => {
    const response = await axios.get(API_URL);
    return response.data;
  },

  // Get party by ID
  getPartyById: async (partyId) => {
    const response = await axios.get(`${API_URL}/${partyId}`);
    return response.data;
  },

  // Create new party
  createParty: async (partyData) => {
    const response = await axios.post(API_URL, partyData);
    return response.data;
  },

  // Update party
  updateParty: async (partyId, partyData) => {
    const response = await axios.put(`${API_URL}/${partyId}`, partyData);
    return response.data;
  },

  // Delete party
  deleteParty: async (partyId) => {
    const response = await axios.delete(`${API_URL}/${partyId}`);
    return response.data;
  },

  // Get follow-ups for a party
  getFollowUps: async (partyId) => {
    const response = await axios.get(`${API_URL}/follow-ups?partyId=${partyId}`);
    return response.data;
  },

  // Create follow-up for a party
  createFollowUp: async (followUpData) => {
    const response = await axios.post(`${API_URL}/follow-ups`, followUpData);
    return response.data;
  }
};

export default partyApi;
