/* Customers (the seller's buyers). There is no customers API yet, so customers the seller adds are kept in this
   browser, per account. Buyers from past orders are merged in on the Customers page (see AdminCustomers). */

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string; // 10 digits
  address1: string;
  address2: string;
  city: string;
  state: string;
  country: string;
  pinCode: string;
  tags: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type CustomerInput = Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>;

export const EMPTY_CUSTOMER: CustomerInput = {
  firstName: '', lastName: '', email: '', phone: '', address1: '', address2: '',
  city: '', state: '', country: 'India', pinCode: '', tags: [], notes: '',
};

export const INDIAN_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

/** Matches a state name from the pincode lookup ("DELHI", "Tamilnadu") to the list above. */
export function matchState(raw: string): string {
  const key = raw.toLowerCase().replace(/[^a-z]/g, '');
  if (!key) return '';
  return INDIAN_STATES.find(s => s.toLowerCase().replace(/[^a-z]/g, '') === key) || '';
}

export const ORDER_PREFILL_KEY = 'qp_order_prefill_customer';

const keyFor = (owner: string) => `qp_customers_${owner || 'me'}`;

export function readCustomers(owner: string): Customer[] {
  try {
    const list = JSON.parse(localStorage.getItem(keyFor(owner)) || '[]');
    return Array.isArray(list) ? list : [];
  } catch { return []; }
}

function writeCustomers(owner: string, list: Customer[]) {
  try { localStorage.setItem(keyFor(owner), JSON.stringify(list)); } catch { /* storage full or blocked */ }
}

export function findCustomerByPhone(owner: string, phone: string, exceptId?: string) {
  return readCustomers(owner).find(c => c.phone === phone && c.id !== exceptId);
}

export function saveCustomer(owner: string, input: CustomerInput, id?: string): Customer {
  const list = readCustomers(owner);
  const now = new Date().toISOString();
  const existing = id ? list.find(c => c.id === id) : undefined;
  const saved: Customer = existing
    ? { ...existing, ...input, updatedAt: now }
    : { ...input, id: `c_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, createdAt: now, updatedAt: now };
  writeCustomers(owner, existing ? list.map(c => (c.id === saved.id ? saved : c)) : [saved, ...list]);
  return saved;
}

export function deleteCustomer(owner: string, id: string) {
  writeCustomers(owner, readCustomers(owner).filter(c => c.id !== id));
}

/** Hands a customer to the Add Order page, which fills the delivery details from it. */
export function prefillOrderWith(c: Pick<Customer, 'firstName' | 'lastName' | 'email' | 'phone' | 'address1' | 'address2' | 'city' | 'state' | 'pinCode'>) {
  try {
    sessionStorage.setItem(ORDER_PREFILL_KEY, JSON.stringify({
      contactName: `${c.firstName} ${c.lastName}`.trim(),
      email: c.email,
      phoneNumber: c.phone,
      address: [c.address1, c.address2].filter(Boolean).join(', '),
      pinCode: c.pinCode,
      city: c.city,
      state: c.state,
    }));
  } catch { /* ignore */ }
}
