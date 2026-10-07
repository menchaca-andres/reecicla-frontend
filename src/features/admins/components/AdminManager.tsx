import React, { useState } from 'react';
import { UserPlus, Building2, Mail, Lock, User as UserIcon, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import { ApiService } from '../../../services/api';
import styles from '../AdminManager.module.css';

interface AdminManagerProps {
  token: string | null;
}

interface CreatedAdmin {
  email: string;
  tenant_id: string;
  name?: string;
  role: string;
}

export const AdminManager: React.FC<AdminManagerProps> = ({ token }) => {
  const [tenantId, setTenantId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'TENANT_ADMIN' | 'CATALOG_ADMIN' | 'INSPECTOR'>('TENANT_ADMIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedAdmin | null>(null);

  const resetForm = () => {
    setTenantId('');
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    setRole('TENANT_ADMIN');
    setError(null);
    setCreated(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setLoading(true);

    try {
      const res = await ApiService.createAdmin(
        { tenant_id: tenantId, email, password, name: name || undefined, phone: phone || undefined, role },
        token
      );
      setCreated({
        email: res.user.email,
        tenant_id: res.user.tenant_id,
        name: res.user.name,
        role: res.user.role,
      });
      setTenantId('');
      setEmail('');
      setPassword('');
      setName('');
      setPhone('');
      setRole('TENANT_ADMIN');
    } catch (err: any) {
      setError(err.message || 'Error al crear el administrador');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <div className={styles.headerIcon}>
            <UserPlus size={20} color="#ffffff" />
          </div>
          <div>
            <h2 className={styles.title}>
              Gestión de Administradores
            </h2>
            <p className={styles.subtitle}>
              Crea administradores para cualquier tenant de la plataforma
            </p>
          </div>
        </div>
      </div>

      {/* Success banner */}
      {created && (
        <div className={styles.successBanner}>
          <CheckCircle size={20} color="#22c55e" className={styles.successIcon} />
          <div>
            <p className={styles.successTitle}>
              Administrador creado exitosamente
            </p>
            <p className={styles.successDesc}>
              <strong className={styles.highlightText}>{created.email}</strong> asignado como{' '}
              <strong className={styles.highlightRole}>{created.role}</strong> en el tenant{' '}
              <strong className={styles.highlightText}>{created.tenant_id}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Form card */}
      <div className={`glass-panel ${styles.formCard}`}>
        <h3 className={styles.cardTitle}>
          <UserPlus size={16} color="#7c3aed" /> Nuevo Administrador
        </h3>

        {error && (
          <div className={styles.errorBanner}>
            <AlertCircle size={15} color="#f87171" />
            <span className={styles.errorText}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Tenant ID */}
          <div>
            <label className={styles.label}>
              <Building2 size={12} color="#ea580c" /> ID del Tenant *
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="00000000-0000-0000-0000-000000000001"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              required
            />
          </div>

          {/* Role selector */}
          <div>
            <label className={styles.label}>
              <UserIcon size={12} color="#7c3aed" /> Rol Asignado *
            </label>
            <select
              className="input-field"
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              required
            >
              <option value="TENANT_ADMIN">TENANT_ADMIN (Admin Principal de Tenant)</option>
              <option value="CATALOG_ADMIN">CATALOG_ADMIN (Admin de Catálogo)</option>
              <option value="INSPECTOR">INSPECTOR (Inspector Técnico)</option>
            </select>
          </div>

          {/* Name */}
          <div>
            <label className={styles.label}>
              <UserIcon size={12} color="#2563eb" /> Nombre Completo
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Ej. Ana García"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Phone */}
          <div>
            <label className={styles.label}>
              <Phone size={12} color="#16a34a" /> Celular / Teléfono
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Ej. +591 71234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* Email */}
          <div>
            <label className={styles.label}>
              <Mail size={12} color="#2563eb" /> Correo Electrónico *
            </label>
            <input
              type="email"
              className="input-field"
              placeholder="admin@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className={styles.label}>
              <Lock size={12} color="#2563eb" /> Contraseña *
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className={styles.buttonRow}>
            <button
              type="submit"
              className={`btn-primary ${styles.submitBtn}`}
              disabled={loading}
            >
              {loading ? 'Creando...' : 'Crear Administrador'}
            </button>
            {(tenantId || email || password || name || phone) && (
              <button
                type="button"
                onClick={resetForm}
                className={styles.clearBtn}
              >
                Limpiar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Info note */}
      <div className={styles.infoNote}>
        <strong>Nota:</strong> Solo el <code>SUPER_ADMIN</code> puede crear usuarios con roles administrativos (<code>TENANT_ADMIN</code>, <code>CATALOG_ADMIN</code>, <code>INSPECTOR</code>).
      </div>
    </div>
  );
};
