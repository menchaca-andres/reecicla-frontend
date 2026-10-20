export type UserRole = 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'CATALOG_ADMIN' | 'INSPECTOR' | 'CLIENT';

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  name?: string;
  phone?: string;
  pickup_address?: string | null;
  role: UserRole;
  created_at: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface RegistrationStartResponse {
  verification_required: true;
  message: string;
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
  currency?: string;
  base_price: string | number;
  adjustment: string | number;
  final_price: string | number;
  quote_type?: 'INITIAL' | 'ADJUSTED';
  parent_quote_id?: string | null;
  adjustment_reason?: string | null;
  adjusted_quote?: Quote | null;
  adjustment_audit?: {
    outcome: 'ADJUSTED' | 'UNCHANGED';
    declared_condition: string;
    actual_condition: string;
    justification: string;
  } | null;
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
export type DispositionType = 'RESALE' | 'RECYCLE' | 'RETURN';

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
  final_price?: number | string | null;
  currency: string;
  status: string;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  tracking_code?: string | null;
  box_status?: string | null;
  shipped_at?: string | null;
  received_at?: string | null;
  adjustment_rejected_at?: string | null;
  adjustment_resolution?: 'RETURN' | 'RECYCLE' | null;
  adjustment_resolution_at?: string | null;
  disposition_type?: DispositionType | null;
  disposition_status?: 'PENDING' | 'COMPLETED' | null;
  disposition_reference?: string | null;
  disposition_completed_at?: string | null;
  status_history?: Array<{
    previous_status: string | null;
    new_status: string;
    reason: string | null;
    created_at: string;
  }>;
  notifications?: OrderNotification[];
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

export interface OrderNotification {
  notification_type: string;
  channel: 'EMAIL';
  sent_at: string;
}

export interface PaymentRecord {
  id: string;
  tenant_id: string;
  order_id: string;
  amount: number;
  currency: string;
  method: 'BANK_TRANSFER' | 'CHECK';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  reference: string | null;
  failure_reason?: string | null;
  paid_at: string | null;
  created_at: string;
  receipt_available: boolean;
  external_receipt_available: boolean;
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
  result_justification: string | null;
  completed_by_user: string | null;
  completed_at: string | null;
  actual_condition: string;
  observations: string | null;
  evidence_refs: string[];
  inspected_by_user: string;
  inspected_at: string;
  created_at: string;
  updated_at: string;
  items?: InspectionItem[];
}

export interface CompleteInspectionInput {
  result: 'RESALE' | 'RECYCLE';
  justification: string;
}

export interface GuestOrderTracking {
  order_number: string;
  quote_id: string;
  device_type_name: string;
  brand: string | null;
  model: string | null;
  device_year: number | null;
  declared_condition: string;
  quoted_price: number | string;
  final_price?: number | string | null;
  currency: string;
  status: string;
  adjustment_rejected_at: string | null;
  adjustment_resolution: 'RETURN' | 'RECYCLE' | null;
  adjustment_resolution_at: string | null;
  disposition_type?: DispositionType | null;
  disposition_status?: 'PENDING' | 'COMPLETED' | null;
  disposition_reference?: string | null;
  disposition_completed_at?: string | null;
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
  notifications: OrderNotification[];
}

// HU-022: reportes del negocio (read model de reporting-service).
export type AmountsByCurrency = Record<string, number>;

export interface ReportSummary {
  tenant_id: string;
  period: { from: string; to: string };
  generated_at: string;
  last_event_at: string | null;
  quotes: {
    total: number;
    by_status: Record<'ANONYMOUS' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED', number>;
    by_type: Record<'INITIAL' | 'ADJUSTED', number>;
    acceptance_rate: number;
    quoted_amount: AmountsByCurrency;
    accepted_amount: AmountsByCurrency;
    by_device_type: Array<{ device_type_name: string; total: number; accepted: number }>;
  };
  orders: {
    created_in_period: number;
    by_status_in_period: Record<string, number>;
    current_by_status: Record<string, number>;
  };
  payments: {
    completed: number;
    failed: number;
    completed_amount: AmountsByCurrency;
    by_method: Record<string, { completed: number; failed: number; amount: AmountsByCurrency }>;
  };
  dispositions: {
    total: number;
    by_type: Record<'RESALE' | 'RECYCLE' | 'RETURN', number>;
  };
}
