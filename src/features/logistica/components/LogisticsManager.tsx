import React, { useEffect, useState, useCallback } from 'react';
import { Truck, Box, RefreshCw, AlertCircle, CheckCircle2, Search, X } from 'lucide-react';
import { ApiService } from '../../../services/api';
import type { Order } from '../../../types';

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
    <div style={{ maxWidth: '960px', margin: '0 auto', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── HEADER ── */}
      <div className="glass-panel" style={{ padding: '28px 32px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '14px', color: '#16a34a', border: '1px solid #bbf7d0' }}>
            <Truck size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Gestión de Logística y Envíos (HU-013)</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
              Registra guías de rastreo y actualiza estados de envío para las cajas solicitadas por clientes.
            </p>
          </div>
        </div>

        <button onClick={fetchOrders} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '13px' }}>
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {successMsg && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '14px 18px', borderRadius: '10px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '14px 18px', borderRadius: '10px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: statusFilter === f.code ? '1px solid #2563eb' : '1px solid #cbd5e1',
              background: statusFilter === f.code ? '#eff6ff' : '#ffffff',
              color: statusFilter === f.code ? '#1d4ed8' : '#64748b',
              transition: 'all 0.15s ease',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>Cargando órdenes de logística...</div>
      ) : filteredOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', background: '#f8fafc', borderRadius: '14px', border: '1px dashed #cbd5e1' }}>
          <p style={{ fontSize: '14px', color: '#64748b' }}>No se encontraron órdenes con el filtro seleccionado.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredOrders.map((order) => {
            const st = statusMap[order.status] || { label: order.status, bg: '#f1f5f9', color: '#334155', border: '#cbd5e1' };

            return (
              <div key={order.id} className="glass-card" style={{ padding: '20px 24px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <strong style={{ fontSize: '17px', color: '#0f172a', fontFamily: 'monospace' }}>{order.order_number}</strong>
                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                      {st.label}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Cliente: <strong>{order.customer_name || 'Cliente'}</strong> ({order.customer_email || '—'})
                  </span>
                </div>

                {/* Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr', gap: '16px', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Equipo</p>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                      {order.device_type_name} {order.brand ? `• ${order.brand}` : ''} {order.model ? `(${order.model})` : ''}
                    </p>
                    <p style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                      Monto: <strong style={{ color: '#16a34a' }}>{order.currency === 'BOB' || order.currency === 'Bs' ? 'Bs.' : order.currency} {Number(order.quoted_price).toFixed(2)}</strong>
                    </p>
                  </div>

                  <div>
                    <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Dirección de Recojo</p>
                    {order.pickup_address ? (
                      <p style={{ fontSize: '12px', color: '#1e293b', marginTop: '2px', lineHeight: '1.4' }}>
                        📍 {order.pickup_address.street}, {order.pickup_address.city} ({order.pickup_address.state})
                        {order.pickup_address.notes && <span style={{ display: 'block', color: '#64748b', fontSize: '11px' }}>Notas: {order.pickup_address.notes}</span>}
                      </p>
                    ) : (
                      <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Sin dirección registrada aún</p>
                    )}
                  </div>

                  <div style={{ justifySelf: 'end', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    {order.tracking_code && (
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#6b21a8', background: '#faf5ff', padding: '4px 10px', borderRadius: '6px', border: '1px solid #e9d5ff', fontFamily: 'monospace' }}>
                        📦 Guía: {order.tracking_code}
                      </span>
                    )}

                    {(order.status === 'BOX_REQUESTED' || order.status === 'ACCEPTED' || order.status === 'BOX_SHIPPED') && (
                      <button
                        onClick={() => handleOpenDispatchModal(order)}
                        className="btn-primary"
                        style={{ padding: '8px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
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
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={20} color="#2563eb" /> Registrar Despacho / Guía
              </h3>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              Orden: <strong style={{ color: '#0f172a' }}>{selectedOrder.order_number}</strong> ({selectedOrder.device_type_name})
            </p>

            <form onSubmit={handleDispatchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Número de Guía / Código de Tracking *
                </label>
                <input
                  type="text"
                  required
                  value={trackingCodeInput}
                  onChange={(e) => setTrackingCodeInput(e.target.value)}
                  placeholder="Ej: DHL-882391 / TRACK-00123"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
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
