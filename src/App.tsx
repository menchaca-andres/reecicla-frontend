import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar/Navbar';
import { AuthPage } from './features/auth';
import { QuotationWizard, QuoteResultCard, QuoteHistory, GuestOrderTracking } from './features/cotizaciones';
import { PricingRulesManager } from './features/reglas-precios';
import { CatalogManager } from './features/catalogo';
import { AdminManager } from './features/admins';
import { LogisticsManager } from './features/logistica';
import { InspectionManager } from './features/inspeccion';
import type { User, Quote, AuthResponse } from './types';
import { ApiService } from './services/api';
import { PlatformAdminPage } from './features/admins/components/PlatformAdminPage';

type Tab = 'cotizar' | 'historial' | 'reglas' | 'admins' | 'catalogo' | 'logistica' | 'inspeccion' | 'auth';

function getInitialSlug(): string {
  const params = new URLSearchParams(window.location.search);
  const paramSlug = params.get('slug');
  if (paramSlug) return paramSlug;

  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  if (pathSegments[0] === 'seguimiento') return 'demo';
  if (pathSegments.length > 0) {
    if (pathSegments[0] === 'recicla' && pathSegments[1]) {
      return pathSegments[1];
    }
    const knownTabs = ['cotizar', 'historial', 'reglas', 'admins', 'catalogo', 'logistica', 'inspeccion', 'auth'];
    if (!knownTabs.includes(pathSegments[0])) {
      return pathSegments[0];
    }
  }
  return 'demo';
}

function getInitialTrackingToken(): string | null {
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  const trackingIdx = pathSegments.indexOf('seguimiento');
  return trackingIdx !== -1 ? pathSegments[trackingIdx + 1] ?? null : null;
}

function getInitialQuoteIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  const paramQuoteId = params.get('quoteId') || params.get('quote_id');
  if (paramQuoteId) return paramQuoteId;

  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  const quoteIdx = pathSegments.indexOf('quote');
  if (quoteIdx !== -1 && pathSegments[quoteIdx + 1]) {
    return pathSegments[quoteIdx + 1];
  }
  return null;
}

