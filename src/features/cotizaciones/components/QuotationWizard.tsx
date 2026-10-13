import React, { useEffect, useState } from 'react';
import type { QuoteRequest, Quote, DeviceType, Device } from '../../../types';
import { ApiService } from '../../../services/api';
import styles from '../QuotationWizard.module.css';

interface QuotationWizardProps {
  token: string | null;
  onQuoteCreated: (quote: Quote) => void;
  onNeedAuth?: () => void;
}

const CONDITIONS = [
  { id: 'working', label: 'Excelente / Funcionando', desc: 'Sin fallas operativas' },
  { id: 'damaged', label: 'Detalles / Daño Estético', desc: 'Desgaste o fallas menores' },
  { id: 'broken', label: 'Averiado / Repuestos', desc: 'No enciende o daño mayor' },
];

export const QuotationWizard: React.FC<QuotationWizardProps> = ({
  token,
  onQuoteCreated,
  onNeedAuth: _onNeedAuth,
}) => {
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [selectedTypeCode, setSelectedTypeCode] = useState('');

  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [search, setSearch] = useState('');

  const [condition, setCondition] = useState('working');
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    ApiService.getDeviceTypes()
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
  }, []);

  useEffect(() => {
    if (!selectedTypeCode) return;
    const dt = deviceTypes.find((d) => d.code === selectedTypeCode);
    if (!dt) return;

    let cancelled = false;
    setLoadingDevices(true);
    setSelectedDeviceId('');
    setSearch('');

    ApiService.getDevices(dt.id)
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
  }, [selectedTypeCode, deviceTypes]);

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

    if (!selectedDevice) { setError('Seleccioná un dispositivo del catálogo.'); return; }

    setLoading(true);
    try {
      const quoteData: QuoteRequest = {
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
    <div className={styles.container}>

      {error && (
        <div className={styles.alertError}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>

        {/* Step 1 — Equipos */}
        <div>
          <h2 className={styles.sectionHeaderTitle}>Equipos</h2>
          {loadingTypes ? (
            <p role="status" className={styles.statusText}>Cargando tipos de equipo...</p>
          ) : deviceTypes.length === 0 ? (
            <p role="status" className={styles.statusText}>No hay tipos activos disponibles.</p>
          ) : (
            <div className={styles.squareGrid}>
              {deviceTypes.map((dev) => {
                const isSelected = selectedTypeCode === dev.code;
                return (
                  <div key={dev.id} className={isSelected ? styles.squareCardSelected : styles.squareCard} onClick={() => { setSelectedTypeCode(dev.code); setIdempotencyKey(null); }}>
                    <span className={isSelected ? styles.cardTitleSelected : styles.cardTitle}>{dev.name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Step 2 — Modelos */}
        <div>
          <h2 className={styles.sectionHeaderTitle}>Modelos</h2>

          {loadingDevices ? (
            <p className={styles.statusText}>Cargando modelos disponibles...</p>
          ) : devices.length === 0 ? (
            <div className={styles.emptyWarning}>No hay dispositivos registrados para este tipo. Contactá al administrador.</div>
          ) : (
            <>
              {/* Buscador */}
              <div className={styles.searchContainer}>
                <input type="text" className={`input-field ${styles.searchInput}`} placeholder="Buscar por marca, modelo o año..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>

              {/* Grilla cuadrada de modelos */}
              <div className={styles.squareGrid}>
                {filteredDevices.length === 0 ? (
                  <p className={styles.emptySearch}>Sin resultados para "{search}"</p>
                ) : filteredDevices.map((dev) => {
                  const isSelected = selectedDeviceId === dev.id;
                  return (
                    <div key={dev.id} onClick={() => { setSelectedDeviceId(dev.id); setIdempotencyKey(null); }} className={isSelected ? styles.squareCardSelected : styles.squareCard}>
                      <span className={isSelected ? styles.cardTitleSelected : styles.cardTitle}>{dev.brand_name} {dev.model}</span>
                      {dev.year && (<span className={styles.cardSubtext}>{dev.year}</span>)}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Step 3 — Condición */}
        <div>
          <h2 className={styles.sectionHeaderTitle}>Condición</h2>
          <div className={styles.squareGrid}>
            {CONDITIONS.map((cond) => {
              const isSelected = condition === cond.id;
              return (
                <div key={cond.id} onClick={() => { setCondition(cond.id); setIdempotencyKey(null); }} className={isSelected ? styles.squareCardSelected : styles.squareCard}>
                  <span className={isSelected ? styles.cardTitleSelected : styles.cardTitle}>{cond.label}</span>
                  <span className={styles.cardSubtext}>{cond.desc}</span>
                </div>
              );
            })}
          </div>
        </div>

        <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading || loadingTypes || !selectedDeviceId}> {loading ? 'Calculando cotización...' : 'Calcular precio de cotización'}</button>
      </form>
    </div>
  );
};
