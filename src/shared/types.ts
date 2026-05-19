export interface Client {
  id: number;
  name: string;
  whatsapp: string;
  client_type?: string;
  cpf_cnpj?: string;
  email?: string;
  address?: string;
  contact?: string;
  phone_notes?: string;
  is_favorite?: number;
  logo_url?: string;
  tags?: string;
  instagram?: string;
  facebook?: string;
  internal_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface QuoteItem {
  id: string;
  name: string;
  price: number;
  type: 'service' | 'combo';
  displacement?: number;
  comboDetails?: string[];
}

export interface Quote {
  id: number;
  client_id: number;
  quote_number: string;
  items: QuoteItem[];
  subtotal: number;
  discount_percentage: number;
  discount_value?: number;
  total: number;
  status: 'pending' | 'approved';
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: number;
  client_id: number;
  service_name: string;
  service_type: string;
  appointment_date: string;
  appointment_time: string;
  duration_hours: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Receipt {
  id: number;
  quote_id: number;
  overtime_minutes: number;
  overtime_value: number;
  final_total: number;
  created_at: string;
  updated_at: string;
}

export interface MonthlyReceipt {
  id: number;
  client_id: number;
  amount: number;
  description: string;
  month_reference: string;
  created_at: string;
  updated_at: string;
}

export interface ServicePrice {
  id: number;
  service_id: string;
  name: string;
  price: number;
  type: 'service' | 'combo';
  per_track: number;
  per_video: number;
  per_image: number;
  hourly: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: number;
  service_id: string;
  name: string;
  type: 'service' | 'combo';
  price: number;
  description: string | null;
  is_hourly: number;
  is_per_track: number;
  is_per_image: number;
  is_per_video: number;
  combo_items: string | null;
  display_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface CashTransaction {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category?: string;
  client_id?: number;
  quote_id?: number;
  receipt_id?: number;
  payment_method?: string;
  transaction_date: string;
  created_at: string;
  updated_at: string;
}

export interface WithdrawalSettings {
  id: number;
  percentage: number;
  created_at: string;
  updated_at: string;
}

export interface Withdrawal {
  id: number;
  amount: number;
  withdrawal_date: string;
  month_reference: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectFile {
  id: number;
  project_id: number;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  r2_key: string;
  upload_date: string;
  expires_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientPortalLink {
  id: number;
  project_id: number;
  token: string;
  expires_at?: string;
  is_active: number;
  payment_required: number;
  payment_verified: number;
  access_count: number;
  last_accessed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface RecurringProject {
  id: number;
  client_id: number;
  project_name: string;
  description?: string;
  monthly_value?: number;
  start_date: string;
  end_date?: string;
  is_active: number;
  is_variable_value: number;
  payment_day?: number;
  notes?: string;
  client_name?: string;
  created_at: string;
  updated_at: string;
}
