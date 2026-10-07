import React, { useEffect, useState } from 'react';
import { History, RefreshCw, Cpu, Calendar, Check, PackageCheck, Box, X } from 'lucide-react';
import type { Quote, Order, CreateBoxRequestInput } from '../../../types';
import { ApiService } from '../../../services/api';
import styles from '../QuoteHistory.module.css';

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
    <div className={`glass-panel animate-fade-in ${styles.card}`}>
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <History size={22} />
          </div>
          <div>
            <h2 className={styles.title}>Mis Cotizaciones Guardadas</h2>
            <p className={styles.subtitle}>Historial de solicitudes asociadas a tu usuario</p>
          </div>
        </div>

        <button onClick={fetchHistory} className={`btn-secondary ${styles.refreshBtn}`}>
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingText}>Cargando historial...</div>
      ) : error ? (
        <div className={styles.alertError}>
          {error}
        </div>
      ) : (
        <>
          {notice && <p role="status" className={styles.noticeText}>{notice}</p>}

          {quotes.length === 0 ? (
            <div className={styles.emptyBox}>
              <p className={styles.emptyText}>Aún no registras cotizaciones en la plataforma.</p>
            </div>
          ) : (
            <div className={styles.quoteList}>
              {quotes.map((q) => (
                <div key={q.id} className={`glass-card ${styles.quoteCard}`}>
                  <div className={styles.quoteLeft}>
                    <div className={styles.quoteIcon}>
                      <Cpu size={22} color="#16a34a" />
                    </div>
                    <div>
                      <div className={styles.quoteTitleRow}>
                        <h4 className={styles.quoteTitle}>
                          {q.device_type} {q.brand ? `• ${q.brand}` : ''}
                        </h4>
                        <span className="badge badge-pending">{q.status}</span>
                      </div>
                      <p className={styles.quoteMeta}>
                        <span>Condición: <strong style={{ color: '#334155' }}>{q.condition}</strong></span>
                        <span className={styles.dateFlex}>
                          <Calendar size={12} /> {new Date(q.created_at).toLocaleDateString()}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className={styles.quoteRight}>
                    <p className={styles.priceLabel}>Precio Ofrecido</p>
                    <p className={styles.priceValue}>
                      <span className={styles.priceCurrency}>Bs.</span>{Number(q.final_price).toFixed(2)}
                    </p>
                    {q.status === 'PENDING' && (
                      <button
                        type="button"
                        onClick={() => handleAcceptQuote(q.id)}
                        disabled={acceptingQuoteId !== null}
                        className={`btn-primary ${styles.acceptBtn}`}
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
            <section className={styles.ordersSection}>
              <h3 className={styles.sectionTitle}>
                <PackageCheck size={18} color="#2563eb" /> Mis Órdenes ({orders.length})
              </h3>
              <div className={styles.orderList}>
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
                    <div key={order.id} className={styles.orderCard}>
                      {/* Top Header */}
                      <div className={styles.orderHeader}>
                        <div className={styles.orderHeaderLeft}>
                          <strong className={styles.orderNumber}>{order.order_number}</strong>
                          <span className={styles.statusBadge} style={{
                            backgroundColor: statusInfo.bg,
                            color: statusInfo.color,
                            border: `1px solid ${statusInfo.border}`
                          }}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <span className={styles.orderDate}>
                          <Calendar size={12} /> {new Date(order.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Content details */}
                      <div className={styles.orderDetailsGrid}>
                        <div>
                          <p className={styles.fieldCategory}>Dispositivo</p>
                          <p className={styles.deviceTitle}>
                            {order.device_type_name || 'Dispositivo'} {order.brand ? `• ${order.brand}` : ''} {order.model ? `(${order.model})` : ''} {order.device_year ? `'${order.device_year}` : ''}
                          </p>
                          {order.declared_condition && (
                            <p className={styles.conditionText}>
                              Condición: <strong style={{ color: '#0f172a' }}>{order.declared_condition}</strong>
                            </p>
                          )}
                        </div>

                        <div>
                          <p className={styles.fieldCategory}>Monto Aceptado</p>
                          <p className={styles.priceText}>
                            {order.currency === 'BOB' || order.currency === 'Bs' ? 'Bs.' : order.currency} {Number(order.quoted_price || 0).toFixed(2)}
                          </p>
                          {order.pickup_address && (
                            <p className={styles.addressShort}>
                              {order.pickup_address.street}, {order.pickup_address.city}
                            </p>
                          )}
                          {order.tracking_code && (
                            <p className={styles.trackingBadge}>
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
            <div className={styles.modalOverlay}>
              <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                  <h3 className={styles.modalTitle}>
                    <Box size={20} color="#2563eb" /> Dirección de Recojo para Caja
                  </h3>
                  <button
                    onClick={() => setSelectedOrderIdForBox(null)}
                    className={styles.closeBtn}
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleRequestBox} className={styles.modalForm}>
                  <div>
                    <label className={styles.label}>
                      Calle y Número / Dirección *
                    </label>
                    <input
                      type="text"
                      required
                      value={boxAddress.street}
                      onChange={(e) => setBoxAddress({ ...boxAddress, street: e.target.value })}
                      placeholder="Ej: Av. 6 de Agosto #1234"
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.grid2}>
                    <div>
                      <label className={styles.label}>
                        Ciudad *
                      </label>
                      <input
                        type="text"
                        required
                        value={boxAddress.city}
                        onChange={(e) => setBoxAddress({ ...boxAddress, city: e.target.value })}
                        placeholder="Ej: La Paz"
                        className={styles.input}
                      />
                    </div>

                    <div>
                      <label className={styles.label}>
                        Departamento / Estado *
                      </label>
                      <input
                        type="text"
                        required
                        value={boxAddress.state}
                        onChange={(e) => setBoxAddress({ ...boxAddress, state: e.target.value })}
                        placeholder="Ej: La Paz"
                        className={styles.input}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={styles.label}>
                      Código Postal *
                    </label>
                    <input
                      type="text"
                      required
                      value={boxAddress.zip_code}
                      onChange={(e) => setBoxAddress({ ...boxAddress, zip_code: e.target.value })}
                      placeholder="Ej: 0000"
                      className={styles.input}
                    />
                  </div>

                  <div>
                    <label className={styles.label}>
                      Notas / Referencias de entrega (Opcional)
                    </label>
                    <textarea
                      value={boxAddress.notes || ''}
                      onChange={(e) => setBoxAddress({ ...boxAddress, notes: e.target.value })}
                      placeholder="Ej: Frente al parque central, timbre blanco"
                      rows={3}
                      className={styles.textarea}
                    />
                  </div>

                  <div className={styles.modalActions}>
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
