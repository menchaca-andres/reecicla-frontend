import React, { useState, useEffect, useCallback } from 'react';
import { Settings, Save, AlertCircle, CheckCircle2, RefreshCw, Tag, Cpu } from 'lucide-react';
import { ApiService } from '../../../services/api';
import type { PricingRule, DeviceBrand, Device } from '../../../types';
import styles from '../PricingRulesManager.module.css';

interface PricingRulesManagerProps {
  tenantId: string;
  token: string | null;
}

const DEFAULT_DEVICE_TYPES = [
  { code: 'refrigerator', name: 'Refrigerador / Heladera' },
  { code: 'washing_machine', name: 'Lavadora / Lavarropas' },
  { code: 'tv', name: 'Televisor / Smart TV' },
  { code: 'laptop', name: 'Notebook / Laptop' },
  { code: 'smartphone', name: 'Celular / Smartphone' },
];

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
  const [deviceTypes, setDeviceTypes] = useState<Array<{ id?: string; code: string; name: string }>>(DEFAULT_DEVICE_TYPES);
  const [brands, setBrands] = useState<DeviceBrand[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');

  // Form State
  const [deviceType, setDeviceType] = useState('refrigerator');
  const [selectedBrandName, setSelectedBrandName] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<string>('');
  const [basePriceAmount, setBasePriceAmount] = useState<number>(1400);
  const [workingAdj, setWorkingAdj] = useState<string>('0');
  const [damagedAdj, setDamagedAdj] = useState<string>('-350');
  const [brokenAdj, setBrokenAdj] = useState<string>('-700');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [rules, setRules] = useState<PricingRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(false);

  // Load catalog device types and brands
  useEffect(() => {
    ApiService.getDeviceTypes(tenantId, token, false)
      .then((res) => {
        if (res.device_types && res.device_types.length > 0) {
          setDeviceTypes(res.device_types.map((dt) => ({ id: dt.id, code: dt.code, name: dt.name })));
        }
      })
      .catch(() => undefined);
  }, [tenantId, token]);

  // Load brands when device type changes
  useEffect(() => {
    const currentDt = deviceTypes.find((dt) => dt.code === deviceType);
    setSelectedBrandId('');
    setSelectedBrandName('');
    setDevices([]);
    setModel('');
    if (currentDt?.id) {
      ApiService.getBrands(tenantId, currentDt.id, token)
        .then((res) => setBrands(res.brands))
        .catch(() => setBrands([]));
    } else {
      setBrands([]);
    }
  }, [tenantId, token, deviceType, deviceTypes]);

  // Load devices (models) when brand changes
  useEffect(() => {
    setModel('');
    if (!selectedBrandId) {
      setDevices([]);
      return;
    }
    const currentDt = deviceTypes.find((dt) => dt.code === deviceType);
    ApiService.getDevices(tenantId, currentDt?.id, token, false)
      .then((res) => {
        const filtered = res.devices.filter((d) => d.brand_id === selectedBrandId);
        setDevices(filtered);
      })
      .catch(() => setDevices([]));
  }, [tenantId, token, selectedBrandId, deviceType, deviceTypes]);

  const loadRules = useCallback(async () => {
    if (!token) return;
    setRulesLoading(true);
    try {
      const res = await ApiService.getRules(tenantId, token);
      setRules(res.rules);
    } catch {
      // silently fail — table stays empty
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

    const payloadMeta = {
      tenant_id: tenantId,
      device_type: deviceType,
      brand_id: selectedBrandId || undefined,
      brand_name: selectedBrandName.trim() || undefined,
      model: model.trim() || undefined,
      min_year: year ? Number(year) : undefined,
      max_year: year ? Number(year) : undefined,
    };

    try {
      await ApiService.defineRule({
        ...payloadMeta,
        rule_key: 'base_price',
        rule_value: { amount: basePriceAmount, currency: 'Bs' },
      }, token || undefined);

      await ApiService.defineRule({
        ...payloadMeta,
        rule_key: 'condition_adjustment',
        rule_value: {
          working: Number(workingAdj),
          damaged: Number(damagedAdj),
          broken: Number(brokenAdj),
        },
      }, token || undefined);

      const criteriaDesc = [
        `Tipo: ${deviceTypes.find((dt) => dt.code === deviceType)?.name || deviceType}`,
        selectedBrandName ? `Marca: ${selectedBrandName}` : null,
        model ? `Modelo: ${model}` : null,
        year ? `Año: ${year}` : null,
      ].filter(Boolean).join(' | ');

      setMessage(`Regla guardada exitosamente (${criteriaDesc}).`);
      loadRules();
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
    <div className={styles.container}>

      {/* ── FORM ── */}
      <div className={`glass-panel ${styles.formCard}`}>
        <div className={styles.headerRow}>
          <div className={styles.headerIcon}>
            <Settings size={22} />
          </div>
          <div>
            <h2 className={styles.title}>Reglas de Valoración</h2>
            <p className={styles.subtitle}>Configura precios base y descuentos por tipo, marca, modelo y año (Bs.)</p>
          </div>
        </div>

        {message && (
          <div className={styles.alertSuccess}>
            <CheckCircle2 size={16} /> {message}
          </div>
        )}
        {error && (
          <div className={styles.alertError}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSave} className={styles.form}>
          <div className={styles.grid2}>
            <div>
              <label className={styles.label}>
                Tipo de Dispositivo *
              </label>
              <select className="input-field" value={deviceType} onChange={(e) => {
                setDeviceType(e.target.value);
                setSelectedBrandName('');
              }}>
                {deviceTypes.map((dt) => (
                  <option key={dt.code} value={dt.code}>{dt.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={styles.label}>
                Marca (Opcional)
              </label>
              {brands.length > 0 ? (
                <select className="input-field" value={selectedBrandId} onChange={(e) => {
                  const brand = brands.find((b) => b.id === e.target.value);
                  setSelectedBrandId(e.target.value);
                  setSelectedBrandName(brand?.name ?? '');
                }}>
                  <option value="">-- Todas las Marcas --</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ej: Samsung, Lenovo"
                  value={selectedBrandName}
                  onChange={(e) => setSelectedBrandName(e.target.value)}
                />
              )}
            </div>
          </div>

          <div className={styles.grid2_1}>
            <div>
              <label className={styles.label}>
                Modelo Específico (Opcional)
              </label>
              {devices.length > 0 ? (
                <select className="input-field" value={model} onChange={(e) => setModel(e.target.value)}>
                  <option value="">-- Todos los Modelos --</option>
                  {devices.map((d) => (
                    <option key={d.id} value={d.model}>{d.model}{d.year ? ` (${d.year})` : ''}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="input-field"
                  placeholder={selectedBrandId ? 'Sin modelos registrados para esta marca' : 'Ej: Galaxy S23, ThinkPad T14'}
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  disabled={!!selectedBrandId && devices.length === 0}
                />
              )}
            </div>

            <div>
              <label className={styles.label}>
                Año (Opcional)
              </label>
              <input
                type="number"
                className="input-field"
                placeholder="Ej: 2023"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={styles.label}>
              Precio Base (Bs.) *
            </label>
            <input
              type="number"
              className="input-field"
              value={basePriceAmount}
              onChange={(e) => setBasePriceAmount(Number(e.target.value))}
              required
            />
          </div>

          <div className={styles.conditionSection}>
            <h4 className={styles.conditionTitle}>
              Ajustes por Condición (Bs.)
            </h4>
            <div className={styles.grid3}>
              <div>
                <label className={styles.labelSmall}>Excelente (working)</label>
                <input type="text" inputMode="numeric" className="input-field" value={workingAdj} onChange={(e) => setWorkingAdj(e.target.value)} />
              </div>
              <div>
                <label className={styles.labelSmall}>Detalles (damaged)</label>
                <input type="text" inputMode="numeric" className="input-field" value={damagedAdj} onChange={(e) => setDamagedAdj(e.target.value)} />
              </div>
              <div>
                <label className={styles.labelSmall}>Averiado (broken)</label>
                <input type="text" inputMode="numeric" className="input-field" value={brokenAdj} onChange={(e) => setBrokenAdj(e.target.value)} />
              </div>
            </div>
          </div>

          <button type="submit" className={`btn-primary ${styles.saveBtn}`} disabled={loading}>
            <Save size={16} /> {loading ? 'Guardando...' : 'Guardar Regla de Valoración'}
          </button>
        </form>
      </div>

      {/* ── RULES TABLE ── */}
      <div>
        <div className={styles.rulesHeader}>
          <div className={styles.rulesHeaderLeft}>
            <Tag size={16} color="#2563eb" />
            <h3 className={styles.sectionTitle}>
              Reglas Configuradas
            </h3>
            {rules.length > 0 && (
              <span className={styles.countBadge}>
                {rules.length}
              </span>
            )}
          </div>
          <button
            onClick={loadRules}
            disabled={rulesLoading}
            title="Actualizar"
            className={styles.refreshBtn}
          >
            <RefreshCw size={13} style={{ animation: rulesLoading ? 'spin 1s linear infinite' : 'none' }} />
            Actualizar
          </button>
        </div>

        {rulesLoading ? (
          <div className={styles.loadingText}>
            Cargando reglas...
          </div>
        ) : rules.length === 0 ? (
          <div className={`glass-panel ${styles.emptyCard}`}>
            <Settings size={28} color="#cbd5e1" style={{ marginBottom: '8px' }} />
            <p className={styles.emptyText}>
              Aún no hay reglas configuradas para este tenant.
            </p>
          </div>
        ) : (
          Object.entries(groupedRules).map(([device, deviceRules]) => (
            <div key={device} className={`glass-panel ${styles.deviceGroupCard}`}>
              {/* Device header */}
              <div className={styles.deviceHeader}>
                <Cpu size={14} color="#2563eb" />
                <span className={styles.deviceName}>
                  {deviceTypes.find((dt) => dt.code === device)?.name || device}
                </span>
                <span className={styles.deviceCode}>({device})</span>
              </div>

              {/* Rules rows */}
              <table className={styles.table}>
                <thead>
                  <tr className={styles.theadTr}>
                    <th className={styles.th}>Criterios Específicos</th>
                    <th className={styles.th}>Tipo de Regla</th>
                    <th className={styles.th}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {deviceRules.map((rule, i) => (
                    <tr key={rule.id} className={styles.tbodyTr} style={{ borderBottom: i < deviceRules.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <td className={styles.td}>
                        <div className={styles.criteriaWrapper}>
                          <span className={styles.brandText}>
                            {rule.brand_name || 'Todas las marcas'}
                          </span>
                          {rule.model && (
                            <span className={styles.modelBadge}>
                              Mod: {rule.model}
                            </span>
                          )}
                          {(rule.min_year || rule.max_year) && (
                            <span className={styles.yearBadge}>
                              Años: {rule.min_year || '*'}-{rule.max_year || '*'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={styles.tdBold}>
                        {RULE_KEY_LABELS[rule.rule_key] ?? rule.rule_key}
                      </td>
                      <td className={styles.tdMono}>
                        {formatRuleValue(rule.rule_key, rule.rule_value)}
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
