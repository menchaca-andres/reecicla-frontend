import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  Recycle,
  AlertCircle,
  Clock,
  UserCheck,
  FileText
} from 'lucide-react';
import { ApiService } from '../../../services/api';
import type { Order, Inspection, InspectionItem, Disposition, DestinationType } from '../../../types';
import styles from './DeviceDestinationModal.module.css';

interface DeviceDestinationModalProps {
  order: Order;
  token: string | null;
  currentUser?: { id?: string; email?: string; name?: string; role?: string } | null;
  onClose: () => void;
  onSuccess: (updatedOrder: Order) => void;
}

export const DeviceDestinationModal: React.FC<DeviceDestinationModalProps> = ({
  order,
  token,
  currentUser,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Diagnostic / Inspection data (CA01)
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [existingDisposition, setExistingDisposition] = useState<Disposition | null>(null);

  // Destination selection (CA02)
  const [destination, setDestination] = useState<DestinationType | ''>(
    (order.disposition_type as DestinationType) || ''
  );

  // Mandatory justification (CA03)
  const [reason, setReason] = useState<string>(order.disposition_reason || '');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch technical data and diagnostic tests on load (CA01)
  useEffect(() => {
    let isMounted = true;
    async function loadInspectionData() {
      if (!token) return;
      setLoading(true);
      setFetchError(null);
      try {
        const res = await ApiService.getOrderInspection(order.id, token);
        if (isMounted) {
          setInspection(res.inspection);
          setItems(res.items || []);
          if (res.disposition) {
            setExistingDisposition(res.disposition);
            if (!destination) {
              setDestination(res.disposition.type);
            }
            if (!reason && res.disposition.reason) {
              setReason(res.disposition.reason);
            }
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setFetchError(err.message || 'No se pudo cargar la información técnica y diagnóstico del equipo.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadInspectionData();
    return () => {
      isMounted = false;
    };
  }, [order.id, token]);

  const handleDestinationSelect = (selected: DestinationType) => {
    setDestination(selected);
    if (validationError) setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    // CA02 Validation: Destination must be selected
    if (!destination || (destination !== 'RESALE' && destination !== 'RECYCLE')) {
      setValidationError('Debe seleccionar obligatoriamente una opción de destino: Reventa o Reciclaje.');
      return;
    }

    // CA03 Validation: Mandatory justification
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setValidationError('La justificación es obligatoria para determinar el destino del equipo.');
      return;
    }

    setSubmitting(true);
    setValidationError(null);
    setSuccessMessage(null);

    try {
      // CA04: Save determination and update inventory status
      const res = await ApiService.determineOrderDestination(
        order.id,
        { destination, reason: trimmedReason },
        token
      );

      const statusLabel = destination === 'RESALE' ? 'Listo para Reventa' : 'En Proceso de Reciclaje';
      setSuccessMessage(`Destino registrado exitosamente: "${statusLabel}".`);
      setExistingDisposition(res.disposition);

      setTimeout(() => {
        onSuccess(res.order);
      }, 900);
    } catch (err: any) {
      setValidationError(err.message || 'Error al guardar el destino del equipo.');
    } finally {
      setSubmitting(false);
    }
  };

  const diagnosticSummary = inspection?.diagnostic_summary || {};
  const passedCount = items.filter((i) => i.result === 'PASS').length;
  const failedCount = items.filter((i) => i.result === 'FAIL').length;
  const physicalCondition =
    diagnosticSummary.physical_state ||
    inspection?.actual_condition ||
    order.declared_condition ||
    'Evaluación física completada';

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modalContent}>
        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <div className={styles.titleArea}>
            <h3 className={styles.modalTitle}>
              <Sparkles size={18} color="#0284c7" />
              Determinar Destino del Equipo (HU-016)
            </h3>
            <p className={styles.orderSub}>
              Orden: <span className={styles.orderBadge}>{order.order_number}</span> ·{' '}
              <strong>{order.device_type_name}</strong> {order.brand ? `• ${order.brand}` : ''}{' '}
              {order.model ? `(${order.model})` : ''}
            </p>
          </div>
          <button onClick={onClose} className={styles.closeBtn} title="Cerrar ventana" type="button">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.modalBody}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: '#64748b' }}>
              <RotateCcw size={22} className="spin" style={{ marginBottom: 8, display: 'inline-block' }} />
              <p style={{ margin: 0, fontSize: 13 }}>Cargando diagnóstico técnico previo...</p>
            </div>
          ) : fetchError ? (
            <div className={styles.errorBanner}>
              <AlertTriangle size={16} /> {fetchError}
            </div>
          ) : (
            <form onSubmit={handleSubmit} id="destinationForm">
              {/* CA01: Visualización de datos y diagnóstico */}
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeader}>
                  <h4 className={styles.sectionTitle}>
                    <FileText size={15} color="#0284c7" />
                    Diagnóstico Técnico y Estado Físico Previo (CA01)
                  </h4>
                  <span style={{ fontSize: 11, color: '#64748b' }}>
                    {items.length} prueba{items.length !== 1 ? 's' : ''} realizada{items.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className={styles.techSummaryBox}>
                  <div className={styles.summaryMetric}>
                    <span className={styles.metricLabel}>Estado Físico</span>
                    <span className={styles.metricValue}>{physicalCondition}</span>
                  </div>
                  <div className={styles.summaryMetric}>
                    <span className={styles.metricLabel}>Componentes Aptos</span>
                    <span className={styles.metricValue} style={{ color: '#16a34a' }}>
                      ✓ {passedCount} pruebas PASS
                    </span>
                  </div>
                  <div className={styles.summaryMetric}>
                    <span className={styles.metricLabel}>Componentes Defectuosos</span>
                    <span className={styles.metricValue} style={{ color: failedCount > 0 ? '#dc2626' : '#64748b' }}>
                      {failedCount > 0 ? `✗ ${failedCount} fallas` : 'Ninguna'}
                    </span>
                  </div>
                  {diagnosticSummary.test_score !== undefined && (
                    <div className={styles.summaryMetric}>
                      <span className={styles.metricLabel}>Puntaje Técnico</span>
                      <span className={styles.metricValue}>{diagnosticSummary.test_score} / 10</span>
                    </div>
                  )}
                </div>

                {/* Lista detallada de componentes aptos o defectuosos */}
                <div className={styles.componentsList}>
                  {items.map((item) => (
                    <div key={item.id} className={styles.componentRow}>
                      <div className={styles.componentInfo}>
                        <span className={styles.componentName}>{item.criterion_label}</span>
                        {item.observation && (
                          <span className={styles.componentObs}>{item.observation}</span>
                        )}
                      </div>
                      <div>
                        {item.result === 'PASS' && (
                          <span className={styles.statusPass}>
                            <CheckCircle2 size={12} /> Apto (PASS)
                          </span>
                        )}
                        {item.result === 'FAIL' && (
                          <span className={styles.statusFail}>
                            <AlertTriangle size={12} /> Defectuoso (FAIL)
                          </span>
                        )}
                        {item.result === 'NOT_APPLICABLE' && (
                          <span className={styles.statusNA}>N/A</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CA02: Selección de opciones de destino */}
              <div className={styles.sectionBlock} style={{ marginTop: 18 }}>
                <div className={styles.sectionHeader}>
                  <h4 className={styles.sectionTitle}>
                    <ShoppingBag size={15} color="#0284c7" />
                    Destino Operativo y Comercial (CA02)
                  </h4>
                  <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>* Obligatorio</span>
                </div>

                <div className={styles.optionsGrid}>
                  {/* Opción 1: Reventa */}
                  <div
                    className={`${styles.optionCard} ${
                      destination === 'RESALE' ? styles.optionCardActiveResale : ''
                    }`}
                    onClick={() => handleDestinationSelect('RESALE')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') handleDestinationSelect('RESALE');
                    }}
                  >
                    <div className={styles.optionTop}>
                      <div className={`${styles.optionIconWrap} ${styles.iconResale}`}>
                        <ShoppingBag size={20} />
                      </div>
                      <input
                        type="radio"
                        name="destinationOption"
                        value="RESALE"
                        checked={destination === 'RESALE'}
                        onChange={() => handleDestinationSelect('RESALE')}
                        className={styles.optionRadio}
                      />
                    </div>
                    <div>
                      <h5 className={styles.optionTitle}>Reventa</h5>
                      <p className={styles.optionDesc}>
                        Equipo apto para reacondicionamiento y comercialización. Estado:{' '}
                        <strong>"Listo para Reventa"</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Opción 2: Reciclaje */}
                  <div
                    className={`${styles.optionCard} ${
                      destination === 'RECYCLE' ? styles.optionCardActiveRecycle : ''
                    }`}
                    onClick={() => handleDestinationSelect('RECYCLE')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') handleDestinationSelect('RECYCLE');
                    }}
                  >
                    <div className={styles.optionTop}>
                      <div className={`${styles.optionIconWrap} ${styles.iconRecycle}`}>
                        <Recycle size={20} />
                      </div>
                      <input
                        type="radio"
                        name="destinationOption"
                        value="RECYCLE"
                        checked={destination === 'RECYCLE'}
                        onChange={() => handleDestinationSelect('RECYCLE')}
                        className={styles.optionRadio}
                      />
                    </div>
                    <div>
                      <h5 className={styles.optionTitle}>Reciclaje</h5>
                      <p className={styles.optionDesc}>
                        Equipo no apto para reventa; recuperación de partes o disposición ecológica. Estado:{' '}
                        <strong>"En Proceso de Reciclaje"</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CA03: Registro de justificación obligatoria */}
              <div className={styles.sectionBlock} style={{ marginTop: 18 }}>
                <div className={styles.justificationField}>
                  <label htmlFor="justificationReason" className={styles.fieldLabel}>
                    Justificación u Observación Técnica <span className={styles.requiredStar}>*</span>
                  </label>
                  <textarea
                    id="justificationReason"
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    placeholder="Describa el fundamento técnico de la decisión (ej. equipo supera pruebas diagnósticas sin defectos, o componentes clave no viables económicamente)..."
                    className={`${styles.textarea} ${validationError ? styles.textareaError : ''}`}
                    rows={3}
                  />
                </div>
              </div>

              {/* Mensajes de error y éxito (CA03 / CA04) */}
              {validationError && (
                <div className={styles.errorBanner} style={{ marginTop: 12 }}>
                  <AlertCircle size={16} /> {validationError}
                </div>
              )}

              {successMessage && (
                <div className={styles.successBanner} style={{ marginTop: 12 }}>
                  <CheckCircle2 size={16} /> {successMessage}
                </div>
              )}

              {/* CA04: Información de auditoría e inspector */}
              <div className={styles.auditMeta} style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <UserCheck size={14} color="#0284c7" />
                  <span>
                    Inspector:{' '}
                    <strong>{currentUser?.name || currentUser?.email || 'Inspector Autenticado'}</strong>
                    {currentUser?.id ? ` (${currentUser.id})` : ''}
                  </span>
                </div>
                {existingDisposition && existingDisposition.determined_at && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b' }}>
                    <Clock size={13} />
                    <span>
                      Última determinación registrada:{' '}
                      {new Date(existingDisposition.determined_at).toLocaleString()} (
                      {existingDisposition.type === 'RESALE' ? 'Reventa' : 'Reciclaje'})
                    </span>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className={styles.modalFooter}>
          <button
            type="button"
            onClick={onClose}
            className={`btn-secondary ${styles.cancelBtn}`}
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="destinationForm"
            className={`btn-primary ${styles.submitBtn}`}
            disabled={submitting || loading}
          >
            {submitting ? (
              <>
                <RotateCcw size={14} className="spin" /> Guardando...
              </>
            ) : (
              <>
                <CheckCircle2 size={14} /> Confirmar Destino (CA04)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

