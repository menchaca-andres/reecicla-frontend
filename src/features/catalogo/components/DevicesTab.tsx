import React from 'react';
import { PlusCircle, Power } from 'lucide-react';
import type { DeviceType, DeviceBrand, Device } from '../../../types';
import styles from '../catalog.module.css';

interface DevicesTabProps {
  deviceTypes: DeviceType[];
  devTypeId: string;
  setDevTypeId: (id: string) => void;
  devBrands: DeviceBrand[];
  devBrandId: string;
  setDevBrandId: (id: string) => void;
  devModel: string;
  setDevModel: (val: string) => void;
  devYear: string;
  setDevYear: (val: string) => void;
  devDesc: string;
  setDevDesc: (val: string) => void;
  submittingDevice: boolean;
  handleCreateDevice: (e: React.FormEvent) => void;
  devicesFilterType: string;
  setDevicesFilterType: (id: string) => void;
  devices: Device[];
  handleToggleDevice: (dev: Device) => void;
}

export const DevicesTab: React.FC<DevicesTabProps> = ({
  deviceTypes,
  devTypeId,
  setDevTypeId,
  devBrands,
  devBrandId,
  setDevBrandId,
  devModel,
  setDevModel,
  devYear,
  setDevYear,
  devDesc,
  setDevDesc,
  submittingDevice,
  handleCreateDevice,
  devicesFilterType,
  setDevicesFilterType,
  devices,
  handleToggleDevice,
}) => {
  return (
    <div className={styles.panelStack}>
      {/* Create Device Form */}
      <div className={styles.panel}>
        <h3 className={styles.sectionTitle}>
          <PlusCircle size={18} color="#2563eb" /> Registrar Nuevo Dispositivo en Catálogo
        </h3>
        <form onSubmit={handleCreateDevice} className={styles.formGrid3}>
          <div>
            <label className={styles.label}>Tipo de Equipo *</label>
            <select
              value={devTypeId}
              onChange={(e) => setDevTypeId(e.target.value)}
              required
              className={styles.selectFullWidth}
            >
              {deviceTypes.filter(t => t.status === 'ACTIVE').map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className={styles.label}>Marca *</label>
            <select
              value={devBrandId}
              onChange={(e) => setDevBrandId(e.target.value)}
              required
              disabled={devBrands.length === 0}
              className={styles.selectFullWidth}
            >
              {devBrands.length === 0 ? (
                <option value="">(Sin marcas registradas para este tipo)</option>
              ) : (
                devBrands.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className={styles.label}>Modelo *</label>
            <input type="text" placeholder="Ej. Galaxy S23, XPS 15 9530" value={devModel} onChange={(e) => setDevModel(e.target.value)} required className={styles.input} />
          </div>

          <div>
            <label className={styles.label}>Año de Lanzamiento</label>
            <input type="number" placeholder="Ej. 2023" min="2000" max="2030" value={devYear} onChange={(e) => setDevYear(e.target.value)} className={styles.input} />
          </div>

          <div className={styles.span2}>
            <label className={styles.label}>Descripción / Especificaciones</label>
            <input type="text" placeholder="Ej. Smartphone flagship 128GB" value={devDesc} onChange={(e) => setDevDesc(e.target.value)} className={styles.input} />
          </div>

          <div className={`${styles.span3} ${styles.formActions}`}>
            <button type="submit" disabled={submittingDevice || !devBrandId} className={styles.btnPrimary}>
              {submittingDevice ? 'Guardando...' : 'Registrar Dispositivo'}
            </button>
          </div>
        </form>
      </div>

      {/* List Devices */}
      <div className={styles.panel}>
        <div className={styles.listSubheader}>
          <h3 className={styles.sectionTitleNoMarginBottom}>Catálogo de Dispositivos Registrados</h3>
          <select value={devicesFilterType} onChange={(e) => setDevicesFilterType(e.target.value)} className={styles.selectFilter}>
            <option value="">Todos los tipos</option>
            {deviceTypes.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {devices.length === 0 ? (
          <p className={styles.emptyText}>No hay dispositivos registrados.</p>
        ) : (
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th>Tipo</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Año</th>
                <th>Estado</th>
                <th className={styles.thRight}>Acciones</th>
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {devices.map((dev) => (
                <tr key={dev.id}>
                  <td>{dev.device_type_name || '—'}</td>
                  <td>{dev.brand_name || '—'}</td>
                  <td className={styles.codeText}>{dev.model}</td>
                  <td>{dev.year || 'N/A'}</td>
                  <td>
                    <span className={dev.status === 'ACTIVE' ? styles.badgeActive : styles.badgeInactive}>
                      {dev.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className={styles.tdRight}>
                    <button onClick={() => handleToggleDevice(dev)} title={dev.status === 'ACTIVE' ? 'Inactivar' : 'Activar'} className={styles.btnIcon} style={{ color: dev.status === 'ACTIVE' ? '#ef4444' : '#22c55e' }}>
                      <Power size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
