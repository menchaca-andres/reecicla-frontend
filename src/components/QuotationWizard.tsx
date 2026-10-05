import React, { useEffect, useState } from 'react';
import { Package, Sparkles, AlertCircle, Search } from 'lucide-react';
import type { QuoteRequest, Quote, DeviceType, Device } from '../types';
import { ApiService } from '../services/api';

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
      const res = await ApiService.createQuote(quoteData, token);
      onQuoteCreated(res.quote);
    } catch (err: any) {
      setError(err.message || 'Error al calcular la cotización');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '32px', maxWidth: '700px', margin: '0 auto', background: '#ffffff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '12px', color: '#2563eb', border: '1px solid #bfdbfe' }}>
          <Sparkles size={22} />
        </div>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Solicitar Cotización de Equipo</h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>Seleccioná el equipo del catálogo y su condición actual</p>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

        {/* Step 1 — Tipo de dispositivo */}
        <div>
          <label style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '10px' }}>
            1. Tipo de Dispositivo
          </label>
          {loadingTypes ? (
            <p role="status" style={{ color: '#64748b', fontSize: '13px' }}>Cargando tipos de equipo...</p>
          ) : deviceTypes.length === 0 ? (
            <p role="status" style={{ color: '#64748b', fontSize: '13px' }}>No hay tipos activos disponibles.</p>
          ) : (
            <div className="device-grid">
              {deviceTypes.map((dev) => {
                const isSelected = selectedTypeCode === dev.code;
                return (
                  <button
                    type="button"
                    key={dev.id}
                    className={`device-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedTypeCode(dev.code)}
                    aria-pressed={isSelected}
                    style={{ color: 'inherit', font: 'inherit' }}
                  >
                    <Package size={26} color={isSelected ? '#2563eb' : '#64748b'} style={{ marginBottom: '6px' }} />
                    <span style={{ fontSize: '12px', fontWeight: 600, textAlign: 'center', color: isSelected ? '#1e293b' : '#64748b' }}>
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
          <label style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '10px' }}>
            2. Seleccionar Modelo del Catálogo
          </label>

          {loadingDevices ? (
            <p style={{ color: '#64748b', fontSize: '13px' }}>Cargando modelos disponibles...</p>
          ) : devices.length === 0 ? (
            <div style={{ padding: '16px', background: '#fef9c3', borderRadius: '8px', border: '1px solid #fde047', fontSize: '13px', color: '#854d0e' }}>
              No hay dispositivos registrados para este tipo. Contactá al administrador.
            </div>
          ) : (
            <>
              {/* Buscador */}
              <div style={{ position: 'relative', marginBottom: '10px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  className="input-field"
                  placeholder="Buscar por marca, modelo o año..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingLeft: '30px', fontSize: '13px' }}
                />
              </div>

              {/* Lista de devices */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                {filteredDevices.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '12px' }}>
                    Sin resultados para "{search}"
                  </p>
                ) : filteredDevices.map((dev) => {
                  const isSelected = selectedDeviceId === dev.id;
                  return (
                    <div
                      key={dev.id}
                      onClick={() => setSelectedDeviceId(dev.id)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: `1px solid ${isSelected ? '#2563eb' : '#e2e8f0'}`,
                        background: isSelected ? '#eff6ff' : '#f8fafc',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.12s ease',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? '#1d4ed8' : '#1e293b' }}>
                          {dev.brand_name} {dev.model}
                        </span>
                        {dev.year && (
                          <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '8px' }}>
                            ({dev.year})
                          </span>
                        )}
                        {dev.description && (
                          <p style={{ fontSize: '11px', color: '#94a3b8', margin: '1px 0 0' }}>{dev.description}</p>
                        )}
                      </div>
                      <div style={{
                        width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${isSelected ? '#2563eb' : '#94a3b8'}`,
                        background: isSelected ? '#2563eb' : 'transparent',
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
          <label style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '10px' }}>
            3. Condición Declarada del Equipo
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {CONDITIONS.map((cond) => {
              const isSelected = condition === cond.id;
              return (
                <div
                  key={cond.id}
                  onClick={() => setCondition(cond.id)}
                  style={{
                    padding: '12px 16px', borderRadius: '10px',
                    background: isSelected ? '#f8fafc' : '#ffffff',
                    border: `1px solid ${isSelected ? cond.accent : '#e2e8f0'}`,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? cond.accent : '#1e293b' }}>{cond.label}</p>
                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '1px' }}>{cond.desc}</p>
                  </div>
                  <div style={{
                    width: '16px', height: '16px', borderRadius: '50%',
                    border: `2px solid ${isSelected ? cond.accent : '#94a3b8'}`,
                    background: isSelected ? cond.accent : 'transparent',
                  }} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary del device seleccionado */}
        {selectedDevice && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', color: '#15803d' }}>
            <strong>Equipo seleccionado:</strong> {selectedDevice.brand_name} {selectedDevice.model}
            {selectedDevice.year ? ` (${selectedDevice.year})` : ''} — {selectedDevice.device_type_name}
          </div>
        )}

        <button
          type="submit"
          className="btn-primary"
          disabled={loading || loadingTypes || !selectedDeviceId}
          style={{ padding: '14px', fontSize: '15px', width: '100%', marginTop: '6px' }}
        >
          {loading ? 'Calculando Cotización...' : 'Calcular Precio de Cotización (Bs.)'}
        </button>
      </form>
    </div>
  );
};
