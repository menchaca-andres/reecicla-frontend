import React, { useEffect, useState } from 'react';
import { ApiService } from '../../../services/api';
import styles from '../AdminManager.module.css';

interface AdminManagerProps {
  token: string | null;
}

interface TenantOption {
  id: string;
  name: string;
  slug: string;
  status: string;
}

export const AdminManager: React.FC<AdminManagerProps> = ({ token }) => {
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [slug, setSlug] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminName, setAdminName] = useState('');
  const [phone, setPhone] = useState('');
  const [additionalEmail, setAdditionalEmail] = useState('');
  const [additionalPassword, setAdditionalPassword] = useState('');
  const [additionalName, setAdditionalName] = useState('');
  const [additionalPhone, setAdditionalPhone] = useState('');
  const [role, setRole] = useState<'TENANT_ADMIN' | 'CATALOG_ADMIN' | 'INSPECTOR'>('TENANT_ADMIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingCatalog, setPendingCatalog] = useState<TenantOption | null>(null);
  const [createdTenantSlug, setCreatedTenantSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    ApiService.listTenants(token)
      .then(({ tenants: items }) => {
        setTenants(items);
        setSelectedTenantId(items[0]?.id || '');
      })
      .catch((requestError: Error) => setError(requestError.message));
  }, [token]);

  const createBusiness = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const result = await ApiService.createTenant({
        name: businessName,
        slug,
        email: adminEmail,
        password: adminPassword,
        admin_name: adminName || undefined,
        phone: phone || undefined,
      }, token);
      const tenant = { ...result.tenant, status: 'ACTIVE' };
      setTenants((current) => [...current, tenant].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedTenantId(tenant.id);
      setBusinessName('');
      setSlug('');
      setAdminEmail('');
      setAdminPassword('');
      setAdminName('');
      setPhone('');
      setPendingCatalog(tenant);
      setCreatedTenantSlug(tenant.slug);
      try {
        await ApiService.bootstrapTenantCatalog(tenant.id, token);
        setPendingCatalog(null);
        setSuccess(`Negocio "${tenant.name}" (${tenant.slug}) y su administrador principal fueron creados. Catálogo base listo.`);
      } catch (bootstrapError) {
        setError(`El negocio "${tenant.name}" y su administrador sí se crearon, pero no se pudo inicializar el catálogo: ${(bootstrapError as Error).message}`);
      }
    } catch (requestError) {
      setError((requestError as Error).message || 'Error al crear el negocio.');
    } finally {
      setLoading(false);
    }
  };

  const retryCatalog = async () => {
    if (!token || !pendingCatalog) return;
    setLoading(true);
    setError(null);
    try {
      await ApiService.bootstrapTenantCatalog(pendingCatalog.id, token);
      setSuccess(`Catálogo base inicializado para "${pendingCatalog.name}".`);
      setPendingCatalog(null);
    } catch (requestError) {
      setError(`No se pudo inicializar el catálogo: ${(requestError as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const createAdditionalAdmin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !selectedTenantId) return;
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const result = await ApiService.createAdmin({
        tenant_id: selectedTenantId,
        email: additionalEmail,
        password: additionalPassword,
        name: additionalName || undefined,
        phone: additionalPhone || undefined,
        role,
      }, token);
      const tenant = tenants.find((item) => item.id === selectedTenantId);
      setSuccess(`${result.user.email} fue agregado como ${result.user.role} en "${tenant?.name || 'el negocio'}".`);
      setAdditionalEmail('');
      setAdditionalPassword('');
      setAdditionalName('');
      setAdditionalPhone('');
    } catch (requestError) {
      setError((requestError as Error).message || 'Error al crear el administrador.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Negocios y administradores</h1>
        <p className={styles.subtitle}>Crea negocios con su administrador principal o agrega personal a un negocio existente.</p>
      </div>

      {success && (
        <div className={styles.successBanner} role="status">
          <div>
            <p className={styles.successDesc}>{success}</p>
            {createdTenantSlug && (
              <a href={`/recicla/${encodeURIComponent(createdTenantSlug)}`} target="_blank" rel="noreferrer">
                Abrir página de {createdTenantSlug}
              </a>
            )}
          </div>
        </div>
      )}
      {error && (
        <div className={styles.errorBanner} role="alert">
          <span className={styles.errorText}>{error}</span>
          {pendingCatalog && <button type="button" onClick={retryCatalog} disabled={loading} className={styles.clearBtn}>Reintentar catálogo</button>}
          {pendingCatalog && (
            <a href={`/recicla/${encodeURIComponent(pendingCatalog.slug)}`} target="_blank" rel="noreferrer">
              Abrir página de {pendingCatalog.slug}
            </a>
          )}
        </div>
      )}

      <section className={styles.formCard}>
        <h2 className={styles.cardTitle}>Crear negocio y administrador principal</h2>
        <form onSubmit={createBusiness} className={styles.form}>
          <div>
            <label className={styles.label}>Nombre del negocio *</label>
            <input className="input-field" value={businessName} onChange={(event) => {
              const value = event.target.value;
              setBusinessName(value);
              setSlug(value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
            }} required maxLength={255} />
          </div>
          <div>
            <label className={styles.label}>Dirección web (slug) *</label>
            <input className="input-field" value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase())} required maxLength={60} pattern="[a-z0-9]+(-[a-z0-9]+)*" />
            <small>reecicla.app/recicla/{slug || 'mi-negocio'}</small>
          </div>
          <div>
            <label className={styles.label}>Nombre del administrador principal</label>
            <input className="input-field" value={adminName} onChange={(event) => setAdminName(event.target.value)} />
          </div>
          <div>
            <label className={styles.label}>Teléfono</label>
            <input className="input-field" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </div>
          <div>
            <label className={styles.label}>Correo del administrador principal *</label>
            <input className="input-field" type="email" value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} required />
          </div>
          <div>
            <label className={styles.label}>Contraseña inicial *</label>
            <input className="input-field" type="password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} required minLength={8} />
          </div>
          <button type="submit" className={styles.submitBtn} disabled={loading}>{loading ? 'Creando...' : 'Crear negocio'}</button>
        </form>
      </section>

      <section className={styles.formCard}>
        <h2 className={styles.cardTitle}>Agregar administrador a un negocio</h2>
        <form onSubmit={createAdditionalAdmin} className={styles.form}>
          <div>
            <label className={styles.label}>Negocio *</label>
            <select className="input-field" value={selectedTenantId} onChange={(event) => setSelectedTenantId(event.target.value)} required>
              {tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name} ({tenant.slug})</option>)}
            </select>
          </div>
          <div>
            <label className={styles.label}>Rol *</label>
            <select className="input-field" value={role} onChange={(event) => setRole(event.target.value as typeof role)}>
              <option value="TENANT_ADMIN">TENANT_ADMIN</option>
              <option value="CATALOG_ADMIN">CATALOG_ADMIN</option>
              <option value="INSPECTOR">INSPECTOR</option>
            </select>
          </div>
          <div><label className={styles.label}>Nombre</label><input className="input-field" value={additionalName} onChange={(event) => setAdditionalName(event.target.value)} /></div>
          <div><label className={styles.label}>Teléfono</label><input className="input-field" value={additionalPhone} onChange={(event) => setAdditionalPhone(event.target.value)} /></div>
          <div><label className={styles.label}>Correo *</label><input className="input-field" type="email" value={additionalEmail} onChange={(event) => setAdditionalEmail(event.target.value)} required /></div>
          <div><label className={styles.label}>Contraseña *</label><input className="input-field" type="password" value={additionalPassword} onChange={(event) => setAdditionalPassword(event.target.value)} required minLength={8} /></div>
          <button type="submit" className={styles.submitBtn} disabled={loading || !tenants.length}>{loading ? 'Guardando...' : 'Agregar administrador'}</button>
        </form>
      </section>

      <p className={styles.infoNote}>Los negocios nuevos reciben un catálogo base. Configura sus reglas de precios antes de habilitar las cotizaciones.</p>
    </div>
  );
};
