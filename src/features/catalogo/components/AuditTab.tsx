import React from 'react';
import type { CatalogAuditLog, PaginationMeta } from '../../../types';
import { PaginationControls } from '../../../components/PaginationControls';
import styles from '../catalog.module.css';

interface AuditTabProps {
  auditLogs: CatalogAuditLog[];
  loading: boolean;
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

export const AuditTab: React.FC<AuditTabProps> = ({
  auditLogs,
  loading,
  pagination,
  onPageChange,
}) => (
  <div className={styles.panel}>
    <h3 className={styles.sectionTitle}>Auditoría del catálogo</h3>
    {loading ? (
      <p className={styles.loadingText}>Cargando auditoría...</p>
    ) : auditLogs.length === 0 ? (
      <p className={styles.emptyText}>No hay registros de auditoría.</p>
    ) : (
      <>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th>Fecha</th>
                <th>Elemento</th>
                <th>Acción</th>
                <th>Motivo</th>
                <th>Ejecutado por</th>
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.created_at).toLocaleString()}</td>
                  <td>{log.entity_name}</td>
                  <td>{log.action}</td>
                  <td>{log.reason}</td>
                  <td>{log.executed_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationControls pagination={pagination} onPageChange={onPageChange} />
      </>
    )}
  </div>
);
