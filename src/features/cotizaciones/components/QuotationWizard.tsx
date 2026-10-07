import React, { useEffect, useState } from 'react';
import { Package, Sparkles, AlertCircle, Search } from 'lucide-react';
import type { QuoteRequest, Quote, DeviceType, Device } from '../../../types';
import { ApiService } from '../../../services/api';
import styles from '../QuotationWizard.module.css';

interface QuotationWizardProps {
  tenantId: string;
  token: string | null;
  onQuoteCreated: (quote: Quote) => void;
  onNeedAuth: () => void;
}

const CONDITIONS = [
  { id: 'working', label: 'Excelente / Funcionando', desc: 'Sin fallas operativas ni daños graves', accent: '#16a34a' },
  { id: 'damaged', label: 'Detalles / Daño Estético', desc: 'Funciona pero tiene desgaste o fallas menores', accent: '#ea580c' },
  { id: 'broken', label: 'Averiado / Para Repuestos', desc: 'No enciende o requiere reparación mayor', accent: '#dc2626' },
];

export const QuotationWizard: React.FC<QuotationWizardProps> = ({
  tenantId,
  token,
  onQuoteCreated,
  onNeedAuth,
}) => {
  // Step 1: filter by device type
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [selectedTypeCode, setSelectedTypeCode] = useState('');

  // Step 2: select from device catalog
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [search, setSearch] = useState('');

  const [condition, setCondition] = useState('working');
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load device types
  useEffect(() => {
    let cancelled = false;
    ApiService.getDeviceTypes(tenantId)
      .then((res) => {
        if (cancelled) return;
        const types = (res?.device_types || res?.deviceTypes || []).filter(
          (t) => t.status === 'ACTIVE'
        );
        setDeviceTypes(types);
        if (types.length > 0) setSelectedTypeCode(types[0].code);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || 'No se pudo cargar el catálogo.');
      })
      .finally(() => { if (!cancelled) setLoadingTypes(false); });
    return () => { cancelled = true; };
  }, [tenantId]);

  // Load devices when type changes
  useEffect(() => {
    if (!selectedTypeCode) return;
    const dt = deviceTypes.find((d) => d.code === selectedTypeCode);
    if (!dt) return;

    let cancelled = false;
    setLoadingDevices(true);
    setSelectedDeviceId('');
    setSearch('');

    ApiService.getDevices(tenantId, dt.id)
      .then((res) => {
        if (cancelled) return;
        setDevices(res.devices || []);
        if ((res.devices || []).length > 0) {
          setSelectedDeviceId(res.devices[0].id);
        }
      })
      .catch(() => { if (!cancelled) setDevices([]); })
      .finally(() => { if (!cancelled) setLoadingDevices(false); });

    return () => { cancelled = true; };
  }, [selectedTypeCode, deviceTypes, tenantId]);

  const filteredDevices = devices.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (d.brand_name || '').toLowerCase().includes(q) ||
      d.model.toLowerCase().includes(q) ||
      String(d.year || '').includes(q)
    );
  });

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) { onNeedAuth(); return; }
    if (!selectedDevice) { setError('Seleccioná un dispositivo del catálogo.'); return; }

    setLoading(true);
    try {
      const quoteData: QuoteRequest = {
        tenant_id: tenantId,
        device_type: selectedDevice.device_type_code?.toLowerCase() || selectedTypeCode.toLowerCase(),
        brand: selectedDevice.brand_name,
        model: selectedDevice.model,
        year: selectedDevice.year || undefined,
        condition,
      };
      const requestKey = idempotencyKey || crypto.randomUUID();
      setIdempotencyKey(requestKey);
      const res = await ApiService.createQuote(quoteData, token, requestKey);
      setIdempotencyKey(null);
      onQuoteCreated(res.quote);
    } catch (err: any) {
      setError(err.message || 'Error al calcular la cotización');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`glass-panel animate-fade-in ${styles.wizardCard}`}>
      <div className={styles.headerRow}>
        <div className={styles.headerIcon}>
          <Sparkles size={24} />
        </div>
        <div>
          <h2 className={styles.title}>Solicitar Cotización de Equipo</h2>
          <p className={styles.subtitle}>Seleccioná el equipo del catálogo y su condición actual</p>
        </div>
      </div>

      {error && (
        <div className={styles.alertError}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>

        {/* Step 1 — Tipo de dispositivo */}
        <div>
          <label className={styles.stepLabel}>
            1. Tipo de Dispositivo
          </label>
          {loadingTypes ? (
            <p role="status" className={styles.statusText}>Cargando tipos de equipo...</p>
          ) : deviceTypes.length === 0 ? (
            <p role="status" className={styles.statusText}>No hay tipos activos disponibles.</p>
          ) : (
            <div className="device-grid">
              {deviceTypes.map((dev) => {
                const isSelected = selectedTypeCode === dev.code;
                return (
                  <button
                    type="button"
                    key={dev.id}
                    className={`device-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => { setSelectedTypeCode(dev.code); setIdempotencyKey(null); }}
                    aria-pressed={isSelected}
                    style={{ color: 'inherit', font: 'inherit' }}
                  >
                    <Package size={26} color={isSelected ? '#0071e3' : '#86868b'} style={{ marginBottom: '8px' }} />
                    <span className={styles.cardButtonText} style={{ color: isSelected ? '#1d1d1f' : '#6e6e73' }}>
                      {dev.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Step 2 — Seleccionar device del catálogo */}
        <div>
          <label className={styles.stepLabel}>
            2. Seleccionar Modelo del Catálogo
          </label>

          {loadingDevices ? (
            <p className={styles.statusText}>Cargando modelos disponibles...</p>
          ) : devices.length === 0 ? (
            <div className={styles.emptyWarning}>
              No hay dispositivos registrados para este tipo. Contactá al administrador.
            </div>
          ) : (
            <>
              {/* Buscador */}
              <div className={styles.searchContainer}>
                <Search size={14} className={styles.searchIcon} />
                <input
                  type="text"
                  className={`input-field ${styles.searchInput}`}
                  placeholder="Buscar por marca, modelo o año..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Lista de devices */}
              <div className={styles.deviceListGrid}>
                {filteredDevices.length === 0 ? (
                  <p className={styles.emptySearch}>
                    Sin resultados para "{search}"
                  </p>
                ) : filteredDevices.map((dev) => {
                  const isSelected = selectedDeviceId === dev.id;
                  return (
                    <div
                      key={dev.id}
                      onClick={() => { setSelectedDeviceId(dev.id); setIdempotencyKey(null); }}
                      className={isSelected ? styles.deviceRowSelected : styles.deviceRow}
                    >
                      <div>
                        <span className={isSelected ? styles.deviceNameSelected : styles.deviceName}>
                          {dev.brand_name} {dev.model}
                        </span>
                        {dev.year && (
                          <span className={styles.deviceYear}>
                            ({dev.year})
                          </span>
                        )}
                        {dev.description && (
                          <p className={styles.deviceDesc}>{dev.description}</p>
                        )}
                      </div>
                      <div className={isSelected ? styles.radioDotSelected : styles.radioDot} />
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Step 3 — Condición */}
        <div>
          <label className={styles.stepLabel}>
            3. Condición Declarada del Equipo
          </label>
          <div className={styles.conditionGrid}>
            {CONDITIONS.map((cond) => {
              const isSelected = condition === cond.id;
              return (
                <div
                  key={cond.id}
                  onClick={() => { setCondition(cond.id); setIdempotencyKey(null); }}
                  className={isSelected ? styles.conditionRowSelected : styles.conditionRow}
                >
                  <div>
                    <p className={isSelected ? styles.conditionLabelSelected : styles.conditionLabel}>{cond.label}</p>
                    <p className={styles.conditionDesc}>{cond.desc}</p>
                  </div>
                  <div className={isSelected ? styles.radioDotSelected : styles.radioDot} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary del device seleccionado */}
        {selectedDevice && (
          <div className={styles.summaryBox}>
            <strong>Equipo seleccionado:</strong> {selectedDevice.brand_name} {selectedDevice.model}
            {selectedDevice.year ? ` (${selectedDevice.year})` : ''} — {selectedDevice.device_type_name}
          </div>
        )}

        <button
          type="submit"
          className={`btn-primary ${styles.submitBtn}`}
          disabled={loading || loadingTypes || !selectedDeviceId}
        >
          {loading ? 'Calculando Cotización...' : 'Calcular Precio de Cotización (Bs.)'}
        </button>
      </form>
    </div>
  );
};
