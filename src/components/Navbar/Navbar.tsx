import React from 'react';
import { RefreshCw, User as UserIcon, LogOut, ShieldCheck } from 'lucide-react';
import type { User } from '../../types';
import styles from './Navbar.module.css';

interface NavbarProps {
  user: User | null;
  tenantId: string;
  onOpenAuth: () => void;
  onLogout: () => void;
  activeTab: 'cotizar' | 'historial' | 'reglas' | 'admins' | 'catalogo' | 'logistica' | 'auth';
  setActiveTab: (tab: 'cotizar' | 'historial' | 'reglas' | 'admins' | 'catalogo' | 'logistica' | 'auth') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, tenantId, onOpenAuth, onLogout, activeTab, setActiveTab }) => {
  return (
    <header className="apple-global-nav">
      <div className="apple-global-nav-content">

        <button onClick={() => setActiveTab('cotizar')} className={`apple-global-nav-link ${styles.brandButton}`} title="Reecicla Bolivia">
          <RefreshCw size={17} color="#1d1d1f" />
          <span className={styles.brandLabel}>Reecicla</span>
        </button>

        <nav className="apple-global-nav-list">
          <button onClick={() => setActiveTab('cotizar')} className={`apple-global-nav-link ${activeTab === 'cotizar' ? 'active' : ''}`}>Cotizaciones
          </button>

          {user && (
            <button onClick={() => setActiveTab('historial')} className={`apple-global-nav-link ${activeTab === 'historial' ? 'active' : ''}`}>Mis órdenes</button>
          )}

          {user && (user.role === 'TENANT_ADMIN' || user.role === 'CATALOG_ADMIN' || user.role === 'SUPER_ADMIN') && (
            <>
              <button onClick={() => setActiveTab('catalogo')} className={`apple-global-nav-link ${activeTab === 'catalogo' ? 'active' : ''}`}>Catálogo</button>
              <button onClick={() => setActiveTab('reglas')} className={`apple-global-nav-link ${activeTab === 'reglas' ? 'active' : ''}`}>Reglas</button>
              <button onClick={() => setActiveTab('logistica')} className={`apple-global-nav-link ${activeTab === 'logistica' ? 'active' : ''}`}>Logística</button>
            </>
          )}

          {user?.role === 'SUPER_ADMIN' && (
            <button onClick={() => setActiveTab('admins')} className={`apple-global-nav-link ${activeTab === 'admins' ? 'active' : ''}`}>Admins</button>
          )}
        </nav>

        <div className={styles.actions}>
          <div className={styles.tenantBadge}>
            <ShieldCheck size={13} color="#0071e3" />
            <span>{tenantId.slice(0, 8)}</span>
          </div>

          {user ? (
            <div className={styles.userRow}>
              <span className={styles.userName}>{user.name || user.email}</span>
              <button onClick={onLogout} title="Cerrar sesión" className={`apple-global-nav-link ${styles.iconButton}`}><LogOut size={15} color="rgba(0, 0, 0, 0.56)" /></button>
            </div>
          ) : (
            <button onClick={onOpenAuth} className={`apple-global-nav-link ${styles.signinLink} ${activeTab === 'auth' ? 'active' : ''}`}><UserIcon size={14} className={styles.signinIcon} /> Ingresar</button>
          )}
        </div>
      </div>
    </header>
  );
};
