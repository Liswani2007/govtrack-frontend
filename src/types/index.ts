export interface Project {
  id: string;
  title: string;
  description: string | null;
  district_id: string;
  budget_allocated: number;
  budget_spent: number;
  start_date: string;
  deadline: string;
  status: 'active' | 'stalled' | 'completed' | 'suspended';
  contractor_name: string | null;
  created_by: string;
  created_at: string;
}

export interface Province {
  id: string;
  name: string;
}

export interface District {
  id: string;
  name: string;
  province_id: string;
}

export interface Transaction {
  id: string;
  project_id: string;
  amount: number;
  transaction_type: 'allocation' | 'expenditure' | 'adjustment';
  description: string | null;
  invoice_reference: string | null;
  created_by: string;
  approved_by: string | null;
  approved_at: string | null;
  timestamp: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'officer' | 'auditor' | 'citizen';
  is_active: boolean;
}