import React, { useState, useEffect, useCallback } from 'react';
import { ApiService } from '../../../services/api';
import type { InactivityEvaluationSummary, InactivityMaintenanceResult, CatalogAuditLog } from '../../../types';
import styles from './DeviceTypeInactivityModal.module.css';
import { Clock, AlertTriangle, CheckCircle2, History, RefreshCw, X, Play, Mail, ShieldAlert, AlertCircle } from 'lucide-react';

interface DeviceTypeInactivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  onMaintenanceComplete: () => void;
}

export const DeviceTypeInactivityModal: React.FC<DeviceTypeInactivityModalProps> = ({
  isOpen,
  onClose,
  token,
  onMaintenanceComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'evaluation' | 'audit'>('evaluation');
  const [cutoffMonths, setCutoffMonths] = useState<number>(12);
  const [summary, setSummary] = useState<InactivityEvaluationSummary | null>(null);
  const [auditLogs, setAuditLogs] = useState<CatalogAuditLog[]>([]);
  const [loadingEvaluation, setLoadingEvaluation] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<InactivityMaintenanceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchEvaluation = useCallback(async () => {
    if (!token) return;
    setLoadingEvaluation(true);
    setError(null);
    try {
      const res = await ApiService.evaluateDeviceTypesInactivity(token, cutoffMonths);
      setSummary(res.summary || (res as any));
    } catch (err: any) {
      setError(err.message || 'Error al evaluar inactividad de tipos.');
    } finally {
      setLoadingEvaluation(false);
    }
  }, [token, cutoffMonths]);

  const fetchAuditLogs = useCallback(async () => {
    if (!token) return;
    setLoadingAudit(true);
    setError(null);
    try {
      const res = await ApiService.getCatalogAuditLogs(token, 50);
      setAuditLogs(res.audit_logs || []);
    } catch (err: any) {
      setError(err.message || 'Error al obtener registros de auditoría.');
    } finally {
      setLoadingAudit(false);
    }
  }, [token]);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(null);
      setResult(null);
      fetchEvaluation();
      fetchAuditLogs();
    }
  }, [isOpen, fetchEvaluation, fetchAuditLogs]);

  const handleExecuteMaintenance = async () => {
    if (!token) return;
    if (!window.confirm(`¿Confirmas desactivar los tipos de equipo sin recepciones durante ${cutoffMonths} meses? Los elementos con stock físico o pedidos pendientes se mantendrán activos por seguridad.`)) {
      return;
    }

    setExecuting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await ApiService.executeDeviceTypesInactivityMaintenance(token, cutoffMonths);
      setResult(res);
      setSuccess(`Mantenimiento ejecutado con éxito: ${res.total_deactivated} tipo(s) desactivado(s), ${res.total_blocked} protegido(s) por dependencias activas.`);
      onMaintenanceComplete();
      await fetchEvaluation();
      await fetchAuditLogs();
    } catch (err: any) {
      setError(err.message || 'Error al ejecutar mantenimiento de inactividad.');
    } finally {
      setExecuting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.titleArea}>
            <h2 className={styles.modalTitle}>
              <Clock size={20} color="#2563eb" />
              Mantenimiento de Inactividad de Tipos de Equipo
              <span className={styles.codeBadge}>HU-023</span>
            </h2>
            <p className={styles.subtitle}>
              Identificación y desactivación de tipos de equipos sin recepciones durante 12 meses o más, garantizando la integridad de stock.
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} title="Cerrar modal">
            <X size={20} />
          </button>
        </div>

        {/* Tab navigation */}
        <div className={styles.tabBar}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'evaluation' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('evaluation')}
          >
            <Clock size={16} />
            Evaluación y Ejecución
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'audit' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            <History size={16} />
            Historial de Auditoría ({auditLogs.length})
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {error && (
            <div className={`${styles.alertBox} ${styles.alertBoxError}`}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className={`${styles.alertBox} ${styles.alertBoxSuccess}`}>
              <CheckCircle2 size={18} />
              <div>
                <strong>{success}</strong>
                {result?.notification_sent && (
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
                    <Mail size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                    Notificación resumen enviada por correo al administrador.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'evaluation' ? (
            <>
              {/* Controls */}
              <div className={styles.controlBar}>
                <div className={styles.cutoffGroup}>
                  <label htmlFor="cutoffInput">Umbral de inactividad:</label>
                  <input
                    id="cutoffInput"
                    type="number"
                    min="1"
                    max="60"
                    value={cutoffMonths}
                    onChange={(e) => setCutoffMonths(Math.max(1, parseInt(e.target.value) || 12))}
                    className={styles.cutoffInput}
                  />
                  <span>meses sin recepciones (Criterio CA01)</span>
                </div>
                <button
                  className={styles.btnSecondary}
                  onClick={fetchEvaluation}
                  disabled={loadingEvaluation}
                >
                  <RefreshCw size={14} className={loadingEvaluation ? 'spin' : ''} />
                  {loadingEvaluation ? 'Evaluando...' : 'Re-evaluar'}
                </button>
              </div>

              {/* Summary KPI Cards */}
              <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                  <span className={styles.cardLabel}>Total Evaluados</span>
                  <span className={styles.cardValue}>{summary?.evaluated_count ?? 0}</span>
                </div>
                <div className={`${styles.summaryCard} ${styles.cardDanger}`}>
                  <span className={styles.cardLabel}>Candidatos a Desactivar</span>
                  <span className={styles.cardValue}>{summary?.eligible_to_deactivate.length ?? 0}</span>
                </div>
                <div className={`${styles.summaryCard} ${styles.cardWarning}`}>
                  <span className={styles.cardLabel}>Protegidos x Stock/Órdenes</span>
                  <span className={styles.cardValue}>{summary?.blocked_by_dependencies.length ?? 0}</span>
                </div>
                <div className={`${styles.summaryCard} ${styles.cardSuccess}`}>
                  <span className={styles.cardLabel}>Con Actividad Reciente</span>
                  <span className={styles.cardValue}>{summary?.active_recent.length ?? 0}</span>
                </div>
              </div>

              {/* CA03: Blocked by Dependencies Warning Banner if any */}
              {(summary?.blocked_by_dependencies.length ?? 0) > 0 && (
                <div className={`${styles.alertBox} ${styles.alertBoxWarning}`}>
                  <ShieldAlert size={20} color="#d97706" />
                  <div>
                    <strong>Excepción por Dependencias Activas (Criterio CA04/Integridad):</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
                      Se detectaron tipos sin recepciones en los últimos {cutoffMonths} meses pero que mantienen inventario físico o pedidos pendientes en proceso. El sistema protege su integridad y NO permitirá su desactivación hasta que su stock llegue a cero.
                    </p>
                  </div>
                </div>
              )}

              {/* Candidates to deactivate (Eligible) */}
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <h4 className={styles.sectionHeaderTitle}>
                    <AlertTriangle size={16} color="#dc2626" />
                    Candidatos para Desactivar ({summary?.eligible_to_deactivate.length ?? 0})
                  </h4>
                  <span className={styles.badgeEligible}>Cumplen tiempo y 0 dependencias</span>
                </div>
                <div className={styles.tableWrap}>
                  {summary && summary.eligible_to_deactivate.length > 0 ? (
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Código</th>
                          <th>Nombre</th>
                          <th>Última Recepción</th>
                          <th>Inactividad</th>
                          <th>Motivo</th>
                          <th>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.eligible_to_deactivate.map((item) => (
                          <tr key={item.id}>
                            <td><span className={styles.typeCode}>{item.code}</span></td>
                            <td><strong>{item.name}</strong></td>
                            <td>
                              {item.last_received_at
                                ? new Date(item.last_received_at).toLocaleDateString()
                                : 'Sin recepciones previas'}
                            </td>
                            <td>{item.months_inactive} meses</td>
                            <td style={{ fontSize: '12px', color: '#64748b' }}>{item.reason}</td>
                            <td>
                              <span className={styles.badgeEligible}>Se desactivará</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className={styles.emptyState}>
                      No hay tipos de equipo que cumplan los criterios para ser desactivados.
                    </div>
                  )}
                </div>
              </div>

              {/* Blocked by Dependencies (CA03) */}
              {(summary?.blocked_by_dependencies.length ?? 0) > 0 && (
                <div className={styles.sectionCard}>
                  <div className={`${styles.sectionHeader} ${styles.sectionHeaderWarning}`}>
                    <h4 className={styles.sectionHeaderTitle}>
                      <ShieldAlert size={16} color="#d97706" />
                      Tipos Inactivos Bloqueados por Dependencias Activas ({summary?.blocked_by_dependencies.length})
                    </h4>
                    <span className={styles.badgeBlocked}>Protegidos por CA03</span>
                  </div>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Código</th>
                          <th>Nombre</th>
                          <th>Última Recepción</th>
                          <th>Inactividad</th>
                          <th>Dependencia Detectada</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary?.blocked_by_dependencies.map((item) => (
                          <tr key={item.id}>
                            <td><span className={styles.typeCode}>{item.code}</span></td>
                            <td><strong>{item.name}</strong></td>
                            <td>
                              {item.last_received_at
                                ? new Date(item.last_received_at).toLocaleDateString()
                                : 'Sin recepciones previas'}
                            </td>
                            <td>{item.months_inactive} meses</td>
                            <td>
                              <span className={styles.badgeBlocked}>
                                <AlertTriangle size={12} />
                                {item.dependency_details || 'Inventario físico o pedido activo'}
                              </span>
                            </td>
                            <td>
                              <span className={styles.badgeActive}>Se mantendrá Activo</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Types with recent activity */}
              {(summary?.active_recent.length ?? 0) > 0 && (
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <h4 className={styles.sectionHeaderTitle}>
                      <CheckCircle2 size={16} color="#16a34a" />
                      Tipos con Actividad Reciente ({summary?.active_recent.length})
                    </h4>
                    <span className={styles.badgeActive}>Recepciones &lt; {cutoffMonths} meses</span>
                  </div>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Código</th>
                          <th>Nombre</th>
                          <th>Última Recepción</th>
                          <th>Diagnóstico</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary?.active_recent.map((item) => (
                          <tr key={item.id}>
                            <td><span className={styles.typeCode}>{item.code}</span></td>
                            <td><strong>{item.name}</strong></td>
                            <td>
                              {item.last_received_at
                                ? new Date(item.last_received_at).toLocaleDateString()
                                : 'Creado recientemente'}
                            </td>
                            <td style={{ fontSize: '12px', color: '#16a34a' }}>{item.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Audit Log Tab (CA04) */
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h4 className={styles.sectionHeaderTitle}>
                  <History size={16} color="#2563eb" />
                  Registro de Auditoría de Mantenimiento (CA04)
                </h4>
                <button
                  className={styles.btnSecondary}
                  onClick={fetchAuditLogs}
                  disabled={loadingAudit}
                >
                  <RefreshCw size={13} className={loadingAudit ? 'spin' : ''} />
                  Actualizar
                </button>
              </div>
              <div className={styles.tableWrap}>
                {auditLogs.length > 0 ? (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Fecha / Hora</th>
                        <th>Tipo Afectado</th>
                        <th>Acción</th>
                        <th>Última Recepción</th>
                        <th>Motivo</th>
                        <th>Ejecutado Por</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log.id}>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td>
                            <span className={styles.typeCode}>{log.entity_code || log.entity_id}</span>{' '}
                            <strong>{log.entity_name}</strong>
                          </td>
                          <td>
                            <span className={styles.logActionBadge}>{log.action}</span>
                          </td>
                          <td>
                            {log.last_received_at
                              ? new Date(log.last_received_at).toLocaleDateString()
                              : 'Sin recepciones'}
                          </td>
                          <td style={{ fontSize: '12px' }}>{log.reason}</td>
                          <td>
                            <span className={styles.executorBadge}>{log.executed_by}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className={styles.emptyState}>
                    No hay eventos de mantenimiento registrados en el log de auditoría.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <div className={styles.footerNotes}>
            <Mail size={14} color="#64748b" />
            <span>Al ejecutar, el sistema envía una notificación resumen por correo a los administradores.</span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className={styles.btnSecondary} onClick={onClose} disabled={executing}>
              Cerrar
            </button>
            {activeTab === 'evaluation' && (
              <button
                className={styles.btnPrimaryDanger}
                onClick={handleExecuteMaintenance}
                disabled={executing || (summary?.eligible_to_deactivate.length ?? 0) === 0}
              >
                <Play size={16} />
                {executing
                  ? 'Ejecutando Mantenimiento...'
                  : `Ejecutar Mantenimiento (${summary?.eligible_to_deactivate.length ?? 0})`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
