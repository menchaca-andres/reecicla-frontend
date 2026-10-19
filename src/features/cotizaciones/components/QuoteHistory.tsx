import React, { useEffect, useState } from 'react';
import type { Quote, Order, CreateBoxRequestInput, PaymentRecord } from '../../../types';
import { ApiService } from '../../../services/api';
import styles from '../QuoteHistory.module.css';

interface QuoteHistoryProps {
  token: string;
}

export const QuoteHistory: React.FC<QuoteHistoryProps> = ({ token }) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentsByOrder, setPaymentsByOrder] = useState<Record<string, PaymentRecord[]>>({});
  const [loading, setLoading] = useState(true);
  const [acceptingQuoteId, setAcceptingQuoteId] = useState<string | null>(null);
  const [resolvingOrderId, setResolvingOrderId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [downloadingPaymentId, setDownloadingPaymentId] = useState<string | null>(null);

  const [selectedOrderIdForBox, setSelectedOrderIdForBox] = useState<string | null>(null);
  const [boxAddress, setBoxAddress] = useState<CreateBoxRequestInput>({
    street: '',
    city: '',
    state: '',
    zip_code: '',
    notes: '',
  });
  const [submittingBoxRequest, setSubmittingBoxRequest] = useState(false);

  const openBoxRequest = (order: Order) => {
    const address = order.pickup_address;
    setBoxAddress({
      street: address?.street || address?.address || '',
      city: address?.city || '',
      state: address?.state || '',
      zip_code: address?.zip_code || '',
      notes: address?.notes || '',
    });
    setSelectedOrderIdForBox(order.id);
  };

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiService.getUserQuotes(token);
      setQuotes(res.quotes);
      const orderRes = await ApiService.getUserOrders(token);
      setOrders(orderRes.orders);
      setPaymentError(null);
      const payableOrders = orderRes.orders.filter(
        (order) => order.status === 'PAYMENT_PENDING' || order.status === 'PAID'
      );
      try {
        const paymentResponses = await Promise.all(
          payableOrders.map((order) => ApiService.getOrderPayments(order.id, token))
        );
        setPaymentsByOrder(Object.fromEntries(
          payableOrders.map((order, index) => [order.id, paymentResponses[index].payments])
        ));
      } catch (paymentFetchError) {
        setPaymentsByOrder({});
        setPaymentError(
          paymentFetchError instanceof Error
            ? paymentFetchError.message
            : 'No se pudieron consultar los comprobantes de pago.'
        );
      }
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
      setQuotes((current) =>
        current.map((quote) =>
          quote.id === quoteId ? { ...quote, status: 'ACCEPTED' } : quote
        )
      );
      setNotice('Cotización aceptada. La orden aparecerá cuando termine el procesamiento.');
      setTimeout(() => fetchHistory(), 1500);
    } catch (err: any) {
      setError(err.message || 'Error al aceptar la cotización');
    } finally {
      setAcceptingQuoteId(null);
    }
  };

  const handleAdjustedQuoteResponse = async (quoteId: string, decision: 'ACCEPT' | 'REJECT') => {
    const prompt = decision === 'ACCEPT'
      ? '¿Aceptas el precio ajustado?'
      : '¿Rechazas el precio ajustado? Después podrás elegir devolución o reciclaje.';
    if (!window.confirm(prompt)) return;
    setAcceptingQuoteId(quoteId);
    setNotice(null);
    setError(null);
    try {
      const result = await ApiService.respondToAdjustedQuote(quoteId, decision, token);
      setNotice(result.message);
      await fetchHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo responder la cotización ajustada.');
    } finally {
      setAcceptingQuoteId(null);
    }
  };

  const handleResolveAdjustment = async (orderId: string, resolution: 'RETURN' | 'RECYCLE') => {
    const prompt = resolution === 'RETURN'
      ? '¿Solicitas la devolución del equipo? El costo de devolución queda a tu cargo.'
      : '¿Confirmas el reciclaje del equipo sin pago?';
    if (!window.confirm(prompt)) return;
    setResolvingOrderId(orderId);
    setNotice(null);
    setError(null);
    try {
      const result = await ApiService.resolveUserAdjustment(orderId, resolution, token);
      setNotice(result.message);
      await fetchHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo elegir el destino del equipo.');
    } finally {
      setResolvingOrderId(null);
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

  const handleDownloadReceipt = async (
    orderId: string,
    payment: PaymentRecord,
    external = false
  ) => {
    setDownloadingPaymentId(payment.id);
    setError(null);
    try {
      const blob = external
        ? await ApiService.downloadExternalPaymentReceipt(orderId, payment.id, token)
        : await ApiService.downloadPaymentReceipt(orderId, payment.id, token);
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const extension = blob.type === 'application/pdf' ? 'pdf' : blob.type === 'image/png' ? 'png' : 'jpg';
      link.href = downloadUrl;
      link.download = `${external ? 'evidencia-bancaria' : 'comprobante-reecicla'}-${payment.id}.${extension}`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'No se pudo descargar el comprobante.');
    } finally {
      setDownloadingPaymentId(null);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [token]);

  const statusMap: Record<string, { label: string; cls: string }> = {
    ACCEPTED: { label: 'Cotización Aceptada', cls: styles.statusGreen },
    BOX_REQUESTED: { label: 'Caja Solicitada', cls: styles.statusBlue },
    BOX_SHIPPED: { label: 'Caja Enviada', cls: styles.statusPurple },
    IN_TRANSIT: { label: 'En Tránsito', cls: styles.statusOrange },
    RECEIVED: { label: 'Recibido en Almacén', cls: styles.statusTeal },
    INSPECTING: { label: 'En Evaluación', cls: styles.statusYellow },
    INSPECTED: { label: 'Inspección completada', cls: styles.statusBlue },
    ADJUSTMENT_PENDING: { label: 'Ajuste de cotización pendiente', cls: styles.statusYellow },
    ADJUSTMENT_REJECTED: { label: 'Ajuste rechazado', cls: styles.statusOrange },
    PAYMENT_PENDING: { label: 'Pago pendiente', cls: styles.statusYellow },
    DISPOSED: { label: 'Equipo procesado', cls: styles.statusGray },
    PAID: { label: 'Pagado', cls: styles.statusGreen },
    CLOSED: { label: 'Completado', cls: styles.statusGray },
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <h1 className={styles.pageTitle}>Mis Órdenes</h1>
        <button onClick={fetchHistory} className={styles.refreshBtn}>
          Actualizar
        </button>
      </div>

      {loading ? (
        <p className={styles.loadingText}>Cargando historial…</p>
      ) : error ? (
        <p className={styles.alertError}>{error}</p>
      ) : (
        <>
          {notice && <p role="status" className={styles.noticeText}>{notice}</p>}
          {paymentError && <p role="alert" className={styles.alertError}>{paymentError}</p>}

          {/* ── Cotizaciones ── */}
          <h2 className={styles.sectionHeading}>Cotizaciones</h2>

          {quotes.length === 0 ? (
            <p className={styles.emptyText}>Aún no registrás cotizaciones en la plataforma.</p>
          ) : (
            <div className={styles.list}>
              {quotes.map((q) => (
                <div key={q.id} className={styles.row}>
                  <div className={styles.rowMain}>
                    <span className={styles.rowTitle}>
                      {q.quote_type === 'ADJUSTED' ? 'Cotización ajustada · ' : ''}
                      {q.device_type}{q.brand ? ` · ${q.brand}` : ''}
                    </span>
                    <span className={styles.rowMeta}>
                      Condición: <strong>{q.condition}</strong>
                      {q.adjustment_reason && <> · {q.adjustment_reason}</>}
                      {q.adjustment_audit?.outcome === 'UNCHANGED' && (
                        <> · Inspección sin cambio de precio: {q.adjustment_audit.justification}</>
                      )}
                      &nbsp;·&nbsp;
                      {new Date(q.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className={styles.rowRight}>
                    <span className={`${styles.badge} ${q.status === 'PENDING' ? styles.statusYellow :
                      q.status === 'ACCEPTED' ? styles.statusGreen : styles.statusGray
                      }`}>
                      {q.quote_type === 'ADJUSTED' && q.status === 'PENDING' ? 'Ajuste pendiente' : q.status}
                    </span>
                    <p className={styles.price}>
                      <span className={styles.priceCurrency}>Bs.</span>
                      {Number(q.final_price).toFixed(2)}
                    </p>
                    {q.status === 'PENDING' && q.quote_type !== 'ADJUSTED' && (
                      <button type="button" onClick={() => handleAcceptQuote(q.id)} disabled={acceptingQuoteId !== null} className={styles.actionBtn}>
                        {acceptingQuoteId === q.id ? 'Aceptando…' : 'Aceptar'}
                      </button>
                    )}
                    {q.status === 'PENDING' && q.quote_type === 'ADJUSTED' && (
                      <div className={styles.adjustmentActions}>
                        <button
                          type="button"
                          onClick={() => handleAdjustedQuoteResponse(q.id, 'ACCEPT')}
                          disabled={acceptingQuoteId !== null}
                          className={styles.actionBtn}
                        >
                          {acceptingQuoteId === q.id ? 'Procesando…' : 'Aceptar ajuste'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustedQuoteResponse(q.id, 'REJECT')}
                          disabled={acceptingQuoteId !== null}
                          className={styles.secondaryActionBtn}
                        >
                          Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Órdenes ── */}
          {orders.length > 0 && (
            <section className={styles.ordersSection}>
              <h2 className={styles.sectionHeading}>
                Órdenes ({orders.length})
              </h2>
              <div className={styles.list}>
                {orders.map((order) => {
                  const info = statusMap[order.status] ?? { label: order.status, cls: styles.statusGray };

                  return (
                    <div key={order.id} className={styles.orderCard}>
                      <div className={styles.orderTop}>
                        <div className={styles.orderTopLeft}>
                          <span className={styles.orderNumber}>{order.order_number}</span>
                          <span className={`${styles.badge} ${info.cls}`}>{info.label}</span>
                        </div>
                        <span className={styles.orderDate}>
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className={styles.orderBody}>
                        <div>
                          <p className={styles.fieldLabel}>Dispositivo</p>
                          <p className={styles.fieldValue}>
                            {order.device_type_name || 'Dispositivo'}
                            {order.brand ? ` · ${order.brand}` : ''}
                            {order.model ? ` (${order.model})` : ''}
                            {order.device_year ? ` '${order.device_year}` : ''}
                          </p>
                          {order.declared_condition && (
                            <p className={styles.fieldMeta}>Condición: <strong>{order.declared_condition}</strong></p>
                          )}
                        </div>
                        {order.status === 'ADJUSTMENT_REJECTED' && !order.adjustment_resolution && (
                          <div className={styles.adjustmentActions}>
                            <span className={styles.rowMeta}>Elige el destino; sin respuesta en 7 días se reciclará sin pago.</span>
                            <button
                              type="button"
                              onClick={() => handleResolveAdjustment(order.id, 'RETURN')}
                              disabled={resolvingOrderId !== null}
                              className={styles.secondaryActionBtn}
                            >
                              Solicitar devolución
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResolveAdjustment(order.id, 'RECYCLE')}
                              disabled={resolvingOrderId !== null}
                              className={styles.actionBtn}
                            >
                              Reciclar sin pago
                            </button>
                          </div>
                        )}
                        {order.disposition_status === 'COMPLETED' && order.disposition_type && (
                          <p className={styles.rowMeta}>
                            Destino final: {order.disposition_type === 'RESALE' ? 'reventa' : order.disposition_type === 'RECYCLE' ? 'reciclaje' : 'devolución'}
                            {order.disposition_reference ? ` (ref.: ${order.disposition_reference})` : ''}.
                          </p>
                        )}
                        {order.adjustment_resolution && (
                          <p className={styles.rowMeta}>
                            Destino elegido: {order.adjustment_resolution === 'RETURN' ? 'devolución a cargo del cliente' : 'reciclaje sin pago'}.
                          </p>
                        )}

                        {(paymentsByOrder[order.id] ?? []).map((payment) => (
                          <div key={payment.id}>
                            <p className={styles.fieldLabel}>
                              {payment.status === 'FAILED' ? 'Intento de pago fallido' : 'Desembolso registrado'}
                            </p>
                            <p className={styles.fieldMeta}>
                              {payment.status} ·{' '}
                              {payment.method === 'CHECK' ? 'Cheque' : 'Transferencia'} ·{' '}
                              {payment.currency} {payment.amount.toFixed(2)}
                              {payment.reference ? ` · Ref. ${payment.reference}` : ''}
                              {payment.paid_at ? ` · ${new Date(payment.paid_at).toLocaleDateString()}` : ''}
                            </p>
                            {payment.failure_reason && (
                              <p className={styles.fieldMeta}>Motivo: {payment.failure_reason}</p>
                            )}
                            {payment.receipt_available && (
                              <button
                                type="button"
                                onClick={() => void handleDownloadReceipt(order.id, payment)}
                                disabled={downloadingPaymentId !== null}
                                className={styles.secondaryActionBtn}
                              >
                                {downloadingPaymentId === payment.id ? 'Descargando…' : 'Descargar comprobante Reecicla'}
                              </button>
                            )}
                            {payment.external_receipt_available && (
                              <button
                                type="button"
                                onClick={() => void handleDownloadReceipt(order.id, payment, true)}
                                disabled={downloadingPaymentId !== null}
                                className={styles.secondaryActionBtn}
                              >
                                {downloadingPaymentId === payment.id ? 'Descargando…' : 'Descargar evidencia bancaria'}
                              </button>
                            )}
                          </div>
                        ))}

                        <div>
                          <p className={styles.fieldLabel}>Monto Aceptado</p>
                          <p className={styles.orderPrice}>Bs. {Number(order.final_price ?? order.quoted_price ?? 0).toFixed(2)}</p>
                          {(order.pickup_address?.street || order.pickup_address?.address || order.pickup_address?.city) && (
                            <p className={styles.fieldMeta}>
                              Dirección: {order.pickup_address.street || order.pickup_address.address}
                              {order.pickup_address.city ? `, ${order.pickup_address.city}` : ''}
                            </p>
                          )}
                          {order.tracking_code && (
                            <p className={styles.trackingBadge}>Guía: <code>{order.tracking_code}</code></p>
                          )}
                        </div>

                        <div className={styles.orderActions}>
                          {(order.status === 'ACCEPTED' || order.status === 'BOX_REQUESTED') && (
                            <button onClick={() => openBoxRequest(order)} className={styles.actionBtn}> {order.status === 'BOX_REQUESTED' ? 'Ver / Editar Dirección' : 'Solicitar Caja'}</button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}

      {/* ── Modal: dirección de caja ── */}
      {selectedOrderIdForBox && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Dirección de Recojo para Caja</h3>
              <button onClick={() => setSelectedOrderIdForBox(null)} className={styles.closeBtn} aria-label="Cerrar">✕</button>
            </div>

            <form onSubmit={handleRequestBox} className={styles.modalForm}>
              <p className={styles.rowMeta}>
                Precargamos la dirección que registraste al cotizar. Puedes completarla o editarla antes de solicitar la caja.
              </p>
              <div>
                <label className={styles.label}>Calle y Número / Dirección *</label>
                <input type="text" required value={boxAddress.street} onChange={(e) => setBoxAddress({ ...boxAddress, street: e.target.value })} placeholder="Ej: Av. 6 de Agosto #1234" className={styles.input} />
              </div>

              <div className={styles.grid2}>
                <div>
                  <label className={styles.label}>Ciudad *</label>
                  <input type="text" required value={boxAddress.city} onChange={(e) => setBoxAddress({ ...boxAddress, city: e.target.value })} placeholder="Ej: La Paz" className={styles.input} />
                </div>
                <div>
                  <label className={styles.label}>Departamento / Estado *</label>
                  <input type="text" value={boxAddress.state} onChange={(e) => setBoxAddress({ ...boxAddress, state: e.target.value })} placeholder="Ej: La Paz" className={styles.input} />
                </div>
              </div>

              <div>
                <label className={styles.label}>Código Postal (Opcional)</label>
                <input type="text" value={boxAddress.zip_code} onChange={(e) => setBoxAddress({ ...boxAddress, zip_code: e.target.value })} placeholder="Ej: 0000" className={styles.input} />
              </div>

              <div>
                <label className={styles.label}>Notas / Referencias (Opcional)</label>
                <textarea value={boxAddress.notes || ''} onChange={(e) => setBoxAddress({ ...boxAddress, notes: e.target.value })} placeholder="Ej: Frente al parque central, timbre blanco" rows={3} className={styles.textarea} />
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setSelectedOrderIdForBox(null)} className={styles.cancelBtn}>Cancelar
                </button>
                <button type="submit" disabled={submittingBoxRequest} className={styles.actionBtn}>
                  {submittingBoxRequest ? 'Enviando…' : 'Confirmar Solicitud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
