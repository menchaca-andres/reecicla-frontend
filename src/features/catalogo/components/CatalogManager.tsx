import React, { useState, useEffect, useCallback } from 'react';
import { Cpu, AlertCircle, CheckCircle2, RefreshCw, Package, Tag, ClipboardCheck } from 'lucide-react';
import { ApiService } from '../../../services/api';
import type { DeviceType, DeviceBrand, Device, EvaluationRule, ChecklistItem } from '../../../types';
import styles from '../catalog.module.css';

import { DevicesTab } from './DevicesTab';
import { BrandsTab } from './BrandsTab';
import { TypesTab } from './TypesTab';
import { RulesTab } from './RulesTab';

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

  // ── Types form state ──
  const [typeCode, setTypeCode] = useState('');
  const [typeName, setTypeName] = useState('');
  const [typeDesc, setTypeDesc] = useState('');
  const [submittingType, setSubmittingType] = useState(false);

  // ── Brands form state ──
  const [selectedTypeForBrand, setSelectedTypeForBrand] = useState('');
  const [brandsForType, setBrandsForType] = useState<DeviceBrand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [submittingBrand, setSubmittingBrand] = useState(false);
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [editBrandName, setEditBrandName] = useState('');

  // ── Devices form state ──
  const [devTypeId, setDevTypeId] = useState('');
  const [devBrands, setDevBrands] = useState<DeviceBrand[]>([]);
  const [devBrandId, setDevBrandId] = useState('');
  const [devModel, setDevModel] = useState('');
  const [devYear, setDevYear] = useState<string>('');
  const [devDesc, setDevDesc] = useState('');
  const [submittingDevice, setSubmittingDevice] = useState(false);
  const [devicesFilterType, setDevicesFilterType] = useState('');

  // ── Evaluation Rules state (HU-008) ──
  const [selectedTypeForRule, setSelectedTypeForRule] = useState('');
  const [activeRule, setActiveRule] = useState<EvaluationRule | null>(null);
  const [ruleHistory, setRuleHistory] = useState<EvaluationRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showNewRuleForm, setShowNewRuleForm] = useState(false);

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
      const res = await ApiService.getBrands(typeId, token, false);
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

  const handleInactivateType = async (id: string, name: string) => {
    if (!token) return;
    try {
      await ApiService.inactivateDeviceType(id, token);
      notify(`Tipo "${name}" inactivado.`);
      loadTypes();
    } catch (err: any) { notify(err.message, true); }
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

  // ── Evaluation Rule handlers ──
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

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <Cpu size={22} />
          </div>
          <div>
            <h2 className={styles.headerTitle}>Gestión de Catálogo</h2>
            <p className={styles.headerSubtitle}>Dispositivos · Marcas · Tipos · Reglas de Evaluación</p>
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
          className={styles.refreshButton}
        >
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Actualizar
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className={styles.alertError}>
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {success && (
        <div className={styles.alertSuccess}>
          <CheckCircle2 size={16} /> {success}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className={styles.tabNav}>
        <button
          className={`${styles.tabButton} ${activeTab === 'devices' ? styles.active : ''}`}
          onClick={() => setActiveTab('devices')}
        >
          <Package size={15} /> Dispositivos
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'brands' ? styles.active : ''}`}
          onClick={() => setActiveTab('brands')}
        >
          <Tag size={15} /> Marcas por Tipo
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'types' ? styles.active : ''}`}
          onClick={() => setActiveTab('types')}
        >
          <Cpu size={15} /> Tipos de Equipo
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'rules' ? styles.active : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          <ClipboardCheck size={15} /> Reglas de Evaluación
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'devices' && (
        <DevicesTab
          deviceTypes={deviceTypes}
          devTypeId={devTypeId}
          setDevTypeId={setDevTypeId}
          devBrands={devBrands}
          devBrandId={devBrandId}
          setDevBrandId={setDevBrandId}
          devModel={devModel}
          setDevModel={setDevModel}
          devYear={devYear}
          setDevYear={setDevYear}
          devDesc={devDesc}
          setDevDesc={setDevDesc}
          submittingDevice={submittingDevice}
          handleCreateDevice={handleCreateDevice}
          devicesFilterType={devicesFilterType}
          setDevicesFilterType={setDevicesFilterType}
          devices={devices}
          handleToggleDevice={handleToggleDevice}
        />
      )}

      {activeTab === 'brands' && (
        <BrandsTab
          deviceTypes={deviceTypes}
          selectedTypeForBrand={selectedTypeForBrand}
          setSelectedTypeForBrand={setSelectedTypeForBrand}
          newBrandName={newBrandName}
          setNewBrandName={setNewBrandName}
          submittingBrand={submittingBrand}
          handleCreateBrand={handleCreateBrand}
          brandsLoading={brandsLoading}
          brandsForType={brandsForType}
          editingBrandId={editingBrandId}
          setEditingBrandId={setEditingBrandId}
          editBrandName={editBrandName}
          setEditBrandName={setEditBrandName}
          handleUpdateBrand={handleUpdateBrand}
          handleToggleBrand={handleToggleBrand}
        />
      )}

      {activeTab === 'types' && (
        <TypesTab
          typeCode={typeCode}
          setTypeCode={setTypeCode}
          typeName={typeName}
          setTypeName={setTypeName}
          typeDesc={typeDesc}
          setTypeDesc={setTypeDesc}
          submittingType={submittingType}
          handleCreateType={handleCreateType}
          deviceTypes={deviceTypes}
          handleInactivateType={handleInactivateType}
        />
      )}

      {activeTab === 'rules' && (
        <RulesTab
          deviceTypes={deviceTypes}
          selectedTypeForRule={selectedTypeForRule}
          setSelectedTypeForRule={setSelectedTypeForRule}
          showHistoryModal={showHistoryModal}
          setShowHistoryModal={setShowHistoryModal}
          ruleHistory={ruleHistory}
          showNewRuleForm={showNewRuleForm}
          setShowNewRuleForm={setShowNewRuleForm}
          activeRule={activeRule}
          newItemLabel={newItemLabel}
          setNewItemLabel={setNewItemLabel}
          newItemType={newItemType}
          setNewItemType={setNewItemType}
          newItemRequired={newItemRequired}
          setNewItemRequired={setNewItemRequired}
          handleAddItemToChecklist={handleAddItemToChecklist}
          newChecklist={newChecklist}
          handleRemoveChecklistItem={handleRemoveChecklistItem}
          submittingRule={submittingRule}
          handleCreateRuleVersion={handleCreateRuleVersion}
          rulesLoading={rulesLoading}
        />
      )}
    </div>
  );
};
