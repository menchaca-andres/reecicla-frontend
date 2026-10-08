import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AuthPage } from './features/auth';
import { QuotationWizard, QuoteResultCard, QuoteHistory } from './features/cotizaciones';
import { PricingRulesManager } from './features/reglas-precios';
import { CatalogManager } from './features/catalogo';
import { AdminManager } from './features/admins';
import { LogisticsManager } from './features/logistica';
import type { User, Quote, AuthResponse } from './types';

import { ApiService } from './services/api';

const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

type Tab = 'cotizar' | 'historial' | 'reglas' | 'admins' | 'catalogo' | 'logistica' | 'auth';

export function App() {
  const [tenantId] = useState(DEFAULT_TENANT_ID);
  const [token, setToken] = useState<string | null>(localStorage.getItem('reecicla_token'));
  const [user, setUser] = useState<User | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>('cotizar');
  const [latestQuote, setLatestQuote] = useState<Quote | null>(null);

  useEffect(() => {
    if (token) {
      ApiService.getProfile(token)
        .then((res) => setUser(res.user))
        .catch(() => {
          localStorage.removeItem('reecicla_token');
          setToken(null);
          setUser(null);
        });
    }
  }, [token]);

  const handleAuthSuccess = (authData: AuthResponse) => {
    localStorage.setItem('reecicla_token', authData.token);
    setToken(authData.token);
    setUser(authData.user);
    setActiveTab('cotizar');
  };

  const handleLogout = () => {
    localStorage.removeItem('reecicla_token');
    setToken(null);
    setUser(null);
    setLatestQuote(null);
    setActiveTab('cotizar');
  };

  const handleQuoteCreated = (quote: Quote) => {
    setLatestQuote(quote);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {activeTab !== 'auth' && (
        <Navbar user={user} tenantId={tenantId} onOpenAuth={() => setActiveTab('auth')} onLogout={handleLogout} activeTab={activeTab} setActiveTab={setActiveTab} />
      )}
      <main style={{ flex: 1, maxWidth: '1440px', width: '100%', margin: '0 auto', padding: activeTab === 'auth' ? '0' : '0 32px 64px' }}>
        {activeTab === 'auth' && (<AuthPage onSuccess={handleAuthSuccess} onCancel={() => setActiveTab('cotizar')} defaultTenantId={tenantId} />)}

        {activeTab === 'cotizar' && (latestQuote ? <QuoteResultCard quote={latestQuote} onNewQuote={() => setLatestQuote(null)} /> : <QuotationWizard tenantId={tenantId} token={token} onQuoteCreated={handleQuoteCreated} onNeedAuth={() => setActiveTab('auth')} />)}

        {activeTab === 'historial' && (token ? (<QuoteHistory tenantId={tenantId} token={token} />) : (<div className="glass-panel" style={{ padding: '40px', textAlign: 'center', maxWidth: '540px', margin: '32px auto', background: '#ffffff' }}>
          <h3 style={{ fontSize: '20px', color: '#0f172a', marginBottom: '8px', fontWeight: 700 }}>Autenticación Reequerida</h3>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>Iniciá sesión para ver tus cotizaciones guardadas.</p>
          <button onClick={() => setActiveTab('auth')} className="btn-primary">Iniciar Sesión</button>
        </div>))}


        {activeTab === 'reglas' && (user && (user.role === 'TENANT_ADMIN' || user.role === 'CATALOG_ADMIN' || user.role === 'SUPER_ADMIN') ? (<PricingRulesManager tenantId={tenantId} token={token} />) : (<div className="glass-panel" style={{ padding: '40px', textAlign: 'center', maxWidth: '540px', margin: '32px auto', background: '#ffffff' }}>
          <h3 style={{ fontSize: '20px', color: '#0f172a', marginBottom: '8px', fontWeight: 700 }}>Acceso Restringido</h3>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
            La gestión de reglas de precios está reservada exclusivamente para administradores (<strong>TENANT_ADMIN</strong>, <strong>CATALOG_ADMIN</strong> o <strong>SUPER_ADMIN</strong>).
          </p>
          {!user && (<button onClick={() => setActiveTab('auth')} className="btn-primary">Iniciar Sesión</button>)}
        </div>))}


        {activeTab === 'catalogo' && (user && (user.role === 'TENANT_ADMIN' || user.role === 'CATALOG_ADMIN' || user.role === 'SUPER_ADMIN') ? (<CatalogManager tenantId={tenantId} token={token} />) : (<div className="glass-panel" style={{ padding: '40px', textAlign: 'center', maxWidth: '540px', margin: '32px auto', background: '#ffffff' }}>
          <h3 style={{ fontSize: '20px', color: '#0f172a', marginBottom: '8px', fontWeight: 700 }}>Acceso Restringido</h3>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
            La gestión de catálogo de dispositivos está reservada para administradores (<strong>CATALOG_ADMIN</strong>, <strong>TENANT_ADMIN</strong> o <strong>SUPER_ADMIN</strong>).
          </p>
          {!user && (<button onClick={() => setActiveTab('auth')} className="btn-primary">Iniciar Sesión</button>)}
        </div>))}


        {activeTab === 'admins' && (user?.role === 'SUPER_ADMIN' ? (<AdminManager token={token} />) : (<div className="glass-panel" style={{ padding: '40px', textAlign: 'center', maxWidth: '540px', margin: '32px auto', background: '#ffffff' }}>
          <h3 style={{ fontSize: '20px', color: '#0f172a', marginBottom: '8px', fontWeight: 700 }}>Acceso Restringido</h3>
          <p style={{ fontSize: '14px', color: '#64748b' }}>Solo el Super Administrador puede gestionar administradores de tenant.</p>
        </div>))}


        {activeTab === 'logistica' && (user && (user.role === 'TENANT_ADMIN' || user.role === 'CATALOG_ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'INSPECTOR') ? (<LogisticsManager token={token} />) : (<div className="glass-panel" style={{ padding: '40px', textAlign: 'center', maxWidth: '540px', margin: '32px auto', background: '#ffffff' }}>
          <h3 style={{ fontSize: '20px', color: '#0f172a', marginBottom: '8px', fontWeight: 700 }}>Acceso Restringido</h3>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
            La gestión de logística está reservada para personal autorizado y administradores.
          </p>
          {!user && (<button onClick={() => setActiveTab('auth')} className="btn-primary">Iniciar Sesión</button>)}
        </div>))}
      </main>
    </div>
  );
}

export default App;
