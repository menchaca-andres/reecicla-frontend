import React, { useState, useEffect, useCallback } from 'react';
import { Cpu, PlusCircle, AlertCircle, CheckCircle2, RefreshCw, Power, Tag, Edit2, X, Check, Package, ClipboardCheck, History, Trash2, Plus } from 'lucide-react';
import { ApiService } from '../services/api';
import type { DeviceType, DeviceBrand, Device, EvaluationRule, ChecklistItem } from '../types';

interface CatalogManagerProps {
  token: string | null;
}

type Tab = 'devices' | 'brands' | 'types' | 'rules';

export const CatalogManager: React.FC<CatalogManagerProps> = ({ token }) => {
  const [activeTab, setActiveTab] = useState<Tab>('devices');

  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ── Types form ──
  const [typeCode, setTypeCode] = useState('');
  const [typeName, setTypeName] = useState('');
  const [typeDesc, setTypeDesc] = useState('');
  const [submittingType, setSubmittingType] = useState(false);
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editTypeName, setEditTypeName] = useState('');
  const [editTypeDesc, setEditTypeDesc] = useState('');

  // ── Brands form ──
  const [selectedTypeForBrand, setSelectedTypeForBrand] = useState('');
  const [brandsForType, setBrandsForType] = useState<DeviceBrand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [submittingBrand, setSubmittingBrand] = useState(false);
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [editBrandName, setEditBrandName] = useState('');

  // ── Devices form ──
  const [devTypeId, setDevTypeId] = useState('');
  const [devBrands, setDevBrands] = useState<DeviceBrand[]>([]);
  const [devBrandId, setDevBrandId] = useState('');
  const [devModel, setDevModel] = useState('');
  const [devYear, setDevYear] = useState<string>('');
  const [devDesc, setDevDesc] = useState('');
  const [submittingDevice, setSubmittingDevice] = useState(false);
  const [devicesFilterType, setDevicesFilterType] = useState('');

  // ── Evaluation Rules (HU-008) ──
  const [selectedTypeForRule, setSelectedTypeForRule] = useState('');
  const [activeRule, setActiveRule] = useState<EvaluationRule | null>(null);
  const [ruleHistory, setRuleHistory] = useState<EvaluationRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showNewRuleForm, setShowNewRuleForm] = useState(false);

  // Form state for creating a new evaluation rule version
  const [newChecklist, setNewChecklist] = useState<ChecklistItem[]>([]);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemType, setNewItemType] = useState<'boolean' | 'number' | 'text'>('boolean');
  const [newItemRequired, setNewItemRequired] = useState(true);
  const [submittingRule, setSubmittingRule] = useState(false);

  // ── Load data ──
  const loadTypes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ApiService.getDeviceTypes(token, true);
      const list = res.device_types || (res as any).deviceTypes || [];
      setDeviceTypes(list);
      if (list.length > 0) {
        if (!selectedTypeForBrand) setSelectedTypeForBrand(list[0].id);
        if (!devTypeId) setDevTypeId(list[0].id);
        if (!selectedTypeForRule) setSelectedTypeForRule(list[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar tipos.');
    } finally {
      setLoading(false);
    }
  }, [token, selectedTypeForBrand, devTypeId, selectedTypeForRule]);

  const loadBrandsForType = useCallback(async (typeId: string) => {
    if (!typeId) return;
    setBrandsLoading(true);
    try {
      const res = await ApiService.getBrands(typeId, token, true);
      setBrandsForType(res.brands || []);
    } catch { setBrandsForType([]); }
    finally { setBrandsLoading(false); }
  }, [token]);

  const loadDevBrandsForType = useCallback(async (typeId: string) => {
    if (!typeId) return;
    try {
      const res = await ApiService.getBrands(typeId, token, false); // active only
      setDevBrands(res.brands || []);
      if ((res.brands || []).length > 0) setDevBrandId(res.brands[0].id);
      else setDevBrandId('');
    } catch { setDevBrands([]); }
  }, [token]);

  const loadDevices = useCallback(async () => {
    try {
      const typeId = devicesFilterType || undefined;
      const res = await ApiService.getDevices(typeId, token, true);
      setDevices(res.devices || []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar dispositivos.');
    }
  }, [token, devicesFilterType]);

  const loadRulesForType = useCallback(async (typeId: string) => {
    if (!typeId) return;
    setRulesLoading(true);
    try {
      const [activeRes, historyRes] = await Promise.all([
        ApiService.getActiveEvaluationRule(typeId, token),
        ApiService.getEvaluationRuleHistory(typeId, token)
      ]);
      setActiveRule(activeRes.rule);
      setRuleHistory(historyRes.rules || []);

      if (activeRes.rule) {
        setNewChecklist(activeRes.rule.checklist || []);
      } else {
        setNewChecklist([]);
      }
    } catch {
      setActiveRule(null);
      setRuleHistory([]);
    } finally {
      setRulesLoading(false);
    }
  }, [token]);

  useEffect(() => { loadTypes(); }, [loadTypes]);
  useEffect(() => { if (selectedTypeForBrand) loadBrandsForType(selectedTypeForBrand); }, [selectedTypeForBrand, loadBrandsForType]);
  useEffect(() => { if (devTypeId) loadDevBrandsForType(devTypeId); }, [devTypeId, loadDevBrandsForType]);
  useEffect(() => { if (activeTab === 'devices') loadDevices(); }, [activeTab, loadDevices]);
  useEffect(() => { if (selectedTypeForRule) loadRulesForType(selectedTypeForRule); }, [selectedTypeForRule, loadRulesForType]);

  const notify = (msg: string, isError = false) => {
    if (isError) setError(msg); else setSuccess(msg);
    setTimeout(() => { setError(null); setSuccess(null); }, 4000);
  };

  // ── Type handlers ──
  const handleCreateType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmittingType(true);
    try {
      const res = await ApiService.createDeviceType({ code: typeCode.trim().toUpperCase(), name: typeName.trim(), description: typeDesc.trim() || undefined }, token);
      notify(`Tipo "${res.device_type.name}" creado.`);
      setTypeCode(''); setTypeName(''); setTypeDesc('');
      loadTypes();
    } catch (err: any) { notify(err.message || 'Error al crear tipo.', true); }
    finally { setSubmittingType(false); }
  };

  const beginEditType = (deviceType: DeviceType) => {
    setEditingTypeId(deviceType.id);
    setEditTypeName(deviceType.name);
    setEditTypeDesc(deviceType.description || '');
  };

  const handleUpdateType = async (id: string) => {
    if (!token || !editTypeName.trim()) return;
    setSubmittingType(true);
    try {
      await ApiService.updateDeviceType(id, {
        name: editTypeName.trim(),
        description: editTypeDesc.trim() || undefined,
      }, token);
      setEditingTypeId(null);
      notify('Tipo de equipo actualizado.');
      await loadTypes();
    } catch (err: any) {
      notify(err.message || 'Error al actualizar el tipo.', true);
    } finally {
      setSubmittingType(false);
    }
  };

  const handleToggleType = async (deviceType: DeviceType) => {
    if (!token) return;
    try {
      if (deviceType.status === 'ACTIVE') {
        await ApiService.inactivateDeviceType(deviceType.id, token);
      } else {
        await ApiService.setDeviceTypeStatus(deviceType.id, 'ACTIVE', token);
      }
      notify(`Tipo "${deviceType.name}" ${deviceType.status === 'ACTIVE' ? 'inactivado' : 'reactivado'}.`);
      await loadTypes();
    } catch (err: any) {
      notify(err.message || 'Error al cambiar el estado del tipo.', true);
    }
  };

  // ── Brand handlers ──
  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedTypeForBrand || !newBrandName.trim()) return;
    setSubmittingBrand(true);
    try {
      await ApiService.createBrand({ device_type_id: selectedTypeForBrand, name: newBrandName.trim() }, token);
      notify(`Marca "${newBrandName.trim()}" agregada.`);
      setNewBrandName('');
      loadBrandsForType(selectedTypeForBrand);
    } catch (err: any) { notify(err.message || 'Error al crear marca.', true); }
    finally { setSubmittingBrand(false); }
  };

  const handleUpdateBrand = async (brandId: string) => {
    if (!token || !editBrandName.trim()) return;
    try {
      await ApiService.updateBrand(brandId, editBrandName.trim(), token);
      notify('Marca actualizada.');
      setEditingBrandId(null);
      loadBrandsForType(selectedTypeForBrand);
    } catch (err: any) { notify(err.message, true); }
  };

  const handleToggleBrand = async (brand: DeviceBrand) => {
    if (!token) return;
    const newStatus = brand.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await ApiService.setBrandStatus(brand.id, newStatus, token);
      notify(`Marca "${brand.name}" ${newStatus === 'ACTIVE' ? 'activada' : 'inactivada'}.`);
      loadBrandsForType(selectedTypeForBrand);
    } catch (err: any) { notify(err.message, true); }
  };

  // ── Device handlers ──
  const handleCreateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !devTypeId || !devBrandId || !devModel.trim()) return;
    setSubmittingDevice(true);
    try {
      const res = await ApiService.createDevice(
        { device_type_id: devTypeId, brand_id: devBrandId, model: devModel.trim(), year: devYear ? parseInt(devYear) : null, description: devDesc.trim() || undefined },
        token
      );
      notify(`Dispositivo "${res.device.brand_name} ${res.device.model}" registrado.`);
      setDevModel(''); setDevYear(''); setDevDesc('');
      loadDevices();
    } catch (err: any) { notify(err.message || 'Error al registrar dispositivo.', true); }
    finally { setSubmittingDevice(false); }
  };

  const handleToggleDevice = async (dev: Device) => {
    if (!token) return;
    const newStatus = dev.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await ApiService.setDeviceStatus(dev.id, newStatus, token);
      notify(`Dispositivo ${newStatus === 'ACTIVE' ? 'activado' : 'inactivado'}.`);
      loadDevices();
    } catch (err: any) { notify(err.message, true); }
  };

  // ── Evaluation Rule handlers (HU-008) ──
  const handleAddItemToChecklist = () => {
    if (!newItemLabel.trim()) return;
    const id = newItemLabel.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    setNewChecklist(prev => [...prev, { id, label: newItemLabel.trim(), type: newItemType, required: newItemRequired }]);
    setNewItemLabel('');
  };

  const handleRemoveChecklistItem = (index: number) => {
    setNewChecklist(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateRuleVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedTypeForRule || newChecklist.length === 0) {
      notify('El checklist debe contener al menos un criterio de evaluación.', true);
      return;
    }
    setSubmittingRule(true);
    try {
      const resale_criteria = activeRule?.resale_criteria || { min_cosmetic_score: 6, must_power_on: true };
      const recycle_criteria = activeRule?.recycle_criteria || { accept_damaged: true, recycle_components: true };

      const res = await ApiService.createEvaluationRuleVersion({
        device_type_id: selectedTypeForRule,
        checklist: newChecklist,
        resale_criteria,
        recycle_criteria
      }, token);

      notify(`Nueva versión v${res.rule.version} creada y marcada como activa.`);
      setShowNewRuleForm(false);
      loadRulesForType(selectedTypeForRule);
    } catch (err: any) {
      notify(err.message || 'Error al crear la versión de regla de evaluación.', true);
    } finally {
      setSubmittingRule(false);
    }
  };

  const tabStyle = (t: Tab) => ({
    padding: '8px 16px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: 'none', cursor: 'pointer',
    background: activeTab === t ? '#2563eb' : 'transparent',
    color: activeTab === t ? '#ffffff' : '#64748b',
    transition: 'all 0.15s ease',
    display: 'flex', alignItems: 'center', gap: '6px',
  });

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '12px', color: '#2563eb', border: '1px solid #bfdbfe' }}>
            <Cpu size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Gestión de Catálogo</h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Dispositivos · Marcas · Tipos · Reglas de Evaluación</p>
          </div>
        </div>
        <button
          onClick={() => {
            loadTypes();
            if (activeTab === 'brands' && selectedTypeForBrand) loadBrandsForType(selectedTypeForBrand);
            if (activeTab === 'devices') loadDevices();
            if (activeTab === 'rules' && selectedTypeForRule) loadRulesForType(selectedTypeForRule);
          }}
          disabled={loading}
          style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
        >
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Actualizar
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} /> {success}
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
        <button style={tabStyle('devices')} onClick={() => setActiveTab('devices')}>
          <Package size={15} /> Dispositivos
        </button>
        <button style={tabStyle('brands')} onClick={() => setActiveTab('brands')}>
          <Tag size={15} /> Marcas por Tipo
        </button>
        <button style={tabStyle('types')} onClick={() => setActiveTab('types')}>
          <Cpu size={15} /> Tipos de Equipo
        </button>
        <button style={tabStyle('rules')} onClick={() => setActiveTab('rules')}>
          <ClipboardCheck size={15} /> Reglas de Evaluación
        </button>
      </div>

      {/* TAB 1: DEVICES */}
      {activeTab === 'devices' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Create Device Form */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PlusCircle size={18} color="#2563eb" /> Registrar Nuevo Dispositivo en Catálogo
            </h3>
            <form onSubmit={handleCreateDevice} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Tipo de Equipo *</label>
                <select
                  value={devTypeId}
                  onChange={(e) => setDevTypeId(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  {deviceTypes.filter(t => t.status === 'ACTIVE').map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Marca *</label>
                <select
                  value={devBrandId}
                  onChange={(e) => setDevBrandId(e.target.value)}
                  required
                  disabled={devBrands.length === 0}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
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
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Modelo *</label>
                <input
                  type="text"
                  placeholder="Ej. Galaxy S23, XPS 15 9530"
                  value={devModel}
                  onChange={(e) => setDevModel(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Año de Lanzamiento</label>
                <input
                  type="number"
                  placeholder="Ej. 2023"
                  min="2000"
                  max="2030"
                  value={devYear}
                  onChange={(e) => setDevYear(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Descripción / Especificaciones</label>
                <input
                  type="text"
                  placeholder="Ej. Smartphone flagship 128GB"
                  value={devDesc}
                  onChange={(e) => setDevDesc(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ gridColumn: 'span 3', display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button
                  type="submit"
                  disabled={submittingDevice || !devBrandId}
                  style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {submittingDevice ? 'Guardando...' : 'Registrar Dispositivo'}
                </button>
              </div>
            </form>
          </div>

          {/* List Devices */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: 0 }}>Catálogo de Dispositivos Registrados</h3>
              <select
                value={devicesFilterType}
                onChange={(e) => setDevicesFilterType(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
              >
                <option value="">Todos los tipos</option>
                {deviceTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {devices.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>No hay dispositivos registrados.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b', fontSize: '12px' }}>
                    <th style={{ padding: '10px 12px' }}>Tipo</th>
                    <th style={{ padding: '10px 12px' }}>Marca</th>
                    <th style={{ padding: '10px 12px' }}>Modelo</th>
                    <th style={{ padding: '10px 12px' }}>Año</th>
                    <th style={{ padding: '10px 12px' }}>Estado</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((dev) => (
                    <tr key={dev.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 500, color: '#334155' }}>{dev.device_type_name || '—'}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f172a' }}>{dev.brand_name || '—'}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#2563eb' }}>{dev.model}</td>
                      <td style={{ padding: '10px 12px', color: '#64748b' }}>{dev.year || 'N/A'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                          background: dev.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9',
                          color: dev.status === 'ACTIVE' ? '#15803d' : '#64748b'
                        }}>
                          {dev.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleToggleDevice(dev)}
                          title={dev.status === 'ACTIVE' ? 'Inactivar' : 'Activar'}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: dev.status === 'ACTIVE' ? '#ef4444' : '#22c55e' }}
                        >
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
      )}

      {/* TAB 2: BRANDS */}
      {activeTab === 'brands' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>Seleccionar Tipo de Equipo:</label>
            <select
              value={selectedTypeForBrand}
              onChange={(e) => setSelectedTypeForBrand(e.target.value)}
              style={{ width: '100%', maxWidth: '320px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            >
              {deviceTypes.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
              ))}
            </select>
          </div>

          <form onSubmit={handleCreateBrand} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Nueva marca (Ej. Asus, Whirlpool)"
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              required
              style={{ flex: 1, maxWidth: '320px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            />
            <button
              type="submit"
              disabled={submittingBrand || !newBrandName.trim()}
              style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              + Agregar Marca
            </button>
          </form>

          {brandsLoading ? (
            <p style={{ color: '#64748b', fontSize: '13px' }}>Cargando marcas...</p>
          ) : brandsForType.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '13px' }}>No hay marcas registradas para este tipo.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b', fontSize: '12px' }}>
                  <th style={{ padding: '10px 12px' }}>Marca</th>
                  <th style={{ padding: '10px 12px' }}>Estado</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {brandsForType.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f172a' }}>
                      {editingBrandId === b.id ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input
                            type="text"
                            value={editBrandName}
                            onChange={(e) => setEditBrandName(e.target.value)}
                            style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #2563eb' }}
                          />
                          <button onClick={() => handleUpdateBrand(b.id)} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}><Check size={12} /></button>
                          <button onClick={() => setEditingBrandId(null)} style={{ background: '#cbd5e1', color: '#334155', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}><X size={12} /></button>
                        </div>
                      ) : b.name}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                        background: b.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9',
                        color: b.status === 'ACTIVE' ? '#15803d' : '#64748b'
                      }}>
                        {b.status === 'ACTIVE' ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => { setEditingBrandId(b.id); setEditBrandName(b.name); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><Edit2 size={14} /></button>
                      <button onClick={() => handleToggleBrand(b)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: b.status === 'ACTIVE' ? '#ef4444' : '#22c55e' }}><Power size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 3: TYPES */}
      {activeTab === 'types' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Create Type Form */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginTop: 0, marginBottom: '16px' }}>Crear Nuevo Tipo de Equipo</h3>
            <form onSubmit={handleCreateType} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Código *</label>
                <input
                  type="text"
                  placeholder="Ej. TABLET, CONSOLE"
                  value={typeCode}
                  onChange={(e) => setTypeCode(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Nombre *</label>
                <input
                  type="text"
                  placeholder="Ej. Tablet, Consola de Videojuegos"
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Descripción</label>
                <input
                  type="text"
                  placeholder="Descripción opcional"
                  value={typeDesc}
                  onChange={(e) => setTypeDesc(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>
              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={submittingType}
                  style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {submittingType ? 'Guardando...' : 'Crear Tipo'}
                </button>
              </div>
            </form>
          </div>

          {/* List Types */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginTop: 0, marginBottom: '16px' }}>Tipos de Equipo Registrados</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b', fontSize: '12px' }}>
                  <th style={{ padding: '10px 12px' }}>Código</th>
                  <th style={{ padding: '10px 12px' }}>Nombre</th>
                  <th style={{ padding: '10px 12px' }}>Estado</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {deviceTypes.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>{t.code}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f172a' }}>
                      {editingTypeId === t.id ? (
                        <div style={{ display: 'grid', gap: '6px', minWidth: '220px' }}>
                          <input
                            type="text"
                            aria-label={`Nombre de ${t.code}`}
                            value={editTypeName}
                            maxLength={120}
                            onChange={(event) => setEditTypeName(event.target.value)}
                            style={{ padding: '6px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                          />
                          <input
                            type="text"
                            aria-label={`Descripción de ${t.code}`}
                            value={editTypeDesc}
                            maxLength={2000}
                            placeholder="Descripción opcional"
                            onChange={(event) => setEditTypeDesc(event.target.value)}
                            style={{ padding: '6px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                          />
                        </div>
                      ) : (
                        <>
                          <div>{t.name}</div>
                          {t.description && <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 400 }}>{t.description}</div>}
                        </>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                        background: t.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9',
                        color: t.status === 'ACTIVE' ? '#15803d' : '#64748b'
                      }}>
                        {t.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {editingTypeId === t.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void handleUpdateType(t.id)}
                            disabled={submittingType || !editTypeName.trim()}
                            title="Guardar cambios"
                            aria-label={`Guardar cambios de ${t.code}`}
                            style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', marginRight: '6px' }}
                          ><Check size={14} /></button>
                          <button
                            type="button"
                            onClick={() => setEditingTypeId(null)}
                            title="Cancelar edición"
                            aria-label={`Cancelar edición de ${t.code}`}
                            style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer' }}
                          ><X size={14} /></button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => beginEditType(t)}
                            title="Editar tipo"
                            aria-label={`Editar ${t.name}`}
                            style={{ background: 'none', border: '1px solid #cbd5e1', color: '#475569', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', marginRight: '6px' }}
                          >Editar</button>
                          <button
                            type="button"
                            onClick={() => void handleToggleType(t)}
                            title={t.status === 'ACTIVE' ? 'Inactivar tipo' : 'Reactivar tipo'}
                            aria-label={`${t.status === 'ACTIVE' ? 'Inactivar' : 'Reactivar'} ${t.name}`}
                            style={{ background: 'none', border: t.status === 'ACTIVE' ? '1px solid #fecaca' : '1px solid #bbf7d0', color: t.status === 'ACTIVE' ? '#dc2626' : '#15803d', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                          >{t.status === 'ACTIVE' ? 'Inactivar' : 'Reactivar'}</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: EVALUATION RULES (HU-008) */}
      {activeTab === 'rules' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Type Selector */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Seleccionar Tipo de Equipo:</label>
              <select
                value={selectedTypeForRule}
                onChange={(e) => setSelectedTypeForRule(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 600, color: '#1e293b' }}
              >
                {deviceTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowHistoryModal(!showHistoryModal)}
                style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', padding: '8px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <History size={15} /> Historial de Versiones ({ruleHistory.length})
              </button>
              <button
                onClick={() => setShowNewRuleForm(!showNewRuleForm)}
                style={{ background: '#2563eb', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={15} /> Crear Nueva Versión
              </button>
            </div>
          </div>

          {/* History Drawer/Modal */}
          {showHistoryModal && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <History size={16} /> Historial de Reglas de Evaluación para {deviceTypes.find(t => t.id === selectedTypeForRule)?.name}
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #cbd5e1', textAlign: 'left', color: '#64748b' }}>
                    <th style={{ padding: '8px' }}>Versión</th>
                    <th style={{ padding: '8px' }}>Estado</th>
                    <th style={{ padding: '8px' }}>Vigencia Desde</th>
                    <th style={{ padding: '8px' }}>Vigencia Hasta</th>
                    <th style={{ padding: '8px' }}>Ítems Checklist</th>
                  </tr>
                </thead>
                <tbody>
                  {ruleHistory.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px', fontWeight: 700 }}>v{r.version}</td>
                      <td style={{ padding: '8px' }}>
                        <span style={{
                          padding: '2px 6px', borderRadius: '10px', fontSize: '10px', fontWeight: 700,
                          background: r.is_active ? '#dcfce7' : '#f1f5f9',
                          color: r.is_active ? '#15803d' : '#64748b'
                        }}>
                          {r.is_active ? 'VIGENTE' : 'HISTÓRICA'}
                        </span>
                      </td>
                      <td style={{ padding: '8px', color: '#475569' }}>{new Date(r.effective_from).toLocaleString()}</td>
                      <td style={{ padding: '8px', color: '#475569' }}>{r.effective_until ? new Date(r.effective_until).toLocaleString() : 'Vigente'}</td>
                      <td style={{ padding: '8px', fontWeight: 600 }}>{r.checklist?.length || 0} ítems</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Form to create a new Rule version */}
          {showNewRuleForm && (
            <div style={{ background: '#ffffff', border: '2px solid #2563eb', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PlusCircle size={18} color="#2563eb" /> Diseñar Nueva Versión de Regla (v{(activeRule?.version || 0) + 1})
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: 0, marginBottom: '16px' }}>
                Al guardar, la versión actual (v{activeRule?.version || 1}) pasará a estado histórico y esta nueva versión guiará las inspecciones futuras.
              </p>

              {/* Add item bar */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder="Pregunta o criterio de inspección (Ej. ¿Funciona el encendido?)"
                  value={newItemLabel}
                  onChange={(e) => setNewItemLabel(e.target.value)}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
                <select
                  value={newItemType}
                  onChange={(e) => setNewItemType(e.target.value as any)}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option value="boolean">Sí / No (Booleano)</option>
                  <option value="number">Puntaje (1-10)</option>
                  <option value="text">Texto / Observación</option>
                </select>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                  <input type="checkbox" checked={newItemRequired} onChange={(e) => setNewItemRequired(e.target.checked)} /> Obligatorio
                </label>
                <button
                  type="button"
                  onClick={handleAddItemToChecklist}
                  style={{ background: '#2563eb', color: '#ffffff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                >
                  + Agregar Ítem
                </button>
              </div>

              {/* Checklist preview */}
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Vista previa de Ítems del Checklist ({newChecklist.length})</h4>
              {newChecklist.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>No hay ítems en esta regla aún. Agregá al menos uno arriba.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {newChecklist.map((item, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 700, color: '#2563eb', fontSize: '12px' }}>#{idx + 1}</span>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.label}</span>
                        <span style={{ fontSize: '11px', background: '#eff6ff', color: '#1d4ed8', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>{item.type}</span>
                        {item.required && <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 700 }}>* Requerido</span>}
                      </div>
                      <button onClick={() => handleRemoveChecklistItem(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                        <Trash2 size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewRuleForm(false)}
                  style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateRuleVersion}
                  disabled={submittingRule || newChecklist.length === 0}
                  style={{ background: '#16a34a', color: '#ffffff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                >
                  {submittingRule ? 'Publicando Versión...' : 'Publicar Nueva Versión'}
                </button>
              </div>
            </div>
          )}

          {/* Active Rule Display */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
            {rulesLoading ? (
              <p style={{ color: '#64748b', fontSize: '13px' }}>Cargando regla de evaluación activa...</p>
            ) : !activeRule ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <AlertCircle size={32} color="#94a3b8" style={{ marginBottom: '8px' }} />
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>No hay regla de evaluación definida para este tipo de equipo.</p>
                <button
                  onClick={() => setShowNewRuleForm(true)}
                  style={{ marginTop: '12px', background: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  + Definir Regla Inicial
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ background: '#2563eb', color: '#ffffff', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 800 }}>
                      Versión Vigente v{activeRule.version}
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      Desde: {new Date(activeRule.effective_from).toLocaleDateString()}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', background: '#dcfce7', color: '#15803d', fontWeight: 700, padding: '3px 10px', borderRadius: '12px' }}>
                    ✓ ACTIVA PARA INSPECCIONES
                  </span>
                </div>

                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                  Checklist de Inspección ({activeRule.checklist?.length || 0} preguntas):
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', marginBottom: '20px' }}>
                  {activeRule.checklist?.map((item: ChecklistItem, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 700, color: '#2563eb', fontSize: '13px' }}>#{i + 1}</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{item.label}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', background: '#e2e8f0', color: '#334155', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                          Tipo: {item.type}
                        </span>
                        {item.required && (
                          <span style={{ fontSize: '11px', background: '#fef2f2', color: '#991b1b', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                            Requerido
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Criteria Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '14px' }}>
                    <h5 style={{ margin: '0 0 6px 0', color: '#166534', fontSize: '13px', fontWeight: 700 }}>Criterios de Reventa (Resale):</h5>
                    <pre style={{ margin: 0, fontSize: '11px', color: '#14532d', background: '#ffffff', padding: '8px', borderRadius: '4px', border: '1px solid #dcfce7' }}>
                      {JSON.stringify(activeRule.resale_criteria, null, 2)}
                    </pre>
                  </div>
                  <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: '8px', padding: '14px' }}>
                    <h5 style={{ margin: '0 0 6px 0', color: '#854d0e', fontSize: '13px', fontWeight: 700 }}>Criterios de Reciclaje (Recycle):</h5>
                    <pre style={{ margin: 0, fontSize: '11px', color: '#713f12', background: '#ffffff', padding: '8px', borderRadius: '4px', border: '1px solid #fef9c3' }}>
                      {JSON.stringify(activeRule.recycle_criteria, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
