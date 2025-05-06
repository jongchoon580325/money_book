export interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  section: string;
  category: string;
  subcategory?: string;
  item?: string;
  amount: number | string;
  memo?: string;
}

export type NewTransaction = Omit<Transaction, 'id'>; 