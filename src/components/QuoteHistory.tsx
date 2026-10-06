import React, { useEffect, useState } from 'react';
import { History, RefreshCw, Cpu, Calendar, Check, PackageCheck, Box, X } from 'lucide-react';
import type { Quote, Order, CreateBoxRequestInput } from '../types';
import { ApiService } from '../services/api';

interface QuoteHistoryProps {
  tenantId: string;
  token: string;
}

export const QuoteHistory: React.FC<QuoteHistoryProps> = ({ tenantId, token }) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingQuoteId, setAcceptingQuoteId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedOrderIdForBox, setSelectedOrderIdForBox] = useState<string | null>(null);
  const [boxAddress, setBoxAddress] = useState<CreateBoxRequestInput>({
    street: '',
    city: '',
    state: '',
    zip_code: '',
    notes: '',
  });
  const [submittingBoxRequest, setSubmittingBoxRequest] = useState(false);

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
      setTimeout(() => fetchHistory(), 1500);
    } catch (err: any) {
      setError(err.message || 'Error al aceptar la cotización');
    } finally {
      setAcceptingQuoteId(null);
    }
  };

  const handleRequestBox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderIdForBox) return;
    setSubmittingBoxRequest(true);
    setError(null);
    setNotice(null);

    try {
      await ApiService.requestBox(selectedOrderIdForBox, boxAddress, token);
      setNotice('¡Solicitud de caja de envío registrada exitosamente!');
      setSelectedOrderIdForBox(null);
      setBoxAddress({ street: '', city: '', state: '', zip_code: '', notes: '' });
      await fetchHistory();
    } catch (err: any) {
      setError(err.message || 'Error al solicitar la caja');
    } finally {
      setSubmittingBoxRequest(false);
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
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '16px', borderRadius: '10px', marginBottom: '16px' }}>
          {error}
        </div>
      ) : (
        <>
          {notice && <p role="status" style={{ color: '#166534', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '14px' }}>{notice}</p>}

          {quotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: '14px', border: '1px dashed #cbd5e1', marginBottom: '20px' }}>
              <p style={{ fontSize: '14px', color: '#64748b' }}>Aún no registras cotizaciones en la plataforma.</p>
            </div>
          ) : (
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
          )}

          {orders.length > 0 && (
            <section style={{ marginTop: '28px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
                <PackageCheck size={18} color="#2563eb" /> Mis Órdenes ({orders.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {orders.map((order) => {
                  const statusMap: Record<string, { label: string; bg: string; color: string; border: string }> = {
                    ACCEPTED: { label: 'Cotización Aceptada', bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
                    BOX_REQUESTED: { label: 'Caja Solicitada', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
                    BOX_SHIPPED: { label: 'Caja Enviada', bg: '#faf5ff', color: '#6b21a8', border: '#e9d5ff' },
                    IN_TRANSIT: { label: 'En Tránsito', bg: '#fff7ed', color: '#c2410c', border: '#ffedd5' },
                    RECEIVED: { label: 'Recibido en Almacén', bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
                    INSPECTING: { label: 'En Evaluación', bg: '#fefce8', color: '#a16207', border: '#fef08a' },
                    PAID: { label: 'Pagado', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
                    CLOSED: { label: 'Completado', bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
                  };
                  const statusInfo = statusMap[order.status] || { label: order.status, bg: '#f1f5f9', color: '#334155', border: '#cbd5e1' };

                  return (
                    <div key={order.id} style={{ border: '1px solid #e2e8f0', background: '#ffffff', borderRadius: '12px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                      {/* Top Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <strong style={{ color: '#0f172a', fontSize: '16px', fontFamily: 'monospace', letterSpacing: '0.5px' }}>{order.order_number}</strong>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: statusInfo.bg,
                            color: statusInfo.color,
                            border: `1px solid ${statusInfo.border}`
                          }}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} /> {new Date(order.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Content details */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dispositivo</p>
                          <p style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>
                            {order.device_type_name || 'Dispositivo'} {order.brand ? `• ${order.brand}` : ''} {order.model ? `(${order.model})` : ''} {order.device_year ? `'${order.device_year}` : ''}
                          </p>
                          {order.declared_condition && (
                            <p style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                              Condición: <strong style={{ color: '#0f172a' }}>{order.declared_condition}</strong>
                            </p>
                          )}
                        </div>

                        <div>
                          <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Monto Aceptado</p>
                          <p style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a', marginTop: '2px' }}>
                            {order.currency === 'BOB' || order.currency === 'Bs' ? 'Bs.' : order.currency} {Number(order.quoted_price || 0).toFixed(2)}
                          </p>
                          {order.pickup_address && (
                            <p style={{ fontSize: '11px', color: '#2563eb', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {order.pickup_address.street}, {order.pickup_address.city}
                            </p>
                          )}
                          {order.tracking_code && (
                            <p style={{ fontSize: '12px', fontWeight: 700, color: '#6b21a8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', background: '#faf5ff', padding: '3px 8px', borderRadius: '6px', border: '1px solid #e9d5ff', width: 'fit-content' }}>
                              Guía: <span style={{ fontFamily: 'monospace' }}>{order.tracking_code}</span>
                            </p>
                          )}
                        </div>

                        <div style={{ justifySelf: 'end' }}>
                          {(order.status === 'ACCEPTED' || order.status === 'BOX_REQUESTED') && (
                            <button
                              onClick={() => setSelectedOrderIdForBox(order.id)}
                              className="btn-primary"
                              style={{ padding: '8px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                              <Box size={14} /> {order.status === 'BOX_REQUESTED' ? 'Ver / Editar Dirección' : 'Solicitar Caja'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {selectedOrderIdForBox && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px'
            }}>
              <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '28px',
                maxWidth: '480px',
                width: '100%',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Box size={20} color="#2563eb" /> Dirección de Recojo para Caja
                  </h3>
                  <button
                    onClick={() => setSelectedOrderIdForBox(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleRequestBox} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Calle y Número / Dirección *
                    </label>
                    <input
                      type="text"
                      required
                      value={boxAddress.street}
                      onChange={(e) => setBoxAddress({ ...boxAddress, street: e.target.value })}
                      placeholder="Ej: Av. 6 de Agosto #1234"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                        Ciudad *
                      </label>
                      <input
                        type="text"
                        required
                        value={boxAddress.city}
                        onChange={(e) => setBoxAddress({ ...boxAddress, city: e.target.value })}
                        placeholder="Ej: La Paz"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                        Departamento / Estado *
                      </label>
                      <input
                        type="text"
                        required
                        value={boxAddress.state}
                        onChange={(e) => setBoxAddress({ ...boxAddress, state: e.target.value })}
                        placeholder="Ej: La Paz"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Código Postal *
                    </label>
                    <input
                      type="text"
                      required
                      value={boxAddress.zip_code}
                      onChange={(e) => setBoxAddress({ ...boxAddress, zip_code: e.target.value })}
                      placeholder="Ej: 0000"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Notas / Referencias de entrega (Opcional)
                    </label>
                    <textarea
                      value={boxAddress.notes || ''}
                      onChange={(e) => setBoxAddress({ ...boxAddress, notes: e.target.value })}
                      placeholder="Ej: Frente al parque central, timbre blanco"
                      rows={3}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedOrderIdForBox(null)}
                      className="btn-secondary"
                      style={{ padding: '8px 16px' }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submittingBoxRequest}
                      className="btn-primary"
                      style={{ padding: '8px 20px' }}
                    >
                      {submittingBoxRequest ? 'Enviando...' : 'Confirmar Solicitud'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
