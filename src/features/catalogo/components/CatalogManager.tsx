import React, { useState, useEffect, useCallback } from 'react';
import { ApiService } from '../../../services/api';
import type { DeviceType, DeviceBrand, Device, EvaluationRule, ChecklistItem, PaginationMeta, CatalogAuditLog } from '../../../types';
import styles from '../catalog.module.css';

import { DevicesTab } from './DevicesTab';
import { BrandsTab } from './BrandsTab';
import { TypesTab } from './TypesTab';
import { RulesTab } from './RulesTab';
import { AuditTab } from './AuditTab';

interface CatalogManagerProps {
  token: string | null;
}

type Tab = 'devices' | 'brands' | 'types' | 'rules' | 'audit';

export const CatalogManager: React.FC<CatalogManagerProps> = ({ token }) => {
  const [activeTab, setActiveTab] = useState<Tab>('devices');

  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [deviceTypesPage, setDeviceTypesPage] = useState<DeviceType[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [devicesPagination, setDevicesPagination] = useState<PaginationMeta>({ page: 1, page_size: 10, total_items: 0, total_pages: 0 });
  const [typesPagination, setTypesPagination] = useState<PaginationMeta>({ page: 1, page_size: 10, total_items: 0, total_pages: 0 });
  const [brandsPagination, setBrandsPagination] = useState<PaginationMeta>({ page: 1, page_size: 10, total_items: 0, total_pages: 0 });
  const [ruleHistoryPagination, setRuleHistoryPagination] = useState<PaginationMeta>({ page: 1, page_size: 10, total_items: 0, total_pages: 0 });
  const [auditLogs, setAuditLogs] = useState<CatalogAuditLog[]>([]);
  const [auditPagination, setAuditPagination] = useState<PaginationMeta>({ page: 1, page_size: 10, total_items: 0, total_pages: 0 });
  const [auditLoading, setAuditLoading] = useState(false);

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
      const [res, pageRes] = await Promise.all([
        ApiService.getDeviceTypes(token, true),
        ApiService.getDeviceTypes(token, true, { page: typesPagination.page, page_size: 10 }),
      ]);
      const list = res.device_types || res.deviceTypes || [];
      setDeviceTypes(list);
      setDeviceTypesPage(pageRes.device_types);
      if (pageRes.pagination) setTypesPagination(pageRes.pagination);
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
  }, [token, selectedTypeForBrand, devTypeId, selectedTypeForRule, typesPagination.page]);

  const loadBrandsForType = useCallback(async (typeId: string) => {
    if (!typeId) return;
    setBrandsLoading(true);
    try {
      const res = await ApiService.getBrands(typeId, token, true, { page: brandsPagination.page, page_size: 10 });
      setBrandsForType(res.brands || []);
      if (res.pagination) setBrandsPagination(res.pagination);
    } catch (err) {
      setBrandsForType([]);
      setError(err instanceof Error ? err.message : 'Error al cargar las marcas.');
    }
    finally { setBrandsLoading(false); }
  }, [token, brandsPagination.page]);

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
      const res = await ApiService.getDevices(typeId, token, true, { page: devicesPagination.page, page_size: 10 });
      setDevices(res.devices || []);
      if (res.pagination) setDevicesPagination(res.pagination);
    } catch (err: any) {
      setError(err.message || 'Error al cargar dispositivos.');
    }
  }, [token, devicesFilterType, devicesPagination.page]);

  const loadRulesForType = useCallback(async (typeId: string) => {
    if (!typeId) return;
    setRulesLoading(true);
    try {
      const [activeRes, historyRes] = await Promise.all([
        ApiService.getActiveEvaluationRule(typeId, token),
        ApiService.getEvaluationRuleHistory(typeId, token, { page: ruleHistoryPagination.page, page_size: 10 })
      ]);
      setActiveRule(activeRes.rule);
      setRuleHistory(historyRes.rules || []);
      if (historyRes.pagination) setRuleHistoryPagination(historyRes.pagination);

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
  }, [token, ruleHistoryPagination.page]);

  const loadAuditLogs = useCallback(async () => {
    if (!token) return;
    setAuditLoading(true);
    try {
      const result = await ApiService.getCatalogAuditLogs(token, { page: auditPagination.page, page_size: 10 });
      setAuditLogs(result.audit_logs);
      setAuditPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al consultar la auditoría.');
    } finally {
      setAuditLoading(false);
    }
  }, [token, auditPagination.page]);

  useEffect(() => { loadTypes(); }, [loadTypes]);
  useEffect(() => { if (selectedTypeForBrand) loadBrandsForType(selectedTypeForBrand); }, [selectedTypeForBrand, loadBrandsForType]);
  useEffect(() => { if (devTypeId) loadDevBrandsForType(devTypeId); }, [devTypeId, loadDevBrandsForType]);
  useEffect(() => { if (activeTab === 'devices') loadDevices(); }, [activeTab, loadDevices]);
  useEffect(() => { if (selectedTypeForRule) loadRulesForType(selectedTypeForRule); }, [selectedTypeForRule, loadRulesForType]);
  useEffect(() => { if (activeTab === 'audit') loadAuditLogs(); }, [activeTab, loadAuditLogs]);

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
      setTypesPagination((current) => ({ ...current, page: 1 }));
      loadTypes();
    } catch (err: any) { notify(err.message || 'Error al crear tipo.', true); }
    finally { setSubmittingType(false); }
  };

  const handleInactivateType = async (id: string, name: string) => {
    if (!token) return;
    try {
      await ApiService.inactivateDeviceType(id, token);
      notify(`Tipo "${name}" inactivado.`);
      setTypesPagination((current) => ({ ...current, page: 1 }));
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
      setBrandsPagination((current) => ({ ...current, page: 1 }));
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
      setDevicesPagination((current) => ({ ...current, page: 1 }));
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
        <div>
          <h2 className={styles.headerTitle}>Catálogo</h2>
          <p className={styles.headerSubtitle}>Administra dispositivos, marcas, tipos y reglas de evaluación.</p>
        </div>
        <button
          onClick={() => {
            loadTypes();
            if (activeTab === 'brands' && selectedTypeForBrand) loadBrandsForType(selectedTypeForBrand);
            if (activeTab === 'devices') loadDevices();
            if (activeTab === 'rules' && selectedTypeForRule) loadRulesForType(selectedTypeForRule);
            if (activeTab === 'audit') loadAuditLogs();
          }}
          disabled={loading}
          className={styles.refreshButton}
        >
          {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className={styles.alertError}>
          {error}
        </div>
      )}
      {success && (
        <div className={styles.alertSuccess}>
          {success}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className={styles.tabNav}>
        <button
          className={`${styles.tabButton} ${activeTab === 'devices' ? styles.active : ''}`}
          onClick={() => setActiveTab('devices')}
        >
          Dispositivos
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'brands' ? styles.active : ''}`}
          onClick={() => setActiveTab('brands')}
        >
          Marcas
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'types' ? styles.active : ''}`}
          onClick={() => setActiveTab('types')}
        >
          Tipos de equipo
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'rules' ? styles.active : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          Reglas de evaluación
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'audit' ? styles.active : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          Auditoría
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
          setDevicesFilterType={(id) => {
            setDevicesFilterType(id);
            setDevicesPagination((current) => ({ ...current, page: 1 }));
          }}
          devices={devices}
          pagination={devicesPagination}
          onPageChange={(page) => setDevicesPagination((current) => ({ ...current, page }))}
          handleToggleDevice={handleToggleDevice}
        />
      )}

      {activeTab === 'brands' && (
        <BrandsTab
          deviceTypes={deviceTypes}
          selectedTypeForBrand={selectedTypeForBrand}
          setSelectedTypeForBrand={(id) => {
            setSelectedTypeForBrand(id);
            setBrandsPagination((current) => ({ ...current, page: 1 }));
          }}
          newBrandName={newBrandName}
          setNewBrandName={setNewBrandName}
          submittingBrand={submittingBrand}
          handleCreateBrand={handleCreateBrand}
          brandsLoading={brandsLoading}
          brandsForType={brandsForType}
          pagination={brandsPagination}
          onPageChange={(page) => setBrandsPagination((current) => ({ ...current, page }))}
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
          deviceTypes={deviceTypesPage}
          pagination={typesPagination}
          onPageChange={(page) => setTypesPagination((current) => ({ ...current, page }))}
          handleInactivateType={handleInactivateType}
        />
      )}

      {activeTab === 'rules' && (
        <RulesTab
          deviceTypes={deviceTypes}
          selectedTypeForRule={selectedTypeForRule}
          setSelectedTypeForRule={(id) => {
            setSelectedTypeForRule(id);
            setRuleHistoryPagination((current) => ({ ...current, page: 1 }));
          }}
          showHistoryModal={showHistoryModal}
          setShowHistoryModal={setShowHistoryModal}
          ruleHistory={ruleHistory}
          ruleHistoryPagination={ruleHistoryPagination}
          onRuleHistoryPageChange={(page) => setRuleHistoryPagination((current) => ({ ...current, page }))}
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
      {activeTab === 'audit' && (
        <AuditTab
          auditLogs={auditLogs}
          loading={auditLoading}
          pagination={auditPagination}
          onPageChange={(page) => setAuditPagination((current) => ({ ...current, page }))}
        />
      )}
    </div>
  );
};
