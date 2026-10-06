import type { AuthResponse, User, Quote, QuoteRequest, PricingRule, DeviceType, DeviceBrand, Device, EvaluationRule, ChecklistItem, BoxRequest, CreateBoxRequestInput, Order } from '../types';

const GATEWAY_URL = 'http://localhost:3000';

export class ApiService {
  private static getHeaders(token?: string | null): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }


  static async getDeviceTypes(
    tenantId: string,
    token?: string | null,
    includeInactive = false
  ): Promise<{ device_types: DeviceType[]; deviceTypes: DeviceType[] }> {
    const params = new URLSearchParams({ tenant_id: tenantId });
    if (includeInactive) params.set('include_inactive', 'true');
    const res = await fetch(`${GATEWAY_URL}/api/catalog/device-types?${params}`, {
      headers: this.getHeaders(token),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al consultar el catálogo');
    const list = json.device_types || json.deviceTypes || [];
    return { device_types: list, deviceTypes: list };
  }

  static async createDeviceType(
    data: { code: string; name: string; description?: string },
    token: string
  ): Promise<{ device_type: DeviceType; deviceType: DeviceType }> {
    const res = await fetch(`${GATEWAY_URL}/api/catalog/device-types`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al crear el tipo de equipo');
    const item = json.device_type || json.deviceType;
    return { device_type: item, deviceType: item };
  }

  static async updateDeviceType(
    id: string,
    data: { name: string; description?: string },
    token: string
  ): Promise<{ device_type: DeviceType; deviceType: DeviceType }> {
    const res = await fetch(`${GATEWAY_URL}/api/catalog/device-types/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al actualizar el tipo de equipo');
    const item = json.device_type || json.deviceType;
    return { device_type: item, deviceType: item };
  }

  static async setDeviceTypeStatus(
    id: string,
    status: 'ACTIVE' | 'INACTIVE',
    token: string
  ): Promise<{ device_type: DeviceType; deviceType: DeviceType }> {
    const res = await fetch(`${GATEWAY_URL}/api/catalog/device-types/${id}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(token),
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al cambiar el estado del tipo');
    const item = json.device_type || json.deviceType;
    return { device_type: item, deviceType: item };
  }

  static async inactivateDeviceType(id: string, token: string): Promise<void> {
    const res = await fetch(`${GATEWAY_URL}/api/catalog/device-types/${id}/inactivate`, {
      method: 'PATCH',
      headers: this.getHeaders(token),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al inactivar el tipo de equipo');
  }



  static async register(data: {
    tenant_id: string;
    email: string;
    password: string;
    name?: string;
    phone?: string;
    role?: string;
  }): Promise<AuthResponse> {
    const res = await fetch(`${GATEWAY_URL}/api/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al registrarse');
    return json;
  }

  static async login(data: {
    tenant_id: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const res = await fetch(`${GATEWAY_URL}/api/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al iniciar sesión');
    return json;
  }

  static async getProfile(token: string): Promise<{ user: User }> {
    const res = await fetch(`${GATEWAY_URL}/api/auth/me`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al obtener perfil');
    return json;
  }

  static async createQuote(quoteData: QuoteRequest, token: string, idempotencyKey: string): Promise<{ message: string; quote: Quote }> {
    const res = await fetch(`${GATEWAY_URL}/api/quotation/quotes`, {
      method: 'POST',
      headers: { ...this.getHeaders(token), 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(quoteData),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al solicitar cotización');
    return json;
  }

  static async getUserQuotes(tenantId: string, token: string): Promise<{ quotes: Quote[] }> {
    const res = await fetch(`${GATEWAY_URL}/api/quotation/quotes/user?tenant_id=${tenantId}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al consultar historial');
    return json;
  }

  static async acceptQuote(quoteId: string, token: string): Promise<{ quote: Quote }> {
    const res = await fetch(`${GATEWAY_URL}/api/quotation/quotes/${encodeURIComponent(quoteId)}/accept`, {
      method: 'POST',
      headers: this.getHeaders(token),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al aceptar la cotización');
    return json;
  }

  static async getUserOrders(token: string): Promise<{ orders: Order[] }> {
    const res = await fetch(`${GATEWAY_URL}/api/orders`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al consultar órdenes');
    return json;
  }

  static async getRules(tenantId: string, token: string): Promise<{ rules: PricingRule[] }> {
    const res = await fetch(`${GATEWAY_URL}/api/quotation/rules?tenant_id=${tenantId}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al obtener reglas');
    return json;
  }

  static async createAdmin(
    data: { tenant_id: string; email: string; password: string; name?: string; phone?: string; role?: string },
    token: string
  ): Promise<{ message: string; user: User }> {
    const res = await fetch(`${GATEWAY_URL}/api/auth/admin`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al crear administrador');
    return json;
  }

  static async defineRule(
    ruleData: {
      tenant_id: string;
      device_type: string;
      brand_id?: string;
      brand_name?: string;
      model?: string;
      min_year?: number;
      max_year?: number;
      rule_key: string;
      rule_value: any;
    },
    token?: string
  ): Promise<{ message: string; rule: PricingRule }> {
    const res = await fetch(`${GATEWAY_URL}/api/quotation/rules`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(ruleData),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al guardar regla');
    return json;
  }

  static async getBrands(
    tenantId: string,
    deviceTypeId?: string,
    token?: string | null,
    includeInactive = false
  ): Promise<{ brands: DeviceBrand[] }> {
    const params = new URLSearchParams({ tenant_id: tenantId });
    if (deviceTypeId) params.set('device_type_id', deviceTypeId);
    if (includeInactive) params.set('include_inactive', 'true');

    const res = await fetch(`${GATEWAY_URL}/api/catalog/brands?${params}`, {
      headers: this.getHeaders(token),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al consultar las marcas');
    return { brands: json.brands || [] };
  }

  static async createBrand(
    data: { device_type_id: string; name: string },
    token: string
  ): Promise<{ brand: DeviceBrand }> {
    const res = await fetch(`${GATEWAY_URL}/api/catalog/brands`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al crear la marca');
    return { brand: json.brand };
  }

  static async updateBrand(
    id: string,
    name: string,
    token: string
  ): Promise<{ brand: DeviceBrand }> {
    const res = await fetch(`${GATEWAY_URL}/api/catalog/brands/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(token),
      body: JSON.stringify({ name }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al actualizar la marca');
    return { brand: json.brand };
  }

  static async setBrandStatus(
    id: string,
    status: 'ACTIVE' | 'INACTIVE',
    token: string
  ): Promise<{ brand: DeviceBrand }> {
    const res = await fetch(`${GATEWAY_URL}/api/catalog/brands/${id}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(token),
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al cambiar estado de la marca');
    return { brand: json.brand };
  }

  static async getDevices(
    tenantId: string,
    deviceTypeId?: string,
    token?: string | null,
    includeInactive = false
  ): Promise<{ devices: Device[] }> {
    const params = new URLSearchParams({ tenant_id: tenantId });
    if (deviceTypeId) params.set('device_type_id', deviceTypeId);
    if (includeInactive) params.set('include_inactive', 'true');

    const res = await fetch(`${GATEWAY_URL}/api/catalog/devices?${params}`, {
      headers: this.getHeaders(token),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al consultar dispositivos');
    return { devices: json.devices || [] };
  }

  static async createDevice(
    data: { device_type_id: string; brand_id: string; model: string; year?: number | null; description?: string },
    token: string
  ): Promise<{ device: Device }> {
    const res = await fetch(`${GATEWAY_URL}/api/catalog/devices`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al registrar el dispositivo');
    return { device: json.device };
  }

  static async updateDevice(
    id: string,
    data: { model?: string; year?: number | null; description?: string; brand_id?: string },
    token: string
  ): Promise<{ device: Device }> {
    const res = await fetch(`${GATEWAY_URL}/api/catalog/devices/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al actualizar el dispositivo');
    return { device: json.device };
  }

  static async setDeviceStatus(
    id: string,
    status: 'ACTIVE' | 'INACTIVE',
    token: string
  ): Promise<{ device: Device }> {
    const res = await fetch(`${GATEWAY_URL}/api/catalog/devices/${id}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(token),
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al cambiar estado del dispositivo');
    return { device: json.device };
  }

  static async getActiveEvaluationRule(
    deviceTypeId: string,
    token?: string | null
  ): Promise<{ rule: EvaluationRule | null }> {
    const res = await fetch(`${GATEWAY_URL}/api/catalog/evaluation-rules/active?device_type_id=${deviceTypeId}`, {
      headers: this.getHeaders(token),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al obtener la regla de evaluación activa');
    return { rule: json.rule };
  }

  static async getEvaluationRuleHistory(
    deviceTypeId: string,
    token?: string | null
  ): Promise<{ rules: EvaluationRule[] }> {
    const res = await fetch(`${GATEWAY_URL}/api/catalog/evaluation-rules/history?device_type_id=${deviceTypeId}`, {
      headers: this.getHeaders(token),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al obtener historial de reglas de evaluación');
    return { rules: json.rules || [] };
  }

  static async createEvaluationRuleVersion(
    data: { device_type_id: string; checklist: ChecklistItem[]; resale_criteria?: Record<string, any>; recycle_criteria?: Record<string, any> },
    token: string
  ): Promise<{ rule: EvaluationRule; message: string }> {
    const res = await fetch(`${GATEWAY_URL}/api/catalog/evaluation-rules`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al crear versión de regla de evaluación');
    return { rule: json.rule, message: json.message };
  }

  static async requestBox(
    orderId: string,
    address: CreateBoxRequestInput,
    token: string
  ): Promise<{ message: string; box_request: BoxRequest }> {
    const res = await fetch(`${GATEWAY_URL}/api/orders/${encodeURIComponent(orderId)}/box-requests`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(address),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al solicitar caja');
    return json;
  }

  static async getBoxRequests(
    orderId: string,
    token: string
  ): Promise<{ box_requests: BoxRequest[] }> {
    const res = await fetch(`${GATEWAY_URL}/api/orders/${encodeURIComponent(orderId)}/box-requests`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al consultar solicitudes de caja');
    return json;
  }
}


