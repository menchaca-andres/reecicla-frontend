import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User as UserIcon, Phone, Building2, KeyRound } from 'lucide-react';
import { ApiService } from '../../../services/api';
import type { AuthResponse } from '../../../types';

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
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.35)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '32px',
          position: 'relative',
          background: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.12)',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(0, 0, 0, 0.05)',
            border: 'none',
            color: '#86868b',
            cursor: 'pointer',
            borderRadius: '980px',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
        >
          <X size={16} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              background: 'rgba(0, 113, 227, 0.08)',
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
            }}
          >
            <KeyRound size={26} color="#0071e3" />
          </div>
          <h3 style={{ fontSize: '22px', fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.02em' }}>
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h3>
          <p style={{ fontSize: '13px', color: '#86868b', marginTop: '4px' }}>
            {isLogin ? 'Ingresá con tus credenciales de cliente' : 'Registrate para solicitar y guardar cotizaciones'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="apple-nav-container" style={{ marginBottom: '20px', padding: '4px' }}>
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(null); }}
            className={`apple-nav-button ${isLogin ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center', padding: '8px' }}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(null); }}
            className={`apple-nav-button ${!isLogin ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center', padding: '8px' }}
          >
            Registrarse
          </button>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(255, 59, 48, 0.08)',
              border: '1px solid rgba(255, 59, 48, 0.2)',
              color: '#ff3b30',
              padding: '10px 14px',
              borderRadius: '12px',
              fontSize: '13px',
              marginBottom: '18px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label
              style={{
                fontSize: '12px',
                color: '#6e6e73',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                marginBottom: '6px',
              }}
            >
              <Building2 size={13} color="#0071e3" /> ID de Tenant
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
                <label
                  style={{
                    fontSize: '12px',
                    color: '#6e6e73',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    marginBottom: '6px',
                  }}
                >
                  <UserIcon size={13} color="#0071e3" /> Nombre Completo
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
                <label
                  style={{
                    fontSize: '12px',
                    color: '#6e6e73',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    marginBottom: '6px',
                  }}
                >
                  <Phone size={13} color="#34c759" /> Celular / Teléfono
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
            <label
              style={{
                fontSize: '12px',
                color: '#6e6e73',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                marginBottom: '6px',
              }}
            >
              <Mail size={13} color="#0071e3" /> Correo Electrónico
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
            <label
              style={{
                fontSize: '12px',
                color: '#6e6e73',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                marginBottom: '6px',
              }}
            >
              <Lock size={13} color="#0071e3" /> Contraseña
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
            style={{ width: '100%', marginTop: '10px', padding: '12px', fontSize: '15px' }}
          >
            {loading ? 'Procesando...' : isLogin ? 'Ingresar a la Plataforma' : 'Crear Cuenta'}
          </button>
        </form>
      </div>
    </div>
  );
};