function TenantApp() {
  const [trackingToken] = useState<string | null>(getInitialTrackingToken);
  const [slug] = useState<string>(getInitialSlug);
  ApiService.setSlug(slug);
  const [tenantId, setTenantId] = useState<string>('');
  const [tenantName, setTenantName] = useState<string>('');
  const [tenantError, setTenantError] = useState<string | null>(null);
  const [tenantLoading, setTenantLoading] = useState(!trackingToken);
  const [token, setToken] = useState<string | null>(localStorage.getItem('reecicla_token'));
  const [user, setUser] = useState<User | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>('cotizar');
  const [latestQuote, setLatestQuote] = useState<Quote | null>(null);

  useEffect(() => {
    if (trackingToken) return;
    if (!window.location.pathname.startsWith('/recicla/')) {
      window.history.replaceState(null, '', `/recicla/${encodeURIComponent(slug)}`);
    }
    ApiService.getTenantBySlug(slug)
      .then((tenant) => {
        setTenantId(tenant.tenant_id);
        setTenantName(tenant.name);
        setTenantError(null);
      })
      .catch((err: Error) => {
        setTenantError(err.message || `No se encontró el negocio con la URL '/${slug}'.`);
      })
      .finally(() => setTenantLoading(false));
  }, [slug, trackingToken]);

  useEffect(() => {
    if (!tenantId || trackingToken) return;
    const urlQuoteId = getInitialQuoteIdFromUrl();
    const storedQuoteId = urlQuoteId || localStorage.getItem(`reecicla_guest_quote_${tenantId}`) || localStorage.getItem('reecicla_guest_quote');

    if (storedQuoteId) {
      ApiService.getQuoteById(storedQuoteId)
        .then((res) => {
          if (res.quote) setLatestQuote(res.quote);
        })
        .catch(() => {
          localStorage.removeItem(`reecicla_guest_quote_${tenantId}`);
          localStorage.removeItem('reecicla_guest_quote');
        });
    }
  }, [tenantId, trackingToken]);

  useEffect(() => {
    if (token && !trackingToken) {
      ApiService.getProfile(token)
        .then((res) => setUser(res.user))
        .catch(() => {
          localStorage.removeItem('reecicla_token');
          setToken(null);
          setUser(null);
        });
    }
  }, [token, trackingToken]);

  const handleAuthSuccess = (authData: AuthResponse) => {
    localStorage.setItem('reecicla_token', authData.token);
    setToken(authData.token);
    setUser(authData.user);
    setActiveTab('cotizar');
  };

  const handleLogout = () => {
    localStorage.removeItem('reecicla_token');
    window.history.replaceState(null, '', `/recicla/${encodeURIComponent(slug)}`);
    setToken(null);
    setUser(null);
    setLatestQuote(null);
    setActiveTab('cotizar');
  };

  const handleQuoteCreated = (quote: Quote) => {
    localStorage.setItem(`reecicla_guest_quote_${quote.tenant_id}`, quote.id);
    localStorage.setItem('reecicla_guest_quote', quote.id);
    setLatestQuote(quote);
  };

  const handleNewQuoteClick = () => {
    if (tenantId) {
      localStorage.removeItem(`reecicla_guest_quote_${tenantId}`);
    }
    localStorage.removeItem('reecicla_guest_quote');
    setLatestQuote(null);
  };

  if (tenantLoading) {
    return <main style={{ margin: 'auto' }}>Cargando negocio...</main>;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!trackingToken && activeTab !== 'auth' && (
        <Navbar
          user={user}
          tenantId={tenantId}
          tenantName={tenantName}
          slug={slug}
          onOpenAuth={() => setActiveTab('auth')}
          onLogout={handleLogout}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}

      {tenantError && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '16px', margin: '20px auto', maxWidth: '600px', borderRadius: '12px', textAlign: 'center' }}>
          <strong>Error de Negocio:</strong> {tenantError}
        </div>
      )}

      <main style={{ flex: 1, maxWidth: '1440px', width: '100%', margin: '0 auto', padding: activeTab === 'auth' ? '0' : '0 32px 64px' }}>
        {trackingToken ? (
          <GuestOrderTracking token={trackingToken} />
        ) : (
          <>
        {activeTab === 'auth' && (<AuthPage onSuccess={handleAuthSuccess} onCancel={() => setActiveTab('cotizar')} />)}

        {activeTab === 'cotizar' && (latestQuote ? <QuoteResultCard quote={latestQuote} token={token} onNewQuote={handleNewQuoteClick} /> : <QuotationWizard token={token} onQuoteCreated={handleQuoteCreated} onNeedAuth={() => setActiveTab('auth')} />)}

        {activeTab === 'historial' && (token ? (<QuoteHistory token={token} />) : (<div className="glass-panel" style={{ padding: '40px', textAlign: 'center', maxWidth: '540px', margin: '32px auto', background: '#ffffff' }}>
          <h3 style={{ fontSize: '20px', color: '#0f172a', marginBottom: '8px', fontWeight: 700 }}>Autenticación Reequerida</h3>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>Iniciá sesión para ver tus cotizaciones guardadas.</p>
          <button onClick={() => setActiveTab('auth')} className="btn-primary">Iniciar Sesión</button>
        </div>))}

        {activeTab === 'reglas' && (user && (user.role === 'TENANT_ADMIN' || user.role === 'CATALOG_ADMIN' || user.role === 'SUPER_ADMIN') ? (<PricingRulesManager token={token} />) : (<div className="glass-panel" style={{ padding: '40px', textAlign: 'center', maxWidth: '540px', margin: '32px auto', background: '#ffffff' }}>
          <h3 style={{ fontSize: '20px', color: '#0f172a', marginBottom: '8px', fontWeight: 700 }}>Acceso Restringido</h3>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
            La gestión de reglas de precios está reservada exclusivamente para administradores.
          </p>
          {!user && (<button onClick={() => setActiveTab('auth')} className="btn-primary">Iniciar Sesión</button>)}
        </div>))}

        {activeTab === 'catalogo' && (user && (user.role === 'TENANT_ADMIN' || user.role === 'CATALOG_ADMIN' || user.role === 'SUPER_ADMIN') ? (<CatalogManager token={token} />) : (<div className="glass-panel" style={{ padding: '40px', textAlign: 'center', maxWidth: '540px', margin: '32px auto', background: '#ffffff' }}>
          <h3 style={{ fontSize: '20px', color: '#0f172a', marginBottom: '8px', fontWeight: 700 }}>Acceso Restringido</h3>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
            La gestión de catálogo de dispositivos está reservada para administradores.
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

        {activeTab === 'inspeccion' && (user && (user.role === 'TENANT_ADMIN' || user.role === 'INSPECTOR') ? (<InspectionManager token={token} canRegister={user.role === 'INSPECTOR'} />) : (<div className="glass-panel" style={{ padding: '40px', textAlign: 'center', maxWidth: '540px', margin: '32px auto', background: '#ffffff' }}>
          <h3 style={{ fontSize: '20px', color: '#0f172a', marginBottom: '8px', fontWeight: 700 }}>Acceso Restringido</h3>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
            La inspección de equipos está reservada para inspectores (<strong>INSPECTOR</strong>) y administradores.
          </p>
          {!user && (<button onClick={() => setActiveTab('auth')} className="btn-primary">Iniciar Sesión</button>)}
        </div>))}
          </>
        )}
      </main>
    </div>
  );
}

export function App() {
  return window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/')
    ? <PlatformAdminPage />
    : <TenantApp />;
}

export default App;
