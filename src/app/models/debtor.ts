export interface Debtor {
  _id?: string;

  name: string;
  amount: number;
  currency: 'USD' | 'KHR';

  owedDate: string;
  dueDate: string;

  note: string;

  status: 'unpaid' | 'paid';
  paidDate?: string | null;

  // Invoice
  invoiceNumber?: string;
  invoiceName?: string;
  invoiceData?: string;

  // MongoDB
  createdAt?: string;
  updatedAt?: string;
}