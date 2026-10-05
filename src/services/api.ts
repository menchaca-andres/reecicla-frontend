import type { AuthResponse, User, Quote, QuoteRequest, PricingRule, DeviceType } from '../types';

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
  ): Promise<{ device_types: DeviceType[] }> {
    const params = new URLSearchParams({ tenant_id: tenantId });
    if (includeInactive) params.set('include_inactive', 'true');
    const res = await fetch(`${GATEWAY_URL}/api/catalog/device-types?${params}`, {
      headers: this.getHeaders(token),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al consultar el catálogo');
    return json;
  }

  static async createDeviceType(
    data: { code: string; name: string; description?: string },
    token: string
  ): Promise<{ device_type: DeviceType }> {
    const res = await fetch(`${GATEWAY_URL}/api/catalog/device-types`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al crear el tipo de equipo');
    return json;
  }

  static async updateDeviceType(
    id: string,
    data: { name: string; description?: string },
    token: string
  ): Promise<{ device_type: DeviceType }> {
    const res = await fetch(`${GATEWAY_URL}/api/catalog/device-types/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al actualizar el tipo de equipo');
    return json;
  }

  static async setDeviceTypeStatus(
    id: string,
    status: 'ACTIVE' | 'INACTIVE',
    token: string
  ): Promise<{ device_type: DeviceType }> {
    const res = await fetch(`${GATEWAY_URL}/api/catalog/device-types/${id}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(token),
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al cambiar el estado del tipo');
    return json;
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

  static async createQuote(quoteData: QuoteRequest, token: string): Promise<{ message: string; quote: Quote }> {
    const res = await fetch(`${GATEWAY_URL}/api/quotation/quotes`, {
      method: 'POST',
      headers: this.getHeaders(token),
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
    ruleData: { tenant_id: string; device_type: string; rule_key: string; rule_value: any },
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
}

