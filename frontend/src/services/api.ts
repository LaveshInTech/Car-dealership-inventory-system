import axios from 'axios';
import {
  AuthResponse,
  User,
  Vehicle,
  VehiclePagination,
  InventoryTransaction,
  TransactionListResponse,
  DashboardSummary,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect on login or register check
      const url = error.config?.url || '';
      if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?expired=true';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authApi = {
  login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/login', credentials);
    return res.data;
  },
  register: async (userData: { email: string; full_name: string; password: string }): Promise<User> => {
    const res = await api.post<User>('/auth/register', userData);
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },
};

// Vehicles Services
export const vehiclesApi = {
  getVehicles: async (params?: {
    search?: string;
    make?: string;
    model?: string;
    category?: string;
    min_price?: number;
    max_price?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    page?: number;
    page_size?: number;
  }): Promise<VehiclePagination> => {
    const res = await api.get<VehiclePagination>('/vehicles', { params });
    return res.data;
  },
  searchVehicles: async (params?: {
    q?: string;
    category?: string;
    min_price?: number;
    max_price?: number;
    page?: number;
    page_size?: number;
  }): Promise<VehiclePagination> => {
    const res = await api.get<VehiclePagination>('/vehicles/search', { params });
    return res.data;
  },
  getVehicleById: async (id: number): Promise<Vehicle> => {
    const res = await api.get<Vehicle>(`/vehicles/${id}`);
    return res.data;
  },
  createVehicle: async (data: Partial<Vehicle>): Promise<Vehicle> => {
    const res = await api.post<Vehicle>('/vehicles', data);
    return res.data;
  },
  updateVehicle: async (id: number, data: Partial<Vehicle>): Promise<Vehicle> => {
    const res = await api.put<Vehicle>(`/vehicles/${id}`, data);
    return res.data;
  },
  deleteVehicle: async (id: number): Promise<void> => {
    await api.delete(`/vehicles/${id}`);
  },
};

// Inventory Services
export const inventoryApi = {
  purchaseVehicle: async (id: number, data: { units: number; notes?: string }): Promise<InventoryTransaction> => {
    const res = await api.post<InventoryTransaction>(`/vehicles/${id}/purchase`, data);
    return res.data;
  },
  restockVehicle: async (id: number, data: { units: number; notes?: string }): Promise<InventoryTransaction> => {
    const res = await api.post<InventoryTransaction>(`/vehicles/${id}/restock`, data);
    return res.data;
  },
  getTransactions: async (params?: {
    vehicle_id?: number;
    user_id?: number;
    transaction_type?: string;
    limit?: number;
    offset?: number;
  }): Promise<TransactionListResponse> => {
    const res = await api.get<TransactionListResponse>('/inventory/transactions', { params });
    return res.data;
  },
};

// Dashboard Services
export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    const res = await api.get<DashboardSummary>('/dashboard/summary');
    return res.data;
  },
};
