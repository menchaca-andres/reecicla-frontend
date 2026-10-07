import React, { useEffect, useState, useCallback } from 'react';
import { Truck, Box, RefreshCw, AlertCircle, CheckCircle2, Search, X } from 'lucide-react';
import { ApiService } from '../../../services/api';
import type { Order } from '../../../types';
import styles from '../LogisticsManager.module.css';

interface LogisticsManagerProps {
  token: string | null;
}

export const LogisticsManager: React.FC<LogisticsManagerProps> = ({ token }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingCodeInput, setTrackingCodeInput] = useState<string>('');
  const [shipmentStatus, setShipmentStatus] = useState<'BOX_SHIPPED' | 'IN_TRANSIT'>('BOX_SHIPPED');
  const [submitting, setSubmitting] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await ApiService.getAllOrders(token);
      setOrders(res.orders);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las órdenes para logística');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleOpenDispatchModal = (order: Order) => {
    setSelectedOrder(order);
    setTrackingCodeInput(order.tracking_code || `TRACK-${Math.floor(100000 + Math.random() * 900000)}`);
    setShipmentStatus('BOX_SHIPPED');
    setError(null);
  };

  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !token) return;
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await ApiService.dispatchOrder(
        selectedOrder.id,
        trackingCodeInput.trim(),
        token,
        shipmentStatus
      );
      setSuccessMsg(`¡Guía "${trackingCodeInput.trim()}" registrada exitosamente para la orden ${selectedOrder.order_number}!`);
      setSelectedOrder(null);
      await fetchOrders();
    } catch (err: any) {
      setError(err.message || 'Error al despachar el pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'ALL') return true;
    return o.status === statusFilter;
  });

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

  return (
    <div className={styles.container}>

      {/* ── HEADER ── */}
      <div className={`glass-panel ${styles.headerCard}`}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <Truck size={24} />
          </div>
          <div>
            <h2 className={styles.title}>Gestión de Logística y Envíos (HU-013)</h2>
            <p className={styles.subtitle}>
              Registra guías de rastreo y actualiza estados de envío para las cajas solicitadas por clientes.
            </p>
          </div>
        </div>

        <button onClick={fetchOrders} className={`btn-secondary ${styles.refreshBtn}`}>
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {successMsg && (
        <div className={styles.alertSuccess}>
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}
      {error && (
        <div className={styles.alertError}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <div className={styles.filterRow}>
        <span className={styles.filterLabel}>
          <Search size={14} /> Filtrar Estado:
        </span>
        {[
          { code: 'ALL', label: 'Todas las Órdenes' },
          { code: 'BOX_REQUESTED', label: 'Cajas Solicitadas (Pendientes Guía)' },
          { code: 'BOX_SHIPPED', label: 'Cajas Enviadas' },
          { code: 'IN_TRANSIT', label: 'En Tránsito' },
        ].map((f) => (
          <button
            key={f.code}
            onClick={() => setStatusFilter(f.code)}
            className={statusFilter === f.code ? styles.filterChipActive : styles.filterChip}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.loadingText}>Cargando órdenes de logística...</div>
      ) : filteredOrders.length === 0 ? (
        <div className={styles.emptyBox}>
          <p className={styles.emptyText}>No se encontraron órdenes con el filtro seleccionado.</p>
        </div>
      ) : (
        <div className={styles.orderList}>
          {filteredOrders.map((order) => {
            const st = statusMap[order.status] || { label: order.status, bg: '#f1f5f9', color: '#334155', border: '#cbd5e1' };

            return (
              <div key={order.id} className={`glass-card ${styles.orderCard}`}>

                {/* Header */}
                <div className={styles.orderCardHeader}>
                  <div className={styles.orderNumberGroup}>
                    <strong className={styles.orderNumber}>{order.order_number}</strong>
                    <span className={styles.statusBadge} style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                      {st.label}
                    </span>
                  </div>
                  <span className={styles.customerText}>
                    Cliente: <strong>{order.customer_name || 'Cliente'}</strong> ({order.customer_email || '—'})
                  </span>
                </div>

                {/* Details Grid */}
                <div className={styles.detailsGrid}>
                  <div>
                    <p className={styles.fieldCategory}>Equipo</p>
                    <p className={styles.deviceTitle}>
                      {order.device_type_name} {order.brand ? `• ${order.brand}` : ''} {order.model ? `(${order.model})` : ''}
                    </p>
                    <p className={styles.priceText}>
                      Monto: <strong style={{ color: '#16a34a' }}>{order.currency === 'BOB' || order.currency === 'Bs' ? 'Bs.' : order.currency} {Number(order.quoted_price).toFixed(2)}</strong>
                    </p>
                  </div>

                  <div>
                    <p className={styles.fieldCategory}>Dirección de Recojo</p>
                    {order.pickup_address ? (
                      <p className={styles.addressText}>
                        📍 {order.pickup_address.street}, {order.pickup_address.city} ({order.pickup_address.state})
                        {order.pickup_address.notes && <span className={styles.addressNotes}>Notas: {order.pickup_address.notes}</span>}
                      </p>
                    ) : (
                      <p className={styles.noAddress}>Sin dirección registrada aún</p>
                    )}
                  </div>

                  <div className={styles.actionsColumn}>
                    {order.tracking_code && (
                      <span className={styles.trackingBadge}>
                        📦 Guía: {order.tracking_code}
                      </span>
                    )}

                    {(order.status === 'BOX_REQUESTED' || order.status === 'ACCEPTED' || order.status === 'BOX_SHIPPED') && (
                      <button
                        onClick={() => handleOpenDispatchModal(order)}
                        className={`btn-primary ${styles.dispatchBtn}`}
                      >
                        <Box size={14} /> {order.tracking_code ? 'Editar Guía / Tracking' : 'Registrar Guía de Envío'}
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {selectedOrder && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <Truck size={20} color="#2563eb" /> Registrar Despacho / Guía
              </h3>
              <button onClick={() => setSelectedOrder(null)} className={styles.modalCloseBtn}>
                <X size={20} />
              </button>
            </div>

            <p className={styles.modalSubText}>
              Orden: <strong style={{ color: '#0f172a' }}>{selectedOrder.order_number}</strong> ({selectedOrder.device_type_name})
            </p>

            <form onSubmit={handleDispatchSubmit} className={styles.modalForm}>
              <div>
                <label className={styles.label}>
                  Número de Guía / Código de Tracking *
                </label>
                <input
                  type="text"
                  required
                  value={trackingCodeInput}
                  onChange={(e) => setTrackingCodeInput(e.target.value)}
                  placeholder="Ej: DHL-882391 / TRACK-00123"
                  className={styles.inputMonospace}
                />
              </div>

              <div>
                <label className={styles.label}>
                  Nuevo Estado de la Orden *
                </label>
                <select
                  className="input-field"
                  value={shipmentStatus}
                  onChange={(e) => setShipmentStatus(e.target.value as any)}
                >
                  <option value="BOX_SHIPPED">Caja Enviada (BOX_SHIPPED)</option>
                  <option value="IN_TRANSIT">En Tránsito (IN_TRANSIT)</option>
                </select>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  {submitting ? 'Guardando...' : 'Confirmar Envío y Guía'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
