import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User as UserIcon, Phone, Building2, KeyRound } from 'lucide-react';
import { ApiService } from '../services/api';
import type { AuthResponse } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (authData: AuthResponse) => void;
  defaultTenantId: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultTenantId,
}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [tenantId, setTenantId] = useState(defaultTenantId);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setPassword('');
      setName('');
      setPhone('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const res = await ApiService.login({ tenant_id: tenantId, email, password });
        onSuccess(res);
      } else {
        const res = await ApiService.register({
          tenant_id: tenantId,
          email,
          password,
          name: name || undefined,
          phone: phone || undefined,
        });
        onSuccess(res);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error en la autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '28px', position: 'relative', background: '#ffffff' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ background: '#eff6ff', width: '48px', height: '48px', borderRadius: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px', border: '1px solid #bfdbfe' }}>
            <KeyRound size={24} color="#2563eb" />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            {isLogin ? 'Ingresa con tus credenciales de cliente' : 'Regístrate para solicitar y guardar cotizaciones'}
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', background: '#f8fafc', padding: '4px', borderRadius: '10px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(null); }}
            style={{
              flex: 1,
              padding: '7px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              background: isLogin ? '#ffffff' : 'transparent',
              color: isLogin ? '#2563eb' : '#64748b',
              boxShadow: isLogin ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(null); }}
            style={{
              flex: 1,
              padding: '7px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              background: !isLogin ? '#ffffff' : 'transparent',
              color: !isLogin ? '#2563eb' : '#64748b',
              boxShadow: !isLogin ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            Regístrate
          </button>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#475569', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
              <Building2 size={13} color="#ea580c" /> ID de Tenant
            </label>
            <input
              type="text"
              className="input-field"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              required
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label style={{ fontSize: '12px', color: '#475569', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                  <UserIcon size={13} color="#2563eb" /> Nombre Completo
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ej. Juan Pérez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#475569', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                  <Phone size={13} color="#16a34a" /> Celular / Teléfono
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ej. +591 71234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </>
          )}

          <div>
            <label style={{ fontSize: '12px', color: '#475569', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
              <Mail size={13} color="#2563eb" /> Correo Electrónico
            </label>
            <input
              type="email"
              className="input-field"
              placeholder="cliente@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#475569', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
              <Lock size={13} color="#2563eb" /> Contraseña
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '8px', padding: '12px' }}
          >
            {loading ? 'Procesando...' : isLogin ? 'Ingresar a la Plataforma' : 'Crear Cuenta'}
          </button>
        </form>
      </div>
    </div>
  );
};
