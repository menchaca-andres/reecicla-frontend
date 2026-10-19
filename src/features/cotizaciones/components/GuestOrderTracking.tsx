import React, { useCallback, useEffect, useState } from 'react';
import { ApiService } from '../../../services/api';
import type { GuestOrderTracking as GuestOrderTrackingData, Quote } from '../../../types';
import styles from './GuestOrderTracking.module.css';

interface GuestOrderTrackingProps {
  token: string;
}

const STATUS_LABELS: Record<string, string> = {
  ACCEPTED: 'Pedido aceptado',
  BOX_REQUESTED: 'Caja solicitada',
  BOX_SHIPPED: 'Caja enviada',
  IN_TRANSIT: 'Equipo en tránsito',
  RECEIVED: 'Equipo recibido',
  INSPECTING: 'En inspección',
  INSPECTED: 'Inspección completada',
  ADJUSTMENT_PENDING: 'Ajuste de cotización pendiente',
  ADJUSTMENT_REJECTED: 'Ajuste rechazado',
  RETURN_REQUESTED: 'Devolución solicitada',
  PAYMENT_PENDING: 'Pago pendiente',
  PAID: 'Pago realizado',
  DISPOSED: 'Equipo procesado',
  CLOSED: 'Pedido cerrado',
  CANCELLED: 'Pedido cancelado',
};

