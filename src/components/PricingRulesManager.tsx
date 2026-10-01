import React, { useState, useEffect, useCallback } from 'react';
import { Settings, Save, AlertCircle, CheckCircle2, RefreshCw, Tag, Cpu } from 'lucide-react';
import { ApiService } from '../services/api';
import type { PricingRule } from '../types';

interface PricingRulesManagerProps {
  tenantId: string;
  token: string | null;
}

const DEVICE_LABELS: Record<string, string> = {
  refrigerator: 'Refrigerador',
  washing_machine: 'Lavadora',
  tv: 'Televisor',
  laptop: 'Laptop',
  smartphone: 'Smartphone',
};

const RULE_KEY_LABELS: Record<string, string> = {
  base_price: 'Precio Base',
  condition_adjustment: 'Ajuste por Condición',
};

function formatRuleValue(ruleKey: string, value: any): string {
  if (!value) return '—';
  if (ruleKey === 'base_price') {
    return `${value.amount} ${value.currency ?? 'Bs.'}`;
  }
  if (ruleKey === 'condition_adjustment') {
    const parts = [];
    if (value.working !== undefined) parts.push(`Excelente: ${value.working >= 0 ? '+' : ''}${value.working}`);
    if (value.damaged !== undefined) parts.push(`Detalles: ${value.damaged >= 0 ? '+' : ''}${value.damaged}`);
    if (value.broken !== undefined) parts.push(`Averiado: ${value.broken >= 0 ? '+' : ''}${value.broken}`);
    return parts.join(' / ');
  }
  return JSON.stringify(value);
}

export const PricingRulesManager: React.FC<PricingRulesManagerProps> = ({ tenantId, token }) => {
  const [deviceType, setDeviceType] = useState('refrigerator');
  const [basePriceAmount, setBasePriceAmount] = useState<number>(1400);
  const [workingAdj, setWorkingAdj] = useState<string>('0');
  const [damagedAdj, setDamagedAdj] = useState<string>('-350');
  const [brokenAdj, setBrokenAdj] = useState<string>('-700');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [rules, setRules] = useState<PricingRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(false);

  const loadRules = useCallback(async () => {
    if (!token) return;
    setRulesLoading(true);
    try {
      const res = await ApiService.getRules(tenantId, token);
      setRules(res.rules);
    } catch {
      // silently fail — table just stays empty
    } finally {
      setRulesLoading(false);
    }
  }, [tenantId, token]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      await ApiService.defineRule({
        tenant_id: tenantId,
        device_type: deviceType,
        rule_key: 'base_price',
        rule_value: { amount: basePriceAmount, currency: 'Bs' },
      }, token || undefined);

      await ApiService.defineRule({
        tenant_id: tenantId,
        device_type: deviceType,
        rule_key: 'condition_adjustment',
        rule_value: {
          working: Number(workingAdj),
          damaged: Number(damagedAdj),
          broken: Number(brokenAdj),
        },
      }, token || undefined);

      setMessage(`Reglas para "${DEVICE_LABELS[deviceType] ?? deviceType}" actualizadas.`);
      loadRules(); // refresh table
    } catch (err: any) {
      setError(err.message || 'Error al guardar las reglas');
    } finally {
      setLoading(false);
    }
  };

  // Group rules by device_type for display
  const groupedRules = rules.reduce<Record<string, PricingRule[]>>((acc, rule) => {
    if (!acc[rule.device_type]) acc[rule.device_type] = [];
    acc[rule.device_type].push(rule);
    return acc;
  }, {});

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* ── FORM ── */}
      <div className="glass-panel" style={{ padding: '32px', background: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '12px', color: '#2563eb', border: '1px solid #bfdbfe' }}>
            <Settings size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Reglas de Valoración</h2>
            <p style={{ fontSize: '13px', color: '#64748b' }}>Configura precios base y descuentos por condición (Bs.)</p>
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
            <select className="input-field" value={deviceType} onChange={(e) => setDeviceType(e.target.value)}>
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
                <input type="text" inputMode="numeric" className="input-field" value={workingAdj} onChange={(e) => setWorkingAdj(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Detalles (damaged)</label>
                <input type="text" inputMode="numeric" className="input-field" value={damagedAdj} onChange={(e) => setDamagedAdj(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Averiado (broken)</label>
                <input type="text" inputMode="numeric" className="input-field" value={brokenAdj} onChange={(e) => setBrokenAdj(e.target.value)} />
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '12px', marginTop: '4px' }}>
            <Save size={16} /> {loading ? 'Guardando...' : 'Guardar Regla'}
          </button>
        </form>
      </div>

      {/* ── RULES TABLE ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tag size={16} color="#2563eb" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Reglas Configuradas
            </h3>
            {rules.length > 0 && (
              <span style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '20px', fontSize: '11px', fontWeight: 700, padding: '2px 8px' }}>
                {rules.length}
              </span>
            )}
          </div>
          <button
            onClick={loadRules}
            disabled={rulesLoading}
            title="Actualizar"
            style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}
          >
            <RefreshCw size={13} style={{ animation: rulesLoading ? 'spin 1s linear infinite' : 'none' }} />
            Actualizar
          </button>
        </div>

        {rulesLoading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', fontSize: '13px' }}>
            Cargando reglas...
          </div>
        ) : rules.length === 0 ? (
          <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', background: '#f8fafc' }}>
            <Settings size={28} color="#cbd5e1" style={{ marginBottom: '8px' }} />
            <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
              Aún no hay reglas configuradas para este tenant.
            </p>
          </div>
        ) : (
          Object.entries(groupedRules).map(([device, deviceRules]) => (
            <div key={device} className="glass-panel" style={{ marginBottom: '12px', padding: '0', overflow: 'hidden', background: '#ffffff' }}>
              {/* Device header */}
              <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={14} color="#2563eb" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  {DEVICE_LABELS[device] ?? device}
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>({device})</span>
              </div>

              {/* Rules rows */}
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '8px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Tipo de Regla</th>
                    <th style={{ padding: '8px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Valor</th>
                    <th style={{ padding: '8px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Actualizada</th>
                  </tr>
                </thead>
                <tbody>
                  {deviceRules.map((rule, i) => (
                    <tr key={rule.id} style={{ borderBottom: i < deviceRules.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <td style={{ padding: '11px 16px', fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                        {RULE_KEY_LABELS[rule.rule_key] ?? rule.rule_key}
                      </td>
                      <td style={{ padding: '11px 16px', fontSize: '12px', color: '#334155', fontFamily: 'monospace', background: '#fafafa' }}>
                        {formatRuleValue(rule.rule_key, rule.rule_value)}
                      </td>
                      <td style={{ padding: '11px 16px', fontSize: '11px', color: '#94a3b8' }}>
                        {new Date(rule.updated_at).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
