import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User as UserIcon, Phone, Building2, KeyRound } from 'lucide-react';
import { ApiService } from '../../../services/api';
import type { AuthResponse } from '../../../types';
import styles from '../AuthModal.module.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (authData: AuthResponse) => void;
  defaultTenantId: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultTenantId,
}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [tenantId, setTenantId] = useState(defaultTenantId);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setPassword('');
      setName('');
      setPhone('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const res = await ApiService.login({ tenant_id: tenantId, email, password });
        onSuccess(res);
      } else {
        const res = await ApiService.register({
          tenant_id: tenantId,
          email,
          password,
          name: name || undefined,
          phone: phone || undefined,
        });
        onSuccess(res);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error en la autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={`glass-panel animate-fade-in ${styles.modal}`}>
        <button onClick={onClose} className={styles.closeButton}>
          <X size={16} />
        </button>

        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <KeyRound size={26} color="#0071e3" />
          </div>
          <h3 className={styles.title}>
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h3>
          <p className={styles.subtitle}>
            {isLogin ? 'Ingresá con tus credenciales de cliente' : 'Registrate para solicitar y guardar cotizaciones'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className={`apple-nav-container ${styles.tabNav}`}>
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(null); }}
            className={`apple-nav-button ${styles.tabButton} ${isLogin ? 'active' : ''}`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(null); }}
            className={`apple-nav-button ${styles.tabButton} ${!isLogin ? 'active' : ''}`}
          >
            Registrarse
          </button>
        </div>

        {error && (
          <div className={styles.alertError}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div>
            <label className={styles.label}>
              <Building2 size={13} color="#0071e3" /> ID de Tenant
            </label>
            <input
              type="text"
              className="input-field"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              required
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label className={styles.label}>
                  <UserIcon size={13} color="#0071e3" /> Nombre Completo
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ej. Juan Pérez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className={styles.label}>
                  <Phone size={13} color="#34c759" /> Celular / Teléfono
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ej. +591 71234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </>
          )}

          <div>
            <label className={styles.label}>
              <Mail size={13} color="#0071e3" /> Correo Electrónico
            </label>
            <input
              type="email"
              className="input-field"
              placeholder="cliente@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className={styles.label}>
              <Lock size={13} color="#0071e3" /> Contraseña
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className={`btn-primary ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? 'Procesando...' : isLogin ? 'Ingresar a la Plataforma' : 'Crear Cuenta'}
          </button>
        </form>
      </div>
    </div>
  );
};