const DISPOSITION_LABELS: Record<string, string> = {
  RESALE: 'reventa',
  RECYCLE: 'reciclaje',
  RETURN: 'devolución',
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

export const GuestOrderTracking: React.FC<GuestOrderTrackingProps> = ({ token }) => {
  const [order, setOrder] = useState<GuestOrderTrackingData | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [decisionNotice, setDecisionNotice] = useState<string | null>(null);
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setQuoteError(null);
    try {
      const result = await ApiService.getGuestOrderTracking(token);
      setOrder(result.order);
      try {
        const quoteResult = await ApiService.getQuoteById(result.order.quote_id);
        setQuote(quoteResult.quote);
      } catch (quoteRequestError) {
        setQuote(null);
        setQuoteError(
          quoteRequestError instanceof Error
            ? quoteRequestError.message
            : 'No se pudo consultar la cotización del pedido.'
        );
      }
    } catch (requestError) {
      setOrder(null);
      setQuote(null);
      setError(requestError instanceof Error ? requestError.message : 'No se pudo consultar el seguimiento.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const respondToAdjustedQuote = async (decision: 'ACCEPT' | 'REJECT') => {
    if (!quote?.adjusted_quote || !window.confirm(
      decision === 'ACCEPT'
        ? '¿Aceptas el precio ajustado?'
        : '¿Rechazas el precio ajustado? Después podrás elegir devolución o reciclaje.'
    )) return;
    setSubmittingDecision(true);
    setDecisionError(null);
    setDecisionNotice(null);
    try {
      const result = await ApiService.respondToAdjustedQuote(
        quote.adjusted_quote.id,
        decision,
        null,
        token
      );
      setDecisionNotice(result.message);
      await refresh();
    } catch (requestError) {
      setDecisionError(requestError instanceof Error ? requestError.message : 'No se pudo responder el ajuste.');
    } finally {
      setSubmittingDecision(false);
    }
  };

  const resolveRejectedAdjustment = async (resolution: 'RETURN' | 'RECYCLE') => {
    const prompt = resolution === 'RETURN'
      ? '¿Solicitas la devolución del equipo? El costo de devolución queda a tu cargo.'
      : '¿Confirmas el reciclaje del equipo sin pago?';
    if (!window.confirm(prompt)) return;
    setSubmittingDecision(true);
    setDecisionError(null);
    setDecisionNotice(null);
    try {
      const result = await ApiService.resolveGuestAdjustment(token, resolution);
      setDecisionNotice(result.message);
      await refresh();
    } catch (requestError) {
      setDecisionError(requestError instanceof Error ? requestError.message : 'No se pudo elegir el destino.');
    } finally {
      setSubmittingDecision(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>Seguimiento de pedido</p>
        <h1 className={styles.title}>{order ? `Pedido ${order.order_number}` : 'Consulta tu pedido'}</h1>

        {loading && <p className={styles.message}>Cargando el estado más reciente…</p>}
        {decisionNotice && <p role="status" className={styles.message}>{decisionNotice}</p>}
        {decisionError && <p role="alert" className={styles.error}>{decisionError}</p>}
        {error && (
          <div className={styles.error}>
            <p>{error}</p>
            {error.includes('venció') && <p>Solicita un nuevo enlace al negocio para consultar el pedido.</p>}
            <button type="button" className={styles.secondaryButton} onClick={() => void refresh()}>
              Volver a intentar
            </button>
          </div>
        )}

        {order && !error && (
          <>
            <div className={styles.summary}>
              <div>
                <span className={styles.label}>Equipo</span>
                <strong>
                  {order.device_type_name}
                  {order.brand ? ` · ${order.brand}` : ''}
                  {order.model ? ` · ${order.model}` : ''}
                </strong>
              </div>
              <div>
                <span className={styles.label}>Precio final</span>
                <strong>{order.currency} {Number(order.final_price ?? order.quoted_price).toFixed(2)}</strong>
              </div>
              <div>
                <span className={styles.label}>Estado actual</span>
                <strong className={styles.currentStatus}>{STATUS_LABELS[order.status] || order.status}</strong>
              </div>
              {order.tracking_code && (
                <div>
                  <span className={styles.label}>Código de envío</span>
                  <strong>{order.tracking_code}</strong>
                </div>
              )}
            </div>

            {quoteError && <p role="status" className={styles.message}>{quoteError}</p>}
            {quote?.adjusted_quote && (
              <section className={styles.adjustedQuote} aria-labelledby="adjusted-quote-title">
                <span className={styles.label}>Cotización ajustada</span>
                <h2 id="adjusted-quote-title" className={styles.historyTitle}>
                  Nueva condición: {quote.adjusted_quote.condition}
                </h2>
                <p>{quote.adjusted_quote.adjustment_reason}</p>
                <strong>
                  {quote.adjusted_quote.currency || order.currency}{' '}
                  {Number(quote.adjusted_quote.final_price).toFixed(2)}
                </strong>
                {quote.adjusted_quote.status === 'PENDING' ? (
                  <>
                    <p className={styles.message}>Responde al precio ajustado para continuar con el pedido.</p>
                    <div className={styles.adjustmentActions}>
                      <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={() => void respondToAdjustedQuote('ACCEPT')}
                        disabled={submittingDecision}
                      >
                        Aceptar precio
                      </button>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => void respondToAdjustedQuote('REJECT')}
                        disabled={submittingDecision}
                      >
                        Rechazar
                      </button>
                    </div>
                  </>
                ) : (
                  <p className={styles.message}>
                    Estado de la cotización: {quote.adjusted_quote.status === 'ACCEPTED' ? 'aceptada' :
                      quote.adjusted_quote.status === 'REJECTED' ? 'rechazada' : quote.adjusted_quote.status}.
                  </p>
                )}
              </section>
            )}
            {order.status === 'ADJUSTMENT_REJECTED' && !order.adjustment_resolution && (
              <section className={styles.adjustedQuote} aria-labelledby="adjustment-resolution-title">
                <h2 id="adjustment-resolution-title" className={styles.historyTitle}>Elige qué hacer con tu equipo</h2>
                <p>Solicita la devolución a tu cargo o elige reciclarlo sin pago. Si no respondes en 7 días, se reciclará sin pago.</p>
                <div className={styles.adjustmentActions}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => void resolveRejectedAdjustment('RETURN')}
                    disabled={submittingDecision}
                  >
                    Solicitar devolución
                  </button>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() => void resolveRejectedAdjustment('RECYCLE')}
                    disabled={submittingDecision}
                  >
                    Reciclar sin pago
                  </button>
                </div>
              </section>
            )}
            {order.adjustment_resolution && (
              <p className={styles.message}>
                Destino registrado: {order.adjustment_resolution === 'RETURN' ? 'devolución a cargo del cliente' : 'reciclaje sin pago'}.
              </p>
            )}
            {order.disposition_status === 'COMPLETED' && order.disposition_type && (
              <p className={styles.message} role="status">
                Destino final del equipo: {DISPOSITION_LABELS[order.disposition_type] ?? order.disposition_type}
                {order.disposition_reference ? ` (ref.: ${order.disposition_reference})` : ''}.
              </p>
            )}
            {quote?.adjustment_audit?.outcome === 'UNCHANGED' && (
              <section className={styles.adjustedQuote} aria-live="polite">
                <span className={styles.label}>Inspección completada</span>
                <p>{quote.adjustment_audit.justification}</p>
                <strong>
                  Cotización confirmada: {quote.currency || order.currency}{' '}
                  {Number(quote.final_price).toFixed(2)}
                </strong>
              </section>
            )}

            <h2 className={styles.historyTitle}>Historial</h2>
            {order.status_history.length ? (
              <ol className={styles.timeline}>
                {order.status_history.map((entry, index) => (
                  <li key={`${entry.new_status}-${entry.created_at}-${index}`} className={styles.timelineItem}>
                    <span className={styles.timelineDot} />
                    <div>
                      <strong>{STATUS_LABELS[entry.new_status] || entry.new_status}</strong>
                      <time>{formatDate(entry.created_at)}</time>
                      {entry.reason && <p>{entry.reason}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className={styles.message}>Aún no hay actualizaciones del pedido.</p>
            )}

            <h2 className={styles.historyTitle}>Avisos enviados</h2>
            {order.notifications.length ? (
              <ul className={styles.notifications}>
                {order.notifications.map((notification, index) => (
                  <li key={`${notification.notification_type}-${notification.sent_at}-${index}`}>
                    <strong>
                      {notification.notification_type === 'ORDER_TRACKING_LINK'
                        ? 'Enlace de seguimiento enviado'
                        : notification.notification_type}
                    </strong>
                    <time>{notification.channel} · {formatDate(notification.sent_at)}</time>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.message}>Todavía no se han enviado avisos.</p>
            )}

            <button type="button" className={styles.secondaryButton} onClick={() => void refresh()} disabled={loading}>
              Actualizar estado
            </button>
            <p className={styles.privacy}>Este enlace es privado. No lo compartas; vence a los 90 días.</p>
          </>
        )}
      </section>
    </main>
  );
};
