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
  customer_name?: string | null;
  customer_email?: string | null;
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
  } | null;
  created_at: string;
}

export type InspectionItemValue = boolean | number | string;

export interface PendingInspection {
  tenant_id: string;
  order_id: string;
  device_type_id: string;
  device_type_name: string;
  received_at: string;
  received_by_user?: string | null;
}

export interface InspectionChecklist {
  order_id: string;
  device_type_id: string;
  device_type_name: string;
  received_at: string;
  evaluation_rule_id: string;
  evaluation_rule_version: number;
  checklist: ChecklistItem[];
}

export interface InspectionItemInput {
  criterion_key: string;
  value: InspectionItemValue;
  observation?: string;
  evidence_refs?: string[];
}

export interface RegisterInspectionInput {
  order_id: string;
  evaluation_rule_id: string;
  evaluation_rule_version: number;
  actual_condition: string;
  observations?: string;
  evidence_refs?: string[];
  items: InspectionItemInput[];
}

export interface InspectionItem {
  id: string;
  inspection_id: string;
  criterion_key: string;
  criterion_label: string;
  criterion_type: ChecklistItem['type'];
  value: InspectionItemValue;
  result: 'PASS' | 'FAIL' | 'NOT_APPLICABLE' | null;
  observation: string | null;
  evidence_refs: string[];
  created_at: string;
}

export interface Inspection {
  id: string;
  tenant_id: string;
  order_id: string;
  device_type_id: string;
  device_type_name?: string;
  evaluation_rule_id: string;
  evaluation_rule_version: number;
  status: 'REGISTERED' | 'COMPLETED';
  result: 'RESALE' | 'RECYCLE' | null;
  actual_condition: string;
  observations: string | null;
  evidence_refs: string[];
  inspected_by_user: string;
  inspected_at: string;
  created_at: string;
  updated_at: string;
  items?: InspectionItem[];
}
