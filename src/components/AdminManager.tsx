import React, { useState } from 'react';
import { UserPlus, Building2, Mail, Lock, User as UserIcon, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import { ApiService } from '../services/api';

interface AdminManagerProps {
  token: string | null;
}

interface CreatedAdmin {
  email: string;
  tenant_id: string;
  name?: string;
  role: string;
}

export const AdminManager: React.FC<AdminManagerProps> = ({ token }) => {
  const [tenantId, setTenantId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'TENANT_ADMIN' | 'CATALOG_ADMIN' | 'INSPECTOR'>('TENANT_ADMIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedAdmin | null>(null);

  const resetForm = () => {
    setTenantId('');
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    setRole('TENANT_ADMIN');
    setError(null);
    setCreated(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setLoading(true);

    try {
      const res = await ApiService.createAdmin(
        { tenant_id: tenantId, email, password, name: name || undefined, phone: phone || undefined, role },
        token
      );
      setCreated({
        email: res.user.email,
        tenant_id: res.user.tenant_id,
        name: res.user.name,
        role: res.user.role,
      });
      setTenantId('');
      setEmail('');
      setPassword('');
      setName('');
      setPhone('');
      setRole('TENANT_ADMIN');
    } catch (err: any) {
      setError(err.message || 'Error al crear el administrador');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '580px', margin: '0 auto', paddingTop: '32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            width: '42px', height: '42px', borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <UserPlus size={20} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
              Gestión de Administradores
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
              Crea administradores para cualquier tenant de la plataforma
            </p>
          </div>
        </div>
      </div>

      {/* Success banner */}
      {created && (
        <div style={{
          background: 'rgba(22, 163, 74, 0.12)',
          border: '1px solid rgba(22, 163, 74, 0.35)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
        }}>
          <CheckCircle size={20} color="#22c55e" style={{ flexShrink: 0, marginTop: '1px' }} />
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#22c55e', margin: '0 0 2px' }}>
              Administrador creado exitosamente
            </p>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
              <strong style={{ color: '#e2e8f0' }}>{created.email}</strong> asignado como{' '}
              <strong style={{ color: '#a78bfa' }}>{created.role}</strong> en el tenant{' '}
              <strong style={{ color: '#e2e8f0' }}>{created.tenant_id}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Form card */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#e2e8f0', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserPlus size={16} color="#7c3aed" /> Nuevo Administrador
        </h3>

        {error && (
          <div style={{
            background: 'rgba(220, 38, 38, 0.1)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '16px',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
          }}>
            <AlertCircle size={15} color="#f87171" />
            <span style={{ fontSize: '13px', color: '#f87171' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Tenant ID */}
          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
              <Building2 size={12} color="#ea580c" /> ID del Tenant *
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="00000000-0000-0000-0000-000000000001"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              required
            />
          </div>

          {/* Role selector */}
          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
              <UserIcon size={12} color="#7c3aed" /> Rol Asignado *
            </label>
            <select
              className="input-field"
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              required
            >
              <option value="TENANT_ADMIN">TENANT_ADMIN (Admin Principal de Tenant)</option>
              <option value="CATALOG_ADMIN">CATALOG_ADMIN (Admin de Catálogo)</option>
              <option value="INSPECTOR">INSPECTOR (Inspector Técnico)</option>
            </select>
          </div>

          {/* Name */}
          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
              <UserIcon size={12} color="#2563eb" /> Nombre Completo
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Ej. Ana García"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Phone */}
          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
              <Phone size={12} color="#16a34a" /> Celular / Teléfono
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Ej. +591 71234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* Email */}
          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
              <Mail size={12} color="#2563eb" /> Correo Electrónico *
            </label>
            <input
              type="email"
              className="input-field"
              placeholder="admin@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
              <Lock size={12} color="#2563eb" /> Contraseña *
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ flex: 1, padding: '12px' }}
            >
              {loading ? 'Creando...' : 'Crear Administrador'}
            </button>
            {(tenantId || email || password || name || phone) && (
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: '12px 16px',
                  background: 'rgba(148, 163, 184, 0.1)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '10px',
                  color: '#94a3b8',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Limpiar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Info note */}
      <div style={{
        marginTop: '16px',
        background: 'rgba(124, 58, 237, 0.08)',
        border: '1px solid rgba(124, 58, 237, 0.2)',
        borderRadius: '10px',
        padding: '12px 16px',
        fontSize: '12px',
        color: '#a78bfa',
        lineHeight: '1.5',
      }}>
        <strong>Nota:</strong> Solo el <code>SUPER_ADMIN</code> puede crear usuarios con roles administrativos (<code>TENANT_ADMIN</code>, <code>CATALOG_ADMIN</code>, <code>INSPECTOR</code>).
      </div>
    </div>
  );
};
