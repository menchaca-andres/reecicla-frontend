import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { QuotationWizard } from './components/QuotationWizard';
import { QuoteResultCard } from './components/QuoteResultCard';
import { QuoteHistory } from './components/QuoteHistory';
import { PricingRulesManager } from './components/PricingRulesManager';
import { AdminManager } from './components/AdminManager';
import type { User, Quote, AuthResponse } from './types';
import { ApiService } from './services/api';

const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

export function App() {
  const [tenantId] = useState(DEFAULT_TENANT_ID);
  const [token, setToken] = useState<string | null>(localStorage.getItem('reecicla_token'));
  const [user, setUser] = useState<User | null>(null);

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'cotizar' | 'historial' | 'reglas' | 'admins'>('cotizar');
  const [latestQuote, setLatestQuote] = useState<Quote | null>(null);

  // Restore user session on mount
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
      <Navbar
        user={user}
        tenantId={tenantId}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '0 24px 64px' }}>
        {activeTab === 'cotizar' && (
          latestQuote ? (
            <QuoteResultCard quote={latestQuote} onNewQuote={() => setLatestQuote(null)} />
          ) : (
            <QuotationWizard
              tenantId={tenantId}
              token={token}
              onQuoteCreated={handleQuoteCreated}
              onNeedAuth={() => setIsAuthOpen(true)}
            />
          )
        )}

        {activeTab === 'historial' && (
          token ? (
            <QuoteHistory tenantId={tenantId} token={token} />
          ) : (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', maxWidth: '540px', margin: '0 auto' }}>
              <h3 style={{ fontSize: '20px', color: '#ffffff', marginBottom: '8px' }}>Autenticación Requerida</h3>
              <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '20px' }}>Iniciá sesión para ver tus cotizaciones guardadas.</p>
              <button onClick={() => setIsAuthOpen(true)} className="btn-primary">
                Iniciar Sesión
              </button>
            </div>
          )
        )}

        {activeTab === 'reglas' && (
          user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') ? (
            <PricingRulesManager tenantId={tenantId} token={token} />
          ) : (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', maxWidth: '540px', margin: '0 auto', background: '#ffffff' }}>
              <h3 style={{ fontSize: '20px', color: '#0f172a', marginBottom: '8px', fontWeight: 700 }}>Acceso Restringido</h3>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
                La gestión de reglas de precios está reservada exclusivamente para administradores con rol <strong>ADMIN</strong> o <strong>SUPER_ADMIN</strong>.
              </p>
              {!user && (
                <button onClick={() => setIsAuthOpen(true)} className="btn-primary">
                  Iniciar Sesión
                </button>
              )}
            </div>
          )
        )}

        {activeTab === 'admins' && (
          user?.role === 'SUPER_ADMIN' ? (
            <AdminManager token={token} />
          ) : (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', maxWidth: '540px', margin: '0 auto' }}>
              <h3 style={{ fontSize: '20px', color: '#ffffff', marginBottom: '8px' }}>Acceso Restringido</h3>
              <p style={{ fontSize: '14px', color: '#9ca3af' }}>Solo el Super Administrador puede gestionar administradores de tenant.</p>
            </div>
          )
        )}
      </main>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
        defaultTenantId={tenantId}
      />
    </div>
  );
}

export default App;
