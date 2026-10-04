import { useEffect, useState } from 'react';
import { Check, Pencil, Plus, RotateCcw, X } from 'lucide-react';
import { ApiService } from '../services/api';
import type { DeviceType } from '../types';

interface DeviceTypesManagerProps {
  tenantId: string;
  token: string;
}

export function DeviceTypesManager({ tenantId, token }: DeviceTypesManagerProps) {
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingType, setEditingType] = useState<DeviceType | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadDeviceTypes = async () => {
    setLoading(true);
    try {
      const response = await ApiService.getDeviceTypes(tenantId, token, true);
      setDeviceTypes(response.device_types);
      setError(null);
    } catch (err) {
      setError((err as Error).message || 'No se pudo cargar el catálogo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDeviceTypes();
  }, [tenantId, token]);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await ApiService.createDeviceType({ code, name, description: description || undefined }, token);
      setCode('');
      setName('');
      setDescription('');
      setNotice('Tipo de equipo creado.');
      await loadDeviceTypes();
    } catch (err) {
      setError((err as Error).message || 'No se pudo crear el tipo de equipo.');
    } finally {
      setSaving(false);
    }
  };

  const beginEdit = (deviceType: DeviceType) => {
    setEditingType(deviceType);
    setEditName(deviceType.name);
    setEditDescription(deviceType.description || '');
  };

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingType) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await ApiService.updateDeviceType(
        editingType.id,
        { name: editName, description: editDescription || undefined },
        token
      );
      setEditingType(null);
      setNotice('Tipo de equipo actualizado.');
      await loadDeviceTypes();
    } catch (err) {
      setError((err as Error).message || 'No se pudo actualizar el tipo de equipo.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (deviceType: DeviceType) => {
    const status = deviceType.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await ApiService.setDeviceTypeStatus(deviceType.id, status, token);
      setNotice(status === 'ACTIVE' ? 'Tipo de equipo reactivado.' : 'Tipo de equipo inactivado.');
      await loadDeviceTypes();
    } catch (err) {
      setError((err as Error).message || 'No se pudo cambiar el estado del tipo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="glass-panel" style={{ maxWidth: '900px', margin: '0 auto', padding: '28px' }}>
      <header style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', color: '#0f172a' }}>Tipos de equipos</h2>
        <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>Administra qué equipos acepta este tenant.</p>
      </header>

      {error && <p role="alert" style={{ color: '#b91c1c', background: '#fef2f2', padding: '10px 12px', marginBottom: '16px' }}>{error}</p>}
      {notice && <p role="status" style={{ color: '#166534', background: '#f0fdf4', padding: '10px 12px', marginBottom: '16px' }}>{notice}</p>}

      <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'minmax(130px, 0.7fr) minmax(160px, 1fr) minmax(180px, 1.4fr) auto', alignItems: 'end', gap: '12px', paddingBottom: '24px', borderBottom: '1px solid #e2e8f0' }}>
        <label style={{ color: '#475569', fontSize: '12px', fontWeight: 700 }}>
          Código
          <input className="input-field" required maxLength={60} pattern="[A-Za-z][A-Za-z0-9_]{1,59}" title="2 a 60 caracteres: letras, números y guion bajo" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="REFRIGERATOR" style={{ marginTop: '5px' }} />
        </label>
        <label style={{ color: '#475569', fontSize: '12px', fontWeight: 700 }}>
          Nombre
          <input className="input-field" required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} placeholder="Refrigerador" style={{ marginTop: '5px' }} />
        </label>
        <label style={{ color: '#475569', fontSize: '12px', fontWeight: 700 }}>
          Descripción
          <input className="input-field" maxLength={2000} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Descripción breve" style={{ marginTop: '5px' }} />
        </label>
        <button className="btn-primary" type="submit" disabled={saving} aria-label="Crear tipo de equipo" title="Crear tipo de equipo" style={{ padding: '10px 14px' }}>
          <Plus size={16} /> Agregar
        </button>
      </form>

      <div style={{ marginTop: '8px' }}>
        {loading ? (
          <p role="status" style={{ padding: '20px 0', color: '#64748b' }}>Cargando catálogo...</p>
        ) : deviceTypes.length === 0 ? (
          <p style={{ padding: '20px 0', color: '#64748b' }}>Aún no hay tipos de equipo en este catálogo.</p>
        ) : deviceTypes.map((deviceType) => (
          <article key={deviceType.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', padding: '16px 0', borderBottom: '1px solid #e2e8f0' }}>
            {editingType?.id === deviceType.id ? (
              <form onSubmit={handleUpdate} style={{ display: 'grid', gridTemplateColumns: 'minmax(90px, 0.7fr) minmax(140px, 1fr) minmax(160px, 1.4fr) auto', alignItems: 'end', gap: '10px', width: '100%' }}>
                <div style={{ color: '#64748b', fontSize: '12px' }}>Código fijo<br /><strong style={{ color: '#334155' }}>{deviceType.code}</strong></div>
                <label style={{ color: '#475569', fontSize: '12px', fontWeight: 700 }}>Nombre<input className="input-field" required maxLength={120} value={editName} onChange={(event) => setEditName(event.target.value)} style={{ marginTop: '5px' }} /></label>
                <label style={{ color: '#475569', fontSize: '12px', fontWeight: 700 }}>Descripción<input className="input-field" maxLength={2000} value={editDescription} onChange={(event) => setEditDescription(event.target.value)} style={{ marginTop: '5px' }} /></label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn-primary" type="submit" disabled={saving} aria-label="Guardar cambios" title="Guardar cambios" style={{ padding: '9px' }}><Check size={16} /></button>
                  <button className="btn-secondary" type="button" onClick={() => setEditingType(null)} aria-label="Cancelar edición" title="Cancelar edición" style={{ padding: '9px' }}><X size={16} /></button>
                </div>
              </form>
            ) : (
              <>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <strong style={{ color: '#0f172a' }}>{deviceType.name}</strong>
                    <code style={{ color: '#475569', fontSize: '11px' }}>{deviceType.code}</code>
                    <span style={{ color: deviceType.status === 'ACTIVE' ? '#166534' : '#9a3412', background: deviceType.status === 'ACTIVE' ? '#f0fdf4' : '#fff7ed', padding: '2px 7px', fontSize: '10px', fontWeight: 700 }}>
                      {deviceType.status === 'ACTIVE' ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </div>
                  {deviceType.description && <p style={{ color: '#64748b', fontSize: '12px', marginTop: '3px' }}>{deviceType.description}</p>}
                </div>
                <div style={{ display: 'flex', flexShrink: 0, gap: '8px' }}>
                  <button className="btn-secondary" type="button" onClick={() => beginEdit(deviceType)} disabled={saving} title="Editar tipo" aria-label={`Editar ${deviceType.name}`} style={{ padding: '8px' }}><Pencil size={15} /></button>
                  <button
                    className={deviceType.status === 'ACTIVE' ? 'btn-secondary' : 'btn-primary'}
                    type="button"
                    onClick={() => void handleStatusChange(deviceType)}
                    disabled={saving}
                    title={deviceType.status === 'ACTIVE' ? 'Inactivar tipo' : 'Reactivar tipo'}
                    aria-label={deviceType.status === 'ACTIVE' ? `Inactivar ${deviceType.name}` : `Reactivar ${deviceType.name}`}
                    style={{ padding: '8px', color: deviceType.status === 'ACTIVE' ? '#b91c1c' : undefined }}
                  >
                    <RotateCcw size={15} />
                  </button>
                </div>
              </>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
