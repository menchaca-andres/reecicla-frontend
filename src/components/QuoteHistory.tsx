import React, { useEffect, useState } from 'react';
import { History, RefreshCw, Cpu, Calendar, Check, PackageCheck } from 'lucide-react';
import type { Quote } from '../types';
import { ApiService } from '../services/api';

interface QuoteHistoryProps {
  tenantId: string;
  token: string;
}

export const QuoteHistory: React.FC<QuoteHistoryProps> = ({ tenantId, token }) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [orders, setOrders] = useState<Array<{ id: string; quote_id: string; order_number: string; status: string; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingQuoteId, setAcceptingQuoteId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiService.getUserQuotes(tenantId, token);
      setQuotes(res.quotes);
      const orderRes = await ApiService.getUserOrders(token);
      setOrders(orderRes.orders);
    } catch (err: any) {
      setError(err.message || 'Error al obtener el historial');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptQuote = async (quoteId: string) => {
    setAcceptingQuoteId(quoteId);
    setNotice(null);
    setError(null);
    try {
      await ApiService.acceptQuote(quoteId, token);
      setQuotes((current) => current.map((quote) =>
        quote.id === quoteId ? { ...quote, status: 'ACCEPTED' } : quote
      ));
      setNotice('Cotización aceptada. La orden aparecerá cuando termine el procesamiento.');
    } catch (err: any) {
      setError(err.message || 'Error al aceptar la cotización');
    } finally {
      setAcceptingQuoteId(null);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [tenantId, token]);

  return (
    <div className="glass-panel" style={{ padding: '32px', maxWidth: '840px', margin: '0 auto', background: '#ffffff' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '12px', color: '#2563eb', border: '1px solid #bfdbfe' }}>
            <History size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Mis Cotizaciones Guardadas</h2>
            <p style={{ fontSize: '13px', color: '#64748b' }}>Historial de solicitudes asociadas a tu usuario</p>
          </div>
        </div>

        <button onClick={fetchHistory} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '13px' }}>
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Cargando historial...</div>
      ) : error ? (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '16px', borderRadius: '10px' }}>
          {error}
        </div>
      ) : quotes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: '14px', border: '1px dashed #cbd5e1' }}>
          <p style={{ fontSize: '14px', color: '#64748b' }}>Aún no registras cotizaciones en la plataforma.</p>
        </div>
      ) : (
        <>
          {notice && <p role="status" style={{ color: '#166534', fontSize: '13px', marginBottom: '14px' }}>{notice}</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {quotes.map((q) => (
              <div key={q.id} className="glass-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: '#f0fdf4', padding: '10px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                  <Cpu size={22} color="#16a34a" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', textTransform: 'capitalize' }}>
                      {q.device_type} {q.brand ? `• ${q.brand}` : ''}
                    </h4>
                    <span className="badge badge-pending">{q.status}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span>Condición: <strong style={{ color: '#334155' }}>{q.condition}</strong></span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} /> {new Date(q.created_at).toLocaleDateString()}
                    </span>
                  </p>
                </div>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Precio Ofrecido</p>
                <p style={{ fontSize: '20px', fontWeight: 800, color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                  <span style={{ fontSize: '14px' }}>Bs.</span>{Number(q.final_price).toFixed(2)}
                </p>
                {q.status === 'PENDING' && (
                  <button
                    type="button"
                    onClick={() => handleAcceptQuote(q.id)}
                    disabled={acceptingQuoteId !== null}
                    className="btn-primary"
                    style={{ marginTop: '8px', padding: '7px 10px', fontSize: '12px' }}
                  >
                    <Check size={14} /> {acceptingQuoteId === q.id ? 'Aceptando...' : 'Aceptar'}
                  </button>
                )}
              </div>
            </div>
            ))}
          </div>
          {orders.length > 0 && (
            <section style={{ marginTop: '28px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', color: '#0f172a', marginBottom: '12px' }}>
                <PackageCheck size={18} /> Mis órdenes
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {orders.map((order) => (
                  <div key={order.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px 16px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '8px' }}>
                    <strong style={{ color: '#0f172a' }}>{order.order_number}</strong>
                    <span style={{ color: '#475569', fontSize: '13px' }}>{order.status}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};
