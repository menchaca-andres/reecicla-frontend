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

export interface PlatformAuthResponse {
  message: string;
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'SUPER_ADMIN';
  };
}

export interface QuoteRequest {
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
  device_type_id?: string;
  brand_id?: string | null;
  brand_name?: string | null;
  model?: string | null;
  min_year?: number | null;
  max_year?: number | null;
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

export interface DeviceBrand {
  id: string;
  tenant_id: string;
  device_type_id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

export interface Device {
  id: string;
  tenant_id: string;
  device_type_id: string;
  brand_id: string;
  model: string;
  year: number | null;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
  device_type_name?: string;
  device_type_code?: string;
  brand_name?: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  type: 'boolean' | 'number' | 'text' | 'select';
  options?: string[];
  required: boolean;
}

export interface EvaluationRule {
  id: string;
  tenant_id: string;
  device_type_id: string;
  version: number;
  checklist: ChecklistItem[];
  resale_criteria: Record<string, any>;
  recycle_criteria: Record<string, any>;
  is_active: boolean;
  effective_from: string;
  effective_until?: string | null;
  created_at: string;
  updated_at: string;
  device_type_name?: string;
  device_type_code?: string;
}

export interface CreateBoxRequestInput {
  street: string;
  city: string;
  state: string;
  zip_code: string;
  notes?: string;
}

export interface BoxRequest {
  id: string;
  tenant_id: string;
  order_id: string;
  status: 'REQUESTED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
  tracking_number?: string;
  requested_at: string;
  updated_at: string;
}
export interface Order {
  id: string;
  tenant_id: string;
  order_number: string;
  quote_id: string;
  device_type_id: string;
  device_type_name: string;
  brand?: string | null;
  model?: string | null;
  device_year?: number | null;
  declared_condition?: string | null;
  quoted_price: number | string;
  currency: string;
  status: string;
  inventory_status?: string | null;
  disposition_id?: string | null;
  disposition_type?: 'RESALE' | 'RECYCLE' | null;
  disposition_status?: string | null;
  disposition_reason?: string | null;
  disposition_determined_at?: string | null;
  disposition_determined_by_user?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  tracking_code?: string | null;
  box_status?: string | null;
  shipped_at?: string | null;
  received_at?: string | null;
  status_history?: Array<{
    previous_status: string | null;
    new_status: string;
    reason: string | null;
    created_at: string;
  }>;
  pickup_address?: {
    street?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    notes?: string;
    address?: string;
  } | null;
  created_at: string;
}

export interface GuestOrderTracking {
  order_number: string;
  device_type_name: string;
  brand: string | null;
  model: string | null;
  device_year: number | null;
  declared_condition: string;
  quoted_price: number | string;
  currency: string;
  status: string;
  accepted_at: string;
  tracking_code: string | null;
  box_status: string | null;
  shipped_at: string | null;
  status_history: Array<{
    previous_status: string | null;
    new_status: string;
    reason: string | null;
    created_at: string;
  }>;
}

export type DestinationType = 'RESALE' | 'RECYCLE';

export interface InspectionItem {
  id: string;
  inspection_id: string;
  criterion_key: string;
  criterion_label: string;
  result: 'PASS' | 'FAIL' | 'NOT_APPLICABLE';
  observation?: string | null;
  created_at: string;
}

export interface DiagnosticSummary {
  physical_state?: string;
  test_score?: number;
  passed_tests?: number;
  failed_tests?: number;
  battery_health?: string;
  screen_condition?: string;
  chassis_condition?: string;
  [key: string]: any;
}

export interface Inspection {
  id: string;
  tenant_id: string;
  order_id: string;
  device_type_id: string;
  inspected_by_user?: string | null;
  result: 'PASS' | 'FAIL' | 'PENDING' | 'RESALE' | 'RECYCLE';
  actual_condition?: string | null;
  observations?: string | null;
  diagnostic_summary?: DiagnosticSummary;
  inspected_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Disposition {
  id: string;
  tenant_id: string;
  order_id: string;
  type: 'RESALE' | 'RECYCLE';
  status: string;
  reason: string;
  determined_by_user?: string | null;
  determined_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderInspectionResponse {
  order: Order;
  inspection: Inspection | null;
  items: InspectionItem[];
  disposition: Disposition | null;
}

export interface DetermineDestinationPayload {
  destination: DestinationType;
  reason: string;
}

