import React, { useCallback, useEffect, useState } from 'react';
import { ApiService } from '../../../services/api';
import type { GuestOrderTracking as GuestOrderTrackingData } from '../../../types';
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
  PAYMENT_PENDING: 'Pago pendiente',
  PAID: 'Pago realizado',
  DISPOSED: 'Equipo procesado',
  CLOSED: 'Pedido cerrado',
  CANCELLED: 'Pedido cancelado',
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

export const GuestOrderTracking: React.FC<GuestOrderTrackingProps> = ({ token }) => {
  const [order, setOrder] = useState<GuestOrderTrackingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await ApiService.getGuestOrderTracking(token);
      setOrder(result.order);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo consultar el seguimiento.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>Seguimiento de pedido</p>
        <h1 className={styles.title}>{order ? `Pedido ${order.order_number}` : 'Consulta tu pedido'}</h1>

        {loading && <p className={styles.message}>Cargando el estado más reciente…</p>}
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
                <span className={styles.label}>Cotización aceptada</span>
                <strong>{order.currency} {Number(order.quoted_price).toFixed(2)}</strong>
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
