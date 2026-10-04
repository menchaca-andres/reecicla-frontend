import React, { useState, useEffect, useCallback } from 'react';
import { Cpu, PlusCircle, AlertCircle, CheckCircle2, RefreshCw, Power } from 'lucide-react';
import { ApiService } from '../services/api';
import type { DeviceType } from '../types';

interface CatalogManagerProps {
  tenantId: string;
  token: string | null;
}

export const CatalogManager: React.FC<CatalogManagerProps> = ({ tenantId, token }) => {
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiService.getDeviceTypes(tenantId, true);
      setDeviceTypes(res.deviceTypes);
    } catch (err: any) {
      setError(err.message || 'Error al cargar tipos de dispositivos.');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await ApiService.createDeviceType(
        {
          tenant_id: tenantId,
          code: code.trim().toUpperCase(),
          name: name.trim(),
          description: description.trim() || undefined,
          accepts_quotes: true,
        },
        token
      );
      setSuccess(`Tipo de dispositivo "${res.deviceType.name}" creado con éxito.`);
      setCode('');
      setName('');
      setDescription('');
      loadCatalog();
    } catch (err: any) {
      setError(err.message || 'Error al crear tipo de dispositivo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (type: DeviceType) => {
    if (!token) return;
    setError(null);
    setSuccess(null);

    const newStatus = type.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    try {
      if (newStatus === 'INACTIVE') {
        await ApiService.inactivateDeviceType(type.id, tenantId, token);
        setSuccess(`Tipo "${type.name}" inactivado (no se ofrecerá para cotizar pero se conserva en historial).`);
      } else {
        await ApiService.updateDeviceType(
          type.id,
          { tenant_id: tenantId, status: 'ACTIVE' },
          token
        );
        setSuccess(`Tipo "${type.name}" reactivado exitosamente.`);
      }
      loadCatalog();
    } catch (err: any) {
      setError(err.message || 'Error al cambiar estado del dispositivo.');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '12px', color: '#2563eb', border: '1px solid #bfdbfe' }}>
            <Cpu size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Gestión de Catálogo (HU-006)</h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Define qué tipos de equipos se aceptan en la plataforma</p>
          </div>
        </div>
        <button
          onClick={loadCatalog}
          disabled={loading}
          style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
        >
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Actualizar
        </button>
      </div>

      {success && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} /> {success}
        </div>
      )}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="glass-panel" style={{ padding: '24px', background: '#ffffff' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PlusCircle size={16} color="#2563eb" /> Registrar Nuevo Tipo de Dispositivo
        </h3>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Código Único (UPPERCASE) *</label>
              <input
                type="text"
                className="input-field"
                placeholder="Ej. MICROWAVE"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Nombre Mostrado *</label>
              <input
                type="text"
                className="input-field"
                placeholder="Ej. Horno de Microondas"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Descripción</label>
            <input
              type="text"
              className="input-field"
              placeholder="Descripción breve del equipo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={submitting} style={{ padding: '10px 16px', alignSelf: 'flex-start' }}>
            {submitting ? 'Guardando...' : 'Crear Tipo de Dispositivo'}
          </button>
        </form>
      </div>

      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>Tipos en Catálogo</h3>
        {deviceTypes.length === 0 ? (
          <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', background: '#f8fafc' }}>
            <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>No hay tipos de dispositivo registrados en este tenant.</p>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', background: '#ffffff' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textAlign: 'left', textTransform: 'uppercase' }}>Código</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textAlign: 'left', textTransform: 'uppercase' }}>Nombre</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textAlign: 'left', textTransform: 'uppercase' }}>Estado</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textAlign: 'left', textTransform: 'uppercase' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {deviceTypes.map((type, i) => (
                  <tr key={type.id} style={{ borderBottom: i < deviceTypes.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <td style={{ padding: '12px 16px', fontSize: '12px', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>{type.code}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#334155' }}>
                      <strong>{type.name}</strong>
                      {type.description && <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0' }}>{type.description}</p>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: type.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9',
                        color: type.status === 'ACTIVE' ? '#15803d' : '#64748b',
                        border: type.status === 'ACTIVE' ? '1px solid #86efac' : '1px solid #cbd5e1',
                      }}>
                        {type.status === 'ACTIVE' ? 'ACTIVO (Cotizable)' : 'INACTIVO'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => handleToggleStatus(type)}
                        title={type.status === 'ACTIVE' ? 'Inactivar' : 'Activar'}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 10px',
                          fontSize: '12px',
                          fontWeight: 600,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          background: type.status === 'ACTIVE' ? '#fef2f2' : '#f0fdf4',
                          border: type.status === 'ACTIVE' ? '1px solid #fecaca' : '1px solid #bbf7d0',
                          color: type.status === 'ACTIVE' ? '#dc2626' : '#16a34a',
                        }}
                      >
                        <Power size={13} /> {type.status === 'ACTIVE' ? 'Inactivar' : 'Reactivar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
