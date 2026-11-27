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
  /** Queue the ticket is in (absent on tickets made before teams existed = support) */
  team?: SupportTeam;
  /** Staff-only notes (transfers between teams, notes) — the server never sends them to the seller */
  internalNotes?: TicketInternalNote[];
  /** Raised by a sales person for this seller (Sales panel → Create ticket); staff also get the employee code */
  raisedBy?: { kind?: 'sales'; name?: string; employeeId?: string };
}

export type SupportTeam = 'support' | 'tech';
export const TEAM_LABEL: Record<SupportTeam, string> = { support: 'Support', tech: 'Tech' };
export const teamOf = (t: Pick<Ticket, 'team'>): SupportTeam => (t.team === 'tech' ? 'tech' : 'support');

export interface TicketInternalNote {
  /** handback: Support sent a sales-raised ticket back to the sales person; sales: the sales person's note */
  kind: 'transfer' | 'note' | 'handback' | 'sales';
  fromTeam?: SupportTeam;
  toTeam?: SupportTeam;
  note: string;
  byName?: string;
  at: string;
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

/** Staff: move a ticket to the other team's queue, with a note for that team */
export const transferTicket = async (id: string, team: SupportTeam, note: string): Promise<Ticket> => {
  const { data } = await apiClient.put(`/support/${id}/transfer`, { team, note });
  return data.ticket;
};

/** Staff: a note only the support and tech teams see */
export const addInternalNote = async (id: string, note: string): Promise<Ticket> => {
  const { data } = await apiClient.post(`/support/${id}/notes`, { note });
  return data.ticket;
};

/** Staff: send a ticket a sales person raised back to them (they call the seller again), optionally closing it */
export const handbackTicket = async (id: string, note: string, close: boolean): Promise<Ticket> => {
  const { data } = await apiClient.put(`/support/${id}/handback`, { note, close });
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
