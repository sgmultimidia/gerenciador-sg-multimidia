export interface ProjectStatusData {
  id: number;
  quote_id: number;
  status: 'not_started' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  progress: number;
  estimated_delivery: string | null;
  actual_delivery: string | null;
  notes: string | null;
  quote_number?: string;
  client_name?: string;
  created_at: string;
  updated_at: string;
}
