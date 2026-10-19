import React from 'react';
import type { DeviceType } from '../../../types';
import styles from '../catalog.module.css';

interface TypesTabProps {
  typeCode: string;
  setTypeCode: (val: string) => void;
  typeName: string;
  setTypeName: (val: string) => void;
  typeDesc: string;
  setTypeDesc: (val: string) => void;
  submittingType: boolean;
  handleCreateType: (e: React.FormEvent) => void;
  deviceTypes: DeviceType[];
  handleInactivateType: (id: string, name: string) => void;
  onOpenInactivityModal: () => void;
}

export const TypesTab: React.FC<TypesTabProps> = ({
  typeCode,
  setTypeCode,
  typeName,
  setTypeName,
  typeDesc,
  setTypeDesc,
  submittingType,
  handleCreateType,
  deviceTypes,
  handleInactivateType,
  onOpenInactivityModal,
}) => {
  return (
    <div className={styles.panelStack}>
      {/* Create Type Form */}
      <div className={styles.panel}>
        <h3 className={styles.sectionTitle}>Crear Nuevo Tipo de Equipo</h3>
        <form onSubmit={handleCreateType} className={styles.formGrid2}>
          <div>
            <label className={styles.label}>Código *</label>
            <input
              type="text"
              placeholder="Ej. TABLET, CONSOLE"
              value={typeCode}
              onChange={(e) => setTypeCode(e.target.value)}
              required
              className={styles.input}
            />
          </div>
          <div>
            <label className={styles.label}>Nombre *</label>
            <input
              type="text"
              placeholder="Ej. Tablet, Consola de Videojuegos"
              value={typeName}
              onChange={(e) => setTypeName(e.target.value)}
              required
              className={styles.input}
            />
          </div>
          <div className={styles.span2}>
            <label className={styles.label}>Descripción</label>
            <input
              type="text"
              placeholder="Descripción opcional"
              value={typeDesc}
              onChange={(e) => setTypeDesc(e.target.value)}
              className={styles.input}
            />
          </div>
          <div className={`${styles.span2} ${styles.formActions}`}>
            <button
              type="submit"
              disabled={submittingType}
              className={styles.btnPrimary}
            >
              {submittingType ? 'Guardando...' : 'Crear Tipo'}
            </button>
          </div>
        </form>
      </div>

      {/* List Types */}
      <div className={styles.panel}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Tipos de Equipo Registrados</h3>
            <p className={styles.headerSubtitle} style={{ margin: '4px 0 0 0' }}>
              Gestión y estado operativo del catálogo de tipos de equipo.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenInactivityModal}
            className={styles.btnSecondary}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              fontWeight: 600,
              fontSize: '13px',
              borderColor: '#cbd5e1',
              backgroundColor: '#f8fafc',
            }}
          >
            <span>⏱️</span>
            <span>Mantenimiento de Inactividad (HU-023)</span>
          </button>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Última Recepción</th>
                <th>Estado</th>
                <th className={styles.thRight}>Acción</th>
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {deviceTypes.map(t => (
                <tr key={t.id}>
                  <td className={styles.codeText}>{t.code}</td>
                  <td>
                    <strong>{t.name}</strong>
                    {t.description && (
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        {t.description}
                      </div>
                    )}
                  </td>
                  <td>
                    {t.last_received_at ? (
                      <span style={{ fontSize: '13px', color: '#334155' }}>
                        {new Date(t.last_received_at).toLocaleDateString()}
                      </span>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                        Sin recepciones
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={t.status === 'ACTIVE' ? styles.badgeActive : styles.badgeInactive}>
                      {t.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className={styles.tdRight}>
                    {t.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleInactivateType(t.id, t.name)}
                        className={styles.actionTextButton}
                      >
                        Inactivar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

