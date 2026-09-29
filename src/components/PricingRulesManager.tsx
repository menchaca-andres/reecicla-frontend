import React, { useState } from 'react';
import { Settings, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ApiService } from '../services/api';

interface PricingRulesManagerProps {
  tenantId: string;
  token: string | null;
}

export const PricingRulesManager: React.FC<PricingRulesManagerProps> = ({ tenantId, token }) => {
  const [deviceType, setDeviceType] = useState('refrigerator');
  const [basePriceAmount, setBasePriceAmount] = useState<number>(1400); // 1400 Bs. (~200 USD)
  const [workingAdj, setWorkingAdj] = useState<number>(0);
  const [damagedAdj, setDamagedAdj] = useState<number>(-350);
  const [brokenAdj, setBrokenAdj] = useState<number>(-700);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      // Regla 1: base_price
      await ApiService.defineRule({
        tenant_id: tenantId,
        device_type: deviceType,
        rule_key: 'base_price',
        rule_value: { amount: basePriceAmount, currency: 'Bs' },
      }, token || undefined);

      // Regla 2: condition_adjustment
      await ApiService.defineRule({
        tenant_id: tenantId,
        device_type: deviceType,
        rule_key: 'condition_adjustment',
        rule_value: { working: workingAdj, damaged: damagedAdj, broken: brokenAdj },
      }, token || undefined);

      setMessage(`¡Reglas de valoración para ${deviceType} actualizadas exitosamente!`);
    } catch (err: any) {
      setError(err.message || 'Error al guardar las reglas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '32px', maxWidth: '640px', margin: '0 auto', background: '#ffffff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '12px', color: '#2563eb', border: '1px solid #bfdbfe' }}>
          <Settings size={22} />
        </div>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Reglas de Valoración (HU-004)</h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>Configura precios base y descuentos por condición para el tenant en Bolivianos (Bs.)</p>
        </div>
      </div>

      {message && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} /> {message}
        </div>
      )}

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
            Dispositivo a Configurar
          </label>
          <select
            className="input-field"
            value={deviceType}
            onChange={(e) => setDeviceType(e.target.value)}
          >
            <option value="refrigerator">Refrigerador / Heladera</option>
            <option value="washing_machine">Lavadora / Lavarropas</option>
            <option value="tv">Televisor / Smart TV</option>
            <option value="laptop">Notebook / Laptop</option>
            <option value="smartphone">Celular / Smartphone</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
            Precio Base (Bs.)
          </label>
          <input
            type="number"
            className="input-field"
            value={basePriceAmount}
            onChange={(e) => setBasePriceAmount(Number(e.target.value))}
            required
          />
        </div>

        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>
            Ajustes por Condición (Bs.)
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Excelente (working)</label>
              <input
                type="number"
                className="input-field"
                value={workingAdj}
                onChange={(e) => setWorkingAdj(Number(e.target.value))}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Detalles (damaged)</label>
              <input
                type="number"
                className="input-field"
                value={damagedAdj}
                onChange={(e) => setDamagedAdj(Number(e.target.value))}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Averiado (broken)</label>
              <input
                type="number"
                className="input-field"
                value={brokenAdj}
                onChange={(e) => setBrokenAdj(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '12px', marginTop: '6px' }}>
          <Save size={16} /> {loading ? 'Guardando...' : 'Guardar Regla en DB'}
        </button>
      </form>
    </div>
  );
};
