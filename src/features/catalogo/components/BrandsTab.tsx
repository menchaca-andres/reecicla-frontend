import React from 'react';
import { Edit2, Power, Check, X } from 'lucide-react';
import type { DeviceType, DeviceBrand } from '../../../types';
import styles from '../catalog.module.css';

interface BrandsTabProps {
  deviceTypes: DeviceType[];
  selectedTypeForBrand: string;
  setSelectedTypeForBrand: (id: string) => void;
  newBrandName: string;
  setNewBrandName: (val: string) => void;
  submittingBrand: boolean;
  handleCreateBrand: (e: React.FormEvent) => void;
  brandsLoading: boolean;
  brandsForType: DeviceBrand[];
  editingBrandId: string | null;
  setEditingBrandId: (id: string | null) => void;
  editBrandName: string;
  setEditBrandName: (val: string) => void;
  handleUpdateBrand: (brandId: string) => void;
  handleToggleBrand: (brand: DeviceBrand) => void;
}

export const BrandsTab: React.FC<BrandsTabProps> = ({
  deviceTypes,
  selectedTypeForBrand,
  setSelectedTypeForBrand,
  newBrandName,
  setNewBrandName,
  submittingBrand,
  handleCreateBrand,
  brandsLoading,
  brandsForType,
  editingBrandId,
  setEditingBrandId,
  editBrandName,
  setEditBrandName,
  handleUpdateBrand,
  handleToggleBrand,
}) => {
  return (
    <div className={`${styles.panel} ${styles.panelStack}`}>
      <div>
        <label className={styles.label}>Seleccionar Tipo de Equipo:</label>
        <select
          value={selectedTypeForBrand}
          onChange={(e) => setSelectedTypeForBrand(e.target.value)}
          className={styles.selectWide}
        >
          {deviceTypes.map(t => (
            <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
          ))}
        </select>
      </div>

      <form onSubmit={handleCreateBrand} className={styles.formRow}>
        <input
          type="text"
          placeholder="Nueva marca (Ej. Asus, Whirlpool)"
          value={newBrandName}
          onChange={(e) => setNewBrandName(e.target.value)}
          required
          className={styles.inputInline}
        />
        <button
          type="submit"
          disabled={submittingBrand || !newBrandName.trim()}
          className={styles.btnPrimary}
        >
          + Agregar Marca
        </button>
      </form>

      {brandsLoading ? (
        <p className={styles.loadingText}>Cargando marcas...</p>
      ) : brandsForType.length === 0 ? (
        <p className={styles.emptyText}>No hay marcas registradas para este tipo.</p>
      ) : (
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              <th>Marca</th>
              <th>Estado</th>
              <th className={styles.thRight}>Acciones</th>
            </tr>
          </thead>
          <tbody className={styles.tbody}>
            {brandsForType.map(b => (
              <tr key={b.id}>
                <td>
                  {editingBrandId === b.id ? (
                    <div className={styles.editRow}>
                      <input
                        type="text"
                        value={editBrandName}
                        onChange={(e) => setEditBrandName(e.target.value)}
                        className={styles.inputEdit}
                      />
                      <button onClick={() => handleUpdateBrand(b.id)} className={styles.btnEditConfirm}>
                        <Check size={12} />
                      </button>
                      <button onClick={() => setEditingBrandId(null)} className={styles.btnEditCancel}>
                        <X size={12} />
                      </button>
                    </div>
                  ) : b.name}
                </td>
                <td>
                  <span className={b.status === 'ACTIVE' ? styles.badgeActive : styles.badgeInactive}>
                    {b.status === 'ACTIVE' ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className={`${styles.tdRight} ${styles.formRow}`} style={{ justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => { setEditingBrandId(b.id); setEditBrandName(b.name); }}
                    className={styles.btnIcon}
                    style={{ color: '#64748b' }}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleToggleBrand(b)}
                    className={styles.btnIcon}
                    style={{ color: b.status === 'ACTIVE' ? '#ef4444' : '#22c55e' }}
                  >
                    <Power size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
