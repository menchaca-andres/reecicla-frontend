import React, { useEffect, useState } from 'react';
import { Package, Sparkles, AlertCircle, Search } from 'lucide-react';
import type { QuoteRequest, Quote, DeviceType, Device } from '../../../types';
import { ApiService } from '../../../services/api';

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
    <div className="glass-panel animate-fade-in" style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', background: '#ffffff', borderRadius: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
        <div style={{ background: 'rgba(0, 113, 227, 0.08)', padding: '12px', borderRadius: '16px', color: '#0071e3' }}>
          <Sparkles size={24} />
        </div>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.02em' }}>Solicitar Cotización de Equipo</h2>
          <p style={{ fontSize: '13px', color: '#86868b', marginTop: '2px' }}>Seleccioná el equipo del catálogo y su condición actual</p>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(255, 59, 48, 0.08)', border: '1px solid rgba(255, 59, 48, 0.2)', color: '#ff3b30', padding: '12px 16px', borderRadius: '14px', fontSize: '13px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Step 1 — Tipo de dispositivo */}
        <div>
          <label style={{ fontSize: '14px', fontWeight: 600, color: '#1d1d1f', display: 'block', marginBottom: '12px' }}>
            1. Tipo de Dispositivo
          </label>
          {loadingTypes ? (
            <p role="status" style={{ color: '#86868b', fontSize: '13px' }}>Cargando tipos de equipo...</p>
          ) : deviceTypes.length === 0 ? (
            <p role="status" style={{ color: '#86868b', fontSize: '13px' }}>No hay tipos activos disponibles.</p>
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
                    <span style={{ fontSize: '13px', fontWeight: 500, textAlign: 'center', color: isSelected ? '#1d1d1f' : '#6e6e73' }}>
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
          <label style={{ fontSize: '14px', fontWeight: 600, color: '#1d1d1f', display: 'block', marginBottom: '12px' }}>
            2. Seleccionar Modelo del Catálogo
          </label>

          {loadingDevices ? (
            <p style={{ color: '#86868b', fontSize: '13px' }}>Cargando modelos disponibles...</p>
          ) : devices.length === 0 ? (
            <div style={{ padding: '16px', background: 'rgba(255, 149, 0, 0.08)', borderRadius: '14px', border: '1px solid rgba(255, 149, 0, 0.2)', fontSize: '13px', color: '#ff9500' }}>
              No hay dispositivos registrados para este tipo. Contactá al administrador.
            </div>
          ) : (
            <>
              {/* Buscador */}
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <Search size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#86868b' }} />
                <input
                  type="text"
                  className="input-field"
                  placeholder="Buscar por marca, modelo o año..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingLeft: '36px', fontSize: '13px' }}
                />
              </div>

              {/* Lista de devices */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                {filteredDevices.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#86868b', textAlign: 'center', padding: '16px', gridColumn: '1 / -1' }}>
                    Sin resultados para "{search}"
                  </p>
                ) : filteredDevices.map((dev) => {
                  const isSelected = selectedDeviceId === dev.id;
                  return (
                    <div
                      key={dev.id}
                      onClick={() => { setSelectedDeviceId(dev.id); setIdempotencyKey(null); }}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '14px',
                        border: `1px solid ${isSelected ? '#0071e3' : 'rgba(0, 0, 0, 0.08)'}`,
                        background: isSelected ? 'rgba(0, 113, 227, 0.04)' : '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: isSelected ? '#0071e3' : '#1d1d1f' }}>
                          {dev.brand_name} {dev.model}
                        </span>
                        {dev.year && (
                          <span style={{ fontSize: '12px', color: '#86868b', marginLeft: '8px' }}>
                            ({dev.year})
                          </span>
                        )}
                        {dev.description && (
                          <p style={{ fontSize: '12px', color: '#86868b', margin: '2px 0 0' }}>{dev.description}</p>
                        )}
                      </div>
                      <div style={{
                        width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${isSelected ? '#0071e3' : '#86868b'}`,
                        background: isSelected ? '#0071e3' : 'transparent',
                        transition: 'all 0.2s ease',
                      }} />
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Step 3 — Condición */}
        <div>
          <label style={{ fontSize: '14px', fontWeight: 600, color: '#1d1d1f', display: 'block', marginBottom: '12px' }}>
            3. Condición Declarada del Equipo
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {CONDITIONS.map((cond) => {
              const isSelected = condition === cond.id;
              return (
                <div
                  key={cond.id}
                  onClick={() => { setCondition(cond.id); setIdempotencyKey(null); }}
                  style={{
                    padding: '14px 18px', borderRadius: '14px',
                    background: isSelected ? 'rgba(0, 113, 227, 0.04)' : '#ffffff',
                    border: `1px solid ${isSelected ? '#0071e3' : 'rgba(0, 0, 0, 0.08)'}`,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: isSelected ? '#0071e3' : '#1d1d1f' }}>{cond.label}</p>
                    <p style={{ fontSize: '12px', color: '#86868b', marginTop: '2px' }}>{cond.desc}</p>
                  </div>
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '50%',
                    border: `2px solid ${isSelected ? '#0071e3' : '#86868b'}`,
                    background: isSelected ? '#0071e3' : 'transparent',
                    transition: 'all 0.2s ease',
                  }} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary del device seleccionado */}
        {selectedDevice && (
          <div style={{ background: 'rgba(52, 199, 89, 0.08)', border: '1px solid rgba(52, 199, 89, 0.2)', borderRadius: '14px', padding: '14px 18px', fontSize: '13px', color: '#248a3d' }}>
            <strong>Equipo seleccionado:</strong> {selectedDevice.brand_name} {selectedDevice.model}
            {selectedDevice.year ? ` (${selectedDevice.year})` : ''} — {selectedDevice.device_type_name}
          </div>
        )}

        <button
          type="submit"
          className="btn-primary"
          disabled={loading || loadingTypes || !selectedDeviceId}
          style={{ padding: '14px', fontSize: '15px', width: '100%', marginTop: '8px' }}
        >
          {loading ? 'Calculando Cotización...' : 'Calcular Precio de Cotización (Bs.)'}
        </button>
      </form>
    </div>
  );
};
