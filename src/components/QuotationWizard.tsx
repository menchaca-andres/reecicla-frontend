import React, { useState } from 'react';
import { Refrigerator, WashingMachine, Tv, Smartphone, Laptop, Sparkles, AlertCircle } from 'lucide-react';
import type { QuoteRequest, Quote } from '../types';
import { ApiService } from '../services/api';

interface QuotationWizardProps {
  tenantId: string;
  token: string | null;
  onQuoteCreated: (quote: Quote) => void;
  onNeedAuth: () => void;
}

const DEVICE_TYPES = [
  { id: 'refrigerator', label: 'Refrigerador / Heladera', icon: Refrigerator },
  { id: 'washing_machine', label: 'Lavadora / Lavarropas', icon: WashingMachine },
  { id: 'tv', label: 'Televisor / Smart TV', icon: Tv },
  { id: 'laptop', label: 'Notebook / Laptop', icon: Laptop },
  { id: 'smartphone', label: 'Celular / Smartphone', icon: Smartphone },
];

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
  const [deviceType, setDeviceType] = useState('refrigerator');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number>(2021);
  const [condition, setCondition] = useState('working');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      onNeedAuth();
      return;
    }

    setLoading(true);
    try {
      const quoteData: QuoteRequest = {
        tenant_id: tenantId,
        device_type: deviceType,
        brand: brand || undefined,
        model: model || undefined,
        year: year || undefined,
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
          <p style={{ fontSize: '13px', color: '#64748b' }}>Ingresa las características de tu electrodoméstico o dispositivo</p>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        {/* 1. Seleccionar Tipo de Dispositivo */}
        <div>
          <label style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '10px' }}>
            1. Tipo de Dispositivo
          </label>
          <div className="device-grid">
            {DEVICE_TYPES.map((dev) => {
              const IconComp = dev.icon;
              const isSelected = deviceType === dev.id;
              return (
                <div
                  key={dev.id}
                  className={`device-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setDeviceType(dev.id)}
                >
                  <IconComp size={26} color={isSelected ? '#2563eb' : '#64748b'} style={{ marginBottom: '6px' }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, textAlign: 'center', color: isSelected ? '#1e293b' : '#64748b' }}>
                    {dev.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Marca, Modelo y Año */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 110px', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
              Marca
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Ej. Samsung, LG"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
              Modelo
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Ej. No Frost 400L"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
              Año
            </label>
            <input
              type="number"
              className="input-field"
              min={2000}
              max={2026}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </div>
        </div>

        {/* 3. Condición / Estado */}
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
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: isSelected ? '#f8fafc' : '#ffffff',
                    border: `1px solid ${isSelected ? cond.accent : '#e2e8f0'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? cond.accent : '#1e293b' }}>{cond.label}</p>
                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '1px' }}>{cond.desc}</p>
                  </div>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    border: `2px solid ${isSelected ? cond.accent : '#94a3b8'}`,
                    background: isSelected ? cond.accent : 'transparent',
                  }} />
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
          style={{ padding: '14px', fontSize: '15px', width: '100%', marginTop: '6px' }}
        >
          {loading ? 'Calculando Cotización...' : 'Calcular Precio de Cotización (Bs.)'}
        </button>
      </form>
    </div>
  );
};
