export type UserRole = 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'CATALOG_ADMIN' | 'INSPECTOR' | 'CLIENT';

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  name?: string;
  phone?: string;
  role: UserRole;
  created_at: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface QuoteRequest {
  tenant_id: string;
  device_type: string;
  brand?: string;
  model?: string;
  year?: number;
  condition: string;
}

export interface Quote {
  id: string;
  tenant_id: string;
  user_id: string;
  device_type: string;
  brand?: string;
  model?: string;
  year?: number;
  condition: string;
  base_price: string | number;
  adjustment: string | number;
  final_price: string | number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PricingRule {
  id: string;
  tenant_id: string;
  device_type: string;
  rule_key: string;
  rule_value: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeviceType {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  accepts_quotes: boolean;
  last_received_at?: string;
  created_at: string;
  updated_at: string;
  inactivated_at?: string;
}
