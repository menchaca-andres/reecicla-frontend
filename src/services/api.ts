import type { AuthResponse, User, Quote, QuoteRequest, PricingRule, DeviceType, DeviceBrand, Device, EvaluationRule, ChecklistItem, BoxRequest, CreateBoxRequestInput, Order } from '../types';

const GATEWAY_URL = 'http://localhost:3000';

export class ApiService {
  private static slug = 'demo';

  static setSlug(slug: string): void {
    this.slug = slug;
  }

  private static scoped(service: 'quotation' | 'catalog' | 'auth' | 'orders', path: string): string {
    return `${GATEWAY_URL}/recicla/${encodeURIComponent(this.slug)}/${service}${path}`;
  }

  private static getHeaders(token?: string | null): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }


  static async getTenantBySlug(slug: string): Promise<{ tenant_id: string; slug: string; name: string }> {
    const res = await fetch(`${GATEWAY_URL}/api/auth/tenants/slug/${encodeURIComponent(slug)}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Negocio no encontrado');
    return json;
  }

  static async getDeviceTypes(
    token?: string | null,
    includeInactive = false
  ): Promise<{ device_types: DeviceType[]; deviceTypes: DeviceType[] }> {
    const params = new URLSearchParams();
    if (includeInactive) params.set('include_inactive', 'true');
    const query = params.toString();
    const res = await fetch(`${this.scoped('catalog', `/device-types${query ? `?${query}` : ''}`)}`, {
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
    const res = await fetch(this.scoped('catalog', '/device-types'), {
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
    data: {
      name?: string;
      description?: string;
      accepts_quotes?: boolean;
      status?: 'ACTIVE' | 'INACTIVE';
    },
    token: string
  ): Promise<{ device_type: DeviceType; deviceType: DeviceType }> {
    const res = await fetch(this.scoped('catalog', `/device-types/${id}`), {
      method: 'PUT',
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
  ): Promise<void> {
    if (status === 'INACTIVE') {
      await this.inactivateDeviceType(id, token);
      return;
    }

    const res = await fetch(this.scoped('catalog', `/device-types/${id}`), {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al reactivar el tipo de equipo');
  }

  static async inactivateDeviceType(id: string, token: string): Promise<void> {
    const res = await fetch(this.scoped('catalog', `/device-types/${id}/inactivate`), {
      method: 'PATCH',
      headers: this.getHeaders(token),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al inactivar el tipo de equipo');
  }



  static async register(data: {
    email: string;
    password: string;
    name?: string;
    phone?: string;
    role?: string;
  }): Promise<AuthResponse> {
    const res = await fetch(this.scoped('auth', '/register'), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al registrarse');
    return json;
  }

  static async login(data: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const res = await fetch(this.scoped('auth', '/login'), {
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

  static async createQuote(
    quoteData: QuoteRequest,
    token?: string | null,
    idempotencyKey?: string
  ): Promise<{ message: string; quote: Quote }> {
    const headers = this.getHeaders(token);
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    const res = await fetch(this.scoped('quotation', '/quotes'), {
      method: 'POST',
      headers,
      body: JSON.stringify(quoteData),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al solicitar cotización');
    return json;
  }

  static async getQuoteById(quoteId: string): Promise<{ quote: Quote }> {
    const res = await fetch(this.scoped('quotation', `/quotes/${encodeURIComponent(quoteId)}`));
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Cotización no encontrada');
    return json;
  }

  static async getUserQuotes(token: string): Promise<{ quotes: Quote[] }> {
    const res = await fetch(this.scoped('quotation', '/quotes/user'), {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al consultar historial');
    return json;
  }

  static async acceptQuote(
    quoteId: string,
    token?: string | null,
    customerData?: { customer_name?: string; customer_email?: string; phone?: string; address?: string }
  ): Promise<{ quote: Quote; token?: string; user?: User }> {
    const res = await fetch(this.scoped('quotation', `/quotes/${encodeURIComponent(quoteId)}/accept`), {
      method: 'POST',
      headers: this.getHeaders(token),
      body: customerData ? JSON.stringify(customerData) : undefined,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al aceptar la cotización');
    return json;
  }

  static async rejectQuote(quoteId: string, token?: string | null): Promise<{ quote: Quote }> {
    const res = await fetch(this.scoped('quotation', `/quotes/${encodeURIComponent(quoteId)}/reject`), {
      method: 'POST',
      headers: this.getHeaders(token),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al rechazar la cotización');
    return json;
  }

  static async getUserOrders(token: string): Promise<{ orders: Order[] }> {
    const res = await fetch(this.scoped('orders', '/'), {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al consultar órdenes');
    return json;
  }

  static async getAllOrders(token: string): Promise<{ orders: Order[] }> {
    const res = await fetch(this.scoped('orders', '/admin/all'), {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al consultar todas las órdenes');
    return json;
  }

  static async dispatchOrder(
    orderId: string,
    trackingCode: string,
    token: string,
    status: 'BOX_SHIPPED' | 'IN_TRANSIT' = 'BOX_SHIPPED'
  ): Promise<{ message: string; result: any }> {
    const res = await fetch(this.scoped('orders', `/${orderId}/dispatch`), {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify({ tracking_code: trackingCode, status }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al registrar el envío');
    return json;
  }

  static async getRules(token: string): Promise<{ rules: PricingRule[] }> {
    const res = await fetch(this.scoped('quotation', '/rules'), {
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
    const res = await fetch(this.scoped('quotation', '/rules'), {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(ruleData),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al guardar regla');
    return json;
  }

  static async getBrands(
    deviceTypeId?: string,
    token?: string | null,
    includeInactive = false
  ): Promise<{ brands: DeviceBrand[] }> {
    const params = new URLSearchParams();
    if (deviceTypeId) params.set('device_type_id', deviceTypeId);
    if (includeInactive) params.set('include_inactive', 'true');
    const query = params.toString();

    const res = await fetch(this.scoped('catalog', `/brands${query ? `?${query}` : ''}`), {
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
    const res = await fetch(this.scoped('catalog', '/brands'), {
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
    const res = await fetch(this.scoped('catalog', `/brands/${id}`), {
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
    const res = await fetch(this.scoped('catalog', `/brands/${id}/status`), {
      method: 'PATCH',
      headers: this.getHeaders(token),
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al cambiar estado de la marca');
    return { brand: json.brand };
  }

  static async getDevices(
    deviceTypeId?: string,
    token?: string | null,
    includeInactive = false
  ): Promise<{ devices: Device[] }> {
    const params = new URLSearchParams();
    if (deviceTypeId) params.set('device_type_id', deviceTypeId);
    if (includeInactive) params.set('include_inactive', 'true');
    const query = params.toString();

    const res = await fetch(this.scoped('catalog', `/devices${query ? `?${query}` : ''}`), {
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
    const res = await fetch(this.scoped('catalog', '/devices'), {
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
    const res = await fetch(this.scoped('catalog', `/devices/${id}`), {
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
    const res = await fetch(this.scoped('catalog', `/devices/${id}/status`), {
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
    const res = await fetch(this.scoped('catalog', `/evaluation-rules/active?device_type_id=${deviceTypeId}`), {
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
    const res = await fetch(this.scoped('catalog', `/evaluation-rules/history?device_type_id=${deviceTypeId}`), {
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
    const res = await fetch(this.scoped('catalog', '/evaluation-rules'), {
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
    const res = await fetch(this.scoped('orders', `/${encodeURIComponent(orderId)}/box-requests`), {
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
    const res = await fetch(this.scoped('orders', `/${encodeURIComponent(orderId)}/box-requests`), {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al consultar solicitudes de caja');
    return json;
  }
}


