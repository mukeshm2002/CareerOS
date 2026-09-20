import api from './api';

export const contactService = {
  getPhoneContact: async () => {
    const res = await api.get('/contacts/phone');
    return res.data?.data || res.data;
  },

  startVerification: async (phoneNumber) => {
    const res = await api.post('/contacts/phone/verification/start', { phoneNumber });
    return res.data?.data || res.data;
  },

  confirmVerification: async (code) => {
    const res = await api.post('/contacts/phone/verification/confirm', { code });
    return res.data?.data || res.data;
  },

  deletePhoneContact: async () => {
    const res = await api.delete('/contacts/phone');
    return res.data?.data || res.data;
  },
};
