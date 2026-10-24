export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'USER' | 'ADMIN';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: number;
  vin?: string | null;
  make: string;
  model: string;
  category: string;
  year?: number | null;
  price: number;
  quantity: number;
  color?: string | null;
  mileage?: number | null;
  fuel_type?: string | null;
  transmission?: string | null;
  description?: string | null;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface VehiclePagination {
  items: Vehicle[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface InventoryTransaction {
  id: number;
  vehicle_id: number;
  user_id?: number | null;
  transaction_type: 'PURCHASE' | 'RESTOCK' | 'INITIAL_LOAD' | string;
  quantity_change: number;
  unit_price: number;
  total_amount: number;
  notes?: string | null;
  created_at: string;
  vehicle?: Vehicle | null;
  user?: User | null;
}

export interface TransactionListResponse {
  items: InventoryTransaction[];
  total: number;
}

export interface CategoryDistribution {
  category: string;
  models_count: number;
  units_in_stock: number;
  valuation: number;
}

export interface DashboardSummary {
  total_models: number;
  total_units: number;
  total_valuation: number;
  out_of_stock_count: number;
  low_stock_count: number;
  total_sales_revenue: number;
  total_units_sold: number;
  categories: CategoryDistribution[];
  recent_vehicles: Vehicle[];
  recent_transactions: InventoryTransaction[];
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
