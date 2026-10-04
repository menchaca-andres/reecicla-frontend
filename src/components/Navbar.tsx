import React from 'react';
import { RefreshCw, User as UserIcon, LogOut, ShieldCheck, Cpu, Users } from 'lucide-react';
import type { User } from '../types';

interface NavbarProps {
  user: User | null;
  tenantId: string;
  onOpenAuth: () => void;
  onLogout: () => void;
  activeTab: 'cotizar' | 'historial' | 'reglas' | 'admins' | 'catalogo';
  setActiveTab: (tab: 'cotizar' | 'historial' | 'reglas' | 'admins' | 'catalogo') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  tenantId,
  onOpenAuth,
  onLogout,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '14px 28px', marginBottom: '32px' }}>
      <div style={{ maxWidth: '1140px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setActiveTab('cotizar')}>
          <div style={{ background: '#16a34a', padding: '8px', borderRadius: '10px', display: 'flex', color: '#ffffff' }}>
            <RefreshCw size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
              Reecicla<span style={{ color: '#2563eb' }}>.</span>
            </h2>
            <p style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '2px', fontWeight: 600 }}>
              Cotización Bolivia
            </p>
          </div>
        </div>

        {/* Navigation Tabs (Azul / Neutral) */}
        <nav style={{ display: 'flex', gap: '6px', background: '#f8fafc', padding: '4px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <button
            onClick={() => setActiveTab('cotizar')}
            style={{
              padding: '7px 14px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: activeTab === 'cotizar' ? '#2563eb' : 'transparent',
              color: activeTab === 'cotizar' ? '#ffffff' : '#64748b',
              transition: 'all 0.15s ease',
            }}
          >
            <Cpu size={15} /> Cotizar Equipo
          </button>
          {user && (
            <button
              onClick={() => setActiveTab('historial')}
              style={{
                padding: '7px 14px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'historial' ? '#2563eb' : 'transparent',
                color: activeTab === 'historial' ? '#ffffff' : '#64748b',
                transition: 'all 0.15s ease',
              }}
            >
              Mis Cotizaciones
            </button>
          )}
          {user && (user.role === 'TENANT_ADMIN' || user.role === 'CATALOG_ADMIN' || user.role === 'SUPER_ADMIN') && (
            <>
              <button
                onClick={() => setActiveTab('catalogo')}
                style={{
                  padding: '7px 14px',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  background: activeTab === 'catalogo' ? '#2563eb' : 'transparent',
                  color: activeTab === 'catalogo' ? '#ffffff' : '#64748b',
                  transition: 'all 0.15s ease',
                }}
              >
                Catálogo
              </button>
              <button
                onClick={() => setActiveTab('reglas')}
                style={{
                  padding: '7px 14px',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  background: activeTab === 'reglas' ? '#2563eb' : 'transparent',
                  color: activeTab === 'reglas' ? '#ffffff' : '#64748b',
                  transition: 'all 0.15s ease',
                }}
              >
                Reglas de Precios
              </button>
            </>
          )}
          {user?.role === 'SUPER_ADMIN' && (
            <button
              onClick={() => setActiveTab('admins')}
              style={{
                padding: '7px 14px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: activeTab === 'admins' ? '#7c3aed' : 'transparent',
                color: activeTab === 'admins' ? '#ffffff' : '#64748b',
                transition: 'all 0.15s ease',
              }}
            >
              <Users size={15} /> Administradores
            </button>
          )}
          {user && ['CATALOG_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(user.role) && (
            <button
              onClick={() => setActiveTab('catalogo')}
              style={{
                padding: '7px 14px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'catalogo' ? '#2563eb' : 'transparent',
                color: activeTab === 'catalogo' ? '#ffffff' : '#64748b',
                transition: 'all 0.15s ease',
              }}
            >
              Tipos de equipos
            </button>
          )}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff7ed', padding: '5px 10px', borderRadius: '20px', border: '1px solid #fed7aa' }}>
            <ShieldCheck size={13} color="#ea580c" />
            <span style={{ fontSize: '11px', color: '#9a3412', fontWeight: 600 }}>Tenant:</span>
            <span style={{ fontSize: '11px', color: '#c2410c', fontWeight: 700 }}>
              {tenantId.slice(0, 8)}...
            </span>
          </div>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#eff6ff', padding: '6px 12px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                <UserIcon size={15} color="#2563eb" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>{user.name || 'Usuario'}</p>
                    {user.role && (
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: user.role === 'SUPER_ADMIN' ? '#f3e8ff' : user.role === 'TENANT_ADMIN' || user.role === 'CATALOG_ADMIN' ? '#dcfce7' : user.role === 'INSPECTOR' ? '#fef3c7' : '#e2e8f0',
                        color: user.role === 'SUPER_ADMIN' ? '#6b21a8' : user.role === 'TENANT_ADMIN' || user.role === 'CATALOG_ADMIN' ? '#15803d' : user.role === 'INSPECTOR' ? '#b45309' : '#475569',
                        border: user.role === 'SUPER_ADMIN' ? '1px solid #d8b4fe' : user.role === 'TENANT_ADMIN' || user.role === 'CATALOG_ADMIN' ? '1px solid #86efac' : user.role === 'INSPECTOR' ? '1px solid #fde68a' : '1px solid #cbd5e1',
                        textTransform: 'uppercase'
                      }}>
                        {user.role}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '10px', color: '#64748b' }}>{user.email}</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Cerrar sesión"
                style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '8px', color: '#dc2626', cursor: 'pointer' }}
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button onClick={onOpenAuth} className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
              <UserIcon size={15} /> Iniciar Sesión / Registro
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
