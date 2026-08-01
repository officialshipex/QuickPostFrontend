import { apiClient } from '../apiClient';

export interface TicketMessage {
  sender: 'user' | 'admin';
  senderName: string;
  message: string;
  sentAt: string;
}

export interface Ticket {
  _id: string;
  ticketNumber: string;
  category: string;
  subcategory: string;
  awbType?: string;
  awbNumbers: string[];
  message: string;
  attachments: string[];
  fullname: string;
  phoneNumber: string;
  userId: string;
  email: string;
  isAdmin: boolean;
  company: string;
  status: 'new' | 'open' | 'awaiting_response' | 'closed' | 'active' | 'resolved' | 'deleted';
  messages: TicketMessage[];
  createdAt: string;
  lastRepliedAt?: string;
}

export const getAllTickets = async (): Promise<Ticket[]> => {
  const { data } = await apiClient.get('/support');
  return Array.isArray(data) ? data : [];
};

export const getUserTickets = async (): Promise<Ticket[]> => {
  const { data } = await apiClient.get('/support/user');
  return Array.isArray(data) ? data : [];
};

export const viewTicket = async (id: string): Promise<Ticket> => {
  const { data } = await apiClient.put(`/support/${id}/view`);
  return data.ticket;
};

export const replyToTicket = async (
  id: string,
  message: string,
  senderRole: 'admin' | 'user',
  senderName: string
): Promise<Ticket> => {
  const { data } = await apiClient.post(`/support/${id}/reply`, {
    message,
    senderRole,
    senderName,
  });
  return data.ticket;
};

export const closeTicket = async (id: string): Promise<Ticket> => {
  const { data } = await apiClient.put(`/support/${id}/close`);
  return data.ticket;
};

export const createTicket = async (fields: {
  category: string;
  subcategory: string;
  awbNumbers?: string;
  message: string;
  fullname: string;
  phoneNumber: string;
  email: string;
  company: string;
}): Promise<Ticket> => {
  const form = new FormData();
  Object.entries(fields).forEach(([k, v]) => { if (v) form.append(k, v); });
  const { data } = await apiClient.post('/support', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.ticket;
};
