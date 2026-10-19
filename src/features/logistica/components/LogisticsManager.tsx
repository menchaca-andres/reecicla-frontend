import React, { useEffect, useState, useCallback } from 'react';
import { ApiService } from '../../../services/api';
import type { DispositionType, Order, PaymentRecord } from '../../../types';
import styles from '../LogisticsManager.module.css';

interface LogisticsManagerProps {
  token: string | null;
}

export const LogisticsManager: React.FC<LogisticsManagerProps> = ({ token }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentsByOrder, setPaymentsByOrder] = useState<Record<string, PaymentRecord[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedPaymentOrder, setSelectedPaymentOrder] = useState<Order | null>(null);
  const [trackingCodeInput, setTrackingCodeInput] = useState<string>('');
  const [shipmentStatus, setShipmentStatus] = useState<'BOX_SHIPPED' | 'IN_TRANSIT'>('BOX_SHIPPED');
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'CHECK'>('BANK_TRANSFER');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null);
  const [paymentIdempotencyKey, setPaymentIdempotencyKey] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentLoadError, setPaymentLoadError] = useState<string | null>(null);
  const [selectedDispositionOrder, setSelectedDispositionOrder] = useState<Order | null>(null);
  const [dispositionType, setDispositionType] = useState<DispositionType>('RECYCLE');
  const [dispositionReference, setDispositionReference] = useState('');
  const [submittingDisposition, setSubmittingDisposition] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await ApiService.getAllOrders(token);
      setOrders(res.orders);
      try {
        const paymentRes = await ApiService.getTenantPayments(token);
        setPaymentsByOrder(paymentRes.payments.reduce((result, payment) => {
          result[payment.order_id] = [...(result[payment.order_id] ?? []), payment];
          return result;
        }, {} as Record<string, PaymentRecord[]>));
        setPaymentLoadError(null);
      } catch (paymentError) {
        setPaymentsByOrder({});
        setPaymentLoadError(paymentError instanceof Error
          ? paymentError.message
          : 'No se pudo consultar el historial de pagos.');
      }
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

  const handleReceiveOrder = async (order: Order) => {
    if (!token || !window.confirm(`¿Confirmas la recepción del equipo de la orden ${order.order_number}?`)) return;
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const result = await ApiService.receiveOrder(order.id, token);
      setSuccessMsg(result.message);
      await fetchOrders();
    } catch (err: any) {
      setError(err.message || 'Error al registrar la recepción del equipo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenPaymentModal = (order: Order) => {
    setSelectedPaymentOrder(order);
    setPaymentMethod('BANK_TRANSFER');
    setPaymentReference('');
    setPaymentReceipt(null);
    setPaymentIdempotencyKey(crypto.randomUUID());
    setError(null);
  };

  const handlePaymentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedPaymentOrder || !token || !paymentIdempotencyKey) return;
    setSubmittingPayment(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const result = await ApiService.registerPayment(
        selectedPaymentOrder.id,
        {
          method: paymentMethod,
          reference: paymentReference.trim(),
          receipt: paymentReceipt ?? undefined,
        },
        paymentIdempotencyKey,
        token
      );
      if (result.payment.status === 'FAILED') {
        setError(
          `El intento de pago quedó registrado como fallido: ${result.payment.failure_reason || 'el proveedor rechazó la operación'}. Puedes iniciar un nuevo intento.`
        );
        setSelectedPaymentOrder(null);
        await fetchOrders();
        return;
      }
      setSuccessMsg(
        `Pago registrado para la orden ${selectedPaymentOrder.order_number}. El comprobante Reecicla estará disponible en el historial del cliente.`
      );
      setSelectedPaymentOrder(null);
      setPaymentReceipt(null);
      await fetchOrders();
    } catch (err: any) {
      setError(err.message || 'Error al registrar el pago.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const canRegisterDisposition = (order: Order) =>
    order.status === 'PAID' ||
    (order.status === 'ADJUSTMENT_REJECTED' && order.disposition_status === 'PENDING');

  const handleOpenDispositionModal = (order: Order) => {
    setSelectedDispositionOrder(order);
    setDispositionType(order.disposition_type ?? 'RECYCLE');
    setDispositionReference('');
    setError(null);
  };

  const handleDispositionSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedDispositionOrder || !token) return;
    setSubmittingDisposition(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const result = await ApiService.registerDisposition(
        selectedDispositionOrder.id,
        { type: dispositionType, reference: dispositionReference.trim() },
        token
      );
      setSuccessMsg(`${result.message} (Orden ${selectedDispositionOrder.order_number})`);
      setSelectedDispositionOrder(null);
      setDispositionReference('');
      await fetchOrders();
    } catch (err: any) {
      setError(err.message || 'Error al registrar el destino final.');
    } finally {
      setSubmittingDisposition(false);
    }
  };

  const dispositionLabels: Record<DispositionType, string> = {
    RESALE: 'Reventa',
    RECYCLE: 'Reciclaje',
    RETURN: 'Devolución',
  };

  const dispositionReferenceLabel: Record<DispositionType, string> = {
    RESALE: 'Referencia de publicación de venta *',
    RECYCLE: 'Certificado de destrucción *',
    RETURN: 'Guía o comprobante de devolución *',
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'ALL') return true;
    return o.status === statusFilter;
  });

  const statusMap: Record<string, string> = {
    ACCEPTED: 'Cotización aceptada',
    BOX_REQUESTED: 'Caja solicitada',
    BOX_SHIPPED: 'Caja enviada',
    IN_TRANSIT: 'En tránsito',
    RECEIVED: 'Recibido en almacén',
    INSPECTING: 'En evaluación',
    INSPECTED: 'Inspeccionado',
    PAYMENT_PENDING: 'Pago pendiente',
    ADJUSTMENT_PENDING: 'Ajuste pendiente de respuesta',
    ADJUSTMENT_REJECTED: 'Ajuste rechazado',
    PAID: 'Pagado',
    DISPOSED: 'Destino registrado',
    CLOSED: 'Completado',
  };

  return (
    <div className={styles.container}>

      <div className={`glass-panel ${styles.headerCard}`}>
        <div className={styles.headerLeft}>
          <div>
            <h2 className={styles.title}>Logística</h2>
            <p className={styles.subtitle}>Gestiona envíos, guías y recepción de equipos.</p>
          </div>
        </div>

        <button onClick={fetchOrders} className={`btn-secondary ${styles.refreshBtn}`}>
          {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {successMsg && (
        <div className={styles.alertSuccess}>
          {successMsg}
        </div>
      )}
      {error && (
        <div className={styles.alertError}>
          {error}
        </div>
      )}
      {paymentLoadError && (
        <div className={styles.alertError}>{paymentLoadError}</div>
      )}

      <div className={styles.filterRow}>
        <span className={styles.filterLabel}>Filtrar por estado</span>
        {[
          { code: 'ALL', label: 'Todas las Órdenes' },
          { code: 'BOX_REQUESTED', label: 'Cajas Solicitadas (Pendientes Guía)' },
          { code: 'BOX_SHIPPED', label: 'Cajas Enviadas' },
          { code: 'IN_TRANSIT', label: 'En Tránsito' },
          { code: 'RECEIVED', label: 'Recibidos' },
          { code: 'PAYMENT_PENDING', label: 'Pagos pendientes' },
          { code: 'PAID', label: 'Pagados (pendiente destino)' },
          { code: 'ADJUSTMENT_REJECTED', label: 'Ajuste rechazado' },
          { code: 'CLOSED', label: 'Cerradas' },
        ].map((f) => (
          <button key={f.code} onClick={() => setStatusFilter(f.code)} className={statusFilter === f.code ? styles.filterChipActive : styles.filterChip}>
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
            const statusLabel = statusMap[order.status] || order.status;

            return (
              <div key={order.id} className={`glass-card ${styles.orderCard}`}>
                <div className={styles.orderCardHeader}>
                  <div className={styles.orderNumberGroup}>
                    <strong className={styles.orderNumber}>{order.order_number}</strong>
                    <span className={styles.statusBadge}>{statusLabel}</span>
                  </div>
                  <span className={styles.customerText}>
                    Cliente: <strong>{order.customer_name || 'Cliente'}</strong> ({order.customer_email || '—'})
                    {order.customer_phone && ` · ${order.customer_phone}`}
                  </span>
                </div>

                <div className={styles.detailsGrid}>
                  <div>
                    <p className={styles.fieldCategory}>Equipo</p>
                    <p className={styles.deviceTitle}>
                      {order.device_type_name} {order.brand ? `· ${order.brand}` : ''} {order.model ? `(${order.model})` : ''}
                    </p>
                    <p className={styles.priceText}>Monto: <strong>{order.currency === 'BOB' || order.currency === 'Bs' ? 'Bs.' : order.currency} {Number(order.final_price ?? order.quoted_price).toFixed(2)}</strong></p>
                  </div>

                  <div>
                    <p className={styles.fieldCategory}>Dirección de Recojo</p>
                    {order.pickup_address ? (
                      <p className={styles.addressText}>
                        {order.pickup_address.address ||
                          [order.pickup_address.street, order.pickup_address.city, order.pickup_address.state].filter(Boolean).join(', ')}
                        {order.pickup_address.notes && <span className={styles.addressNotes}>Notas: {order.pickup_address.notes}</span>}
                      </p>
                    ) : (
                      <p className={styles.noAddress}>Sin dirección registrada aún</p>
                    )}
                  </div>

                  <div className={styles.actionsColumn}>
                    {order.tracking_code && <span className={styles.trackingBadge}>Guía: {order.tracking_code}</span>}

                    {(order.status === 'BOX_REQUESTED' || order.status === 'ACCEPTED' || order.status === 'BOX_SHIPPED') && (
                      <button onClick={() => handleOpenDispatchModal(order)} className={`btn-primary ${styles.dispatchBtn}`}>
                        {order.tracking_code ? 'Editar guía' : 'Registrar guía'}
                      </button>
                    )}
                    {order.status === 'IN_TRANSIT' && (
                      <button
                        type="button"
                        onClick={() => void handleReceiveOrder(order)}
                        disabled={submitting}
                        className={`btn-primary ${styles.dispatchBtn}`}
                      >
                        Registrar recepción
                      </button>
                    )}
                    {order.status === 'PAYMENT_PENDING' && (
                      <button
                        type="button"
                        onClick={() => handleOpenPaymentModal(order)}
                        disabled={submittingPayment}
                        className={`btn-primary ${styles.dispatchBtn}`}
                      >
                        {paymentsByOrder[order.id]?.some((payment) => payment.status === 'FAILED')
                          ? 'Reintentar pago'
                          : 'Registrar pago'}
                      </button>
                    )}
                    {canRegisterDisposition(order) && (
                      <button
                        type="button"
                        onClick={() => handleOpenDispositionModal(order)}
                        disabled={submittingDisposition}
                        className={`btn-primary ${styles.dispatchBtn}`}
                      >
                        Registrar destino
                      </button>
                    )}
                    {order.status === 'ADJUSTMENT_REJECTED' && order.disposition_status !== 'PENDING' && (
                      <span className={styles.statusBadge}>Esperando destino elegido por el cliente</span>
                    )}
                    {order.disposition_type && order.disposition_status === 'COMPLETED' && (
                      <div>
                        <span className={styles.statusBadge}>Destino: {dispositionLabels[order.disposition_type]}</span>
                        {order.disposition_reference && (
                          <p className={styles.addressNotes}>Ref.: {order.disposition_reference}</p>
                        )}
                      </div>
                    )}
                    {(paymentsByOrder[order.id] ?? []).map((payment, index) => (
                      <div key={payment.id}>
                        <span className={styles.statusBadge}>
                          Intento {(paymentsByOrder[order.id]?.length ?? 0) - index}: {payment.status === 'FAILED'
                            ? 'Fallido'
                            : payment.status === 'COMPLETED'
                              ? 'Completado'
                              : payment.status === 'PENDING'
                                ? 'En proceso'
                                : payment.status}
                        </span>
                        {payment.failure_reason && (
                          <p className={styles.addressNotes}>{payment.failure_reason}</p>
                        )}
                      </div>
                    ))}
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
                Registrar despacho
              </h3>
              <button onClick={() => setSelectedOrder(null)} className={styles.modalCloseBtn} aria-label="Cerrar">
                Cerrar
              </button>
            </div>

            <p className={styles.modalSubText}>
              Orden: <strong style={{ color: '#0f172a' }}>{selectedOrder.order_number}</strong> ({selectedOrder.device_type_name})
            </p>

            <form onSubmit={handleDispatchSubmit} className={styles.modalForm}>
              <div>
                <label className={styles.label}>Número de Guía / Código de Tracking *</label>
                <input type="text" required value={trackingCodeInput} onChange={(e) => setTrackingCodeInput(e.target.value)} placeholder="Ej: DHL-882391 / TRACK-00123" className={styles.inputMonospace} />
              </div>

              <div>
                <label className={styles.label}>Nuevo Estado de la Orden *</label>
                <select className="input-field" value={shipmentStatus} onChange={(e) => setShipmentStatus(e.target.value as any)}>
                  <option value="BOX_SHIPPED">Caja Enviada (BOX_SHIPPED)</option>
                  <option value="IN_TRANSIT">En Tránsito (IN_TRANSIT)</option>
                </select>
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setSelectedOrder(null)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>Cancelar
                </button>
                <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                  {submitting ? 'Guardando...' : 'Confirmar Envío y Guía'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedPaymentOrder && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Registrar desembolso</h3>
              <button
                type="button"
                onClick={() => setSelectedPaymentOrder(null)}
                className={styles.modalCloseBtn}
                aria-label="Cerrar"
              >
                Cerrar
              </button>
            </div>
            <p className={styles.modalSubText}>
              Orden: <strong>{selectedPaymentOrder.order_number}</strong>. Monto aceptado:{' '}
              <strong>
                {selectedPaymentOrder.currency === 'BOB' || selectedPaymentOrder.currency === 'Bs.'
                  ? 'Bs.'
                  : selectedPaymentOrder.currency}{' '}
                {Number(selectedPaymentOrder.final_price ?? selectedPaymentOrder.quoted_price).toFixed(2)}
              </strong>
            </p>
            <form onSubmit={handlePaymentSubmit} className={styles.modalForm}>
              <div>
                <label className={styles.label} htmlFor="payment-method">Método de pago *</label>
                <select
                  id="payment-method"
                  className="input-field"
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value as 'BANK_TRANSFER' | 'CHECK')}
                >
                  <option value="BANK_TRANSFER">Transferencia bancaria</option>
                  <option value="CHECK">Cheque</option>
                </select>
              </div>
              <div>
                <label className={styles.label} htmlFor="payment-reference">
                  {paymentMethod === 'CHECK' ? 'Número de cheque *' : 'Referencia de transferencia (opcional)'}
                </label>
                <input
                  id="payment-reference"
                  type="text"
                  required={paymentMethod === 'CHECK'}
                  maxLength={150}
                  value={paymentReference}
                  onChange={(event) => setPaymentReference(event.target.value)}
                  className={styles.inputMonospace}
                />
              </div>
              <div>
                <label className={styles.label} htmlFor="payment-receipt">
                  Evidencia bancaria adicional (opcional, PDF/JPG/PNG, máx. 5 MB)
                </label>
                <input
                  id="payment-receipt"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  onChange={(event) => setPaymentReceipt(event.target.files?.[0] ?? null)}
                  className={styles.inputMonospace}
                />
                <p className={styles.modalSubText}>
                  Reecicla generará automáticamente el comprobante oficial de registro del pago.
                </p>
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setSelectedPaymentOrder(null)}
                  className="btn-secondary"
                  disabled={submittingPayment}
                >
                  Cancelar
                </button>
                <button type="submit" disabled={submittingPayment} className="btn-primary">
                  {submittingPayment ? 'Registrando…' : 'Confirmar pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedDispositionOrder && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Registrar destino final</h3>
              <button
                type="button"
                onClick={() => setSelectedDispositionOrder(null)}
                className={styles.modalCloseBtn}
                aria-label="Cerrar"
              >
                Cerrar
              </button>
            </div>
            <p className={styles.modalSubText}>
              Orden: <strong>{selectedDispositionOrder.order_number}</strong> ({selectedDispositionOrder.device_type_name}).
              Al confirmar, la orden se cierra.
            </p>
            <form onSubmit={handleDispositionSubmit} className={styles.modalForm}>
              <div>
                <label className={styles.label} htmlFor="disposition-type">Destino *</label>
                <select
                  id="disposition-type"
                  className="input-field"
                  value={dispositionType}
                  disabled={Boolean(selectedDispositionOrder.disposition_type)}
                  onChange={(event) => setDispositionType(event.target.value as DispositionType)}
                >
                  {selectedDispositionOrder.disposition_type ? (
                    <option value={selectedDispositionOrder.disposition_type}>
                      {dispositionLabels[selectedDispositionOrder.disposition_type]} (elegido por el cliente)
                    </option>
                  ) : (
                    <>
                      <option value="RESALE">Reventa</option>
                      <option value="RECYCLE">Reciclaje</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className={styles.label} htmlFor="disposition-reference">
                  {dispositionReferenceLabel[dispositionType]}
                </label>
                <input
                  id="disposition-reference"
                  type="text"
                  required
                  maxLength={255}
                  value={dispositionReference}
                  onChange={(event) => setDispositionReference(event.target.value)}
                  placeholder={dispositionType === 'RESALE' ? 'Ej: PUB-2026-001' : dispositionType === 'RECYCLE' ? 'Ej: CERT-DEST-0042' : 'Ej: DEV-00123'}
                  className={styles.inputMonospace}
                />
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setSelectedDispositionOrder(null)}
                  className="btn-secondary"
                  disabled={submittingDisposition}
                >
                  Cancelar
                </button>
                <button type="submit" disabled={submittingDisposition || !dispositionReference.trim()} className="btn-primary">
                  {submittingDisposition ? 'Registrando…' : 'Confirmar y cerrar orden'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
