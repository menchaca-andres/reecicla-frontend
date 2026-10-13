import React from 'react';
import { RefreshCw, User as UserIcon, LogOut, ShieldCheck } from 'lucide-react';
import type { User } from '../../types';
import styles from './Navbar.module.css';

interface TenantNavbarProps {
  mode?: 'tenant';
  user: User | null;
  tenantId: string;
  tenantName?: string;
  slug?: string;
  onOpenAuth: () => void;
  onLogout: () => void;
  activeTab: 'cotizar' | 'historial' | 'reglas' | 'admins' | 'catalogo' | 'logistica' | 'auth';
  setActiveTab: (tab: 'cotizar' | 'historial' | 'reglas' | 'admins' | 'catalogo' | 'logistica' | 'auth') => void;
}

interface PlatformNavbarProps {
  mode: 'platform';
  admin: { name?: string; email: string };
  onLogout: () => void;
}

type NavbarProps = TenantNavbarProps | PlatformNavbarProps;

export const Navbar: React.FC<NavbarProps> = (props) => {
  if (props.mode === 'platform') {
    return (
      <header className="apple-global-nav">
        <div className="apple-global-nav-content">
          <span className={`apple-global-nav-link ${styles.brandLabel}`}>Reecicla</span>
          <nav className="apple-global-nav-list" aria-label="Navegación de plataforma">
            <span className="apple-global-nav-link active">Administración de plataforma</span>
          </nav>
          <div className={styles.actions}>
            <span className={styles.userName}>{props.admin.name || props.admin.email}</span>
            <button type="button" onClick={props.onLogout} className={`apple-global-nav-link ${styles.platformSignOut}`}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>
    );
  }

  const { user, tenantId, tenantName, slug, onOpenAuth, onLogout, activeTab, setActiveTab } = props;
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
            </>
          )}

          {user && (user.role === 'TENANT_ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'INSPECTOR') && (
            <button onClick={() => setActiveTab('logistica')} className={`apple-global-nav-link ${activeTab === 'logistica' ? 'active' : ''}`}>Logística e Inspección</button>
          )}

          {user?.role === 'SUPER_ADMIN' && (
            <button onClick={() => setActiveTab('admins')} className={`apple-global-nav-link ${activeTab === 'admins' ? 'active' : ''}`}>Admins</button>
          )}
        </nav>

        <div className={styles.actions}>
          <div className={styles.tenantBadge}>
            <ShieldCheck size={13} color="#0071e3" />
            <span>{tenantName || (slug ? `@${slug}` : tenantId.slice(0, 8))}</span>
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
