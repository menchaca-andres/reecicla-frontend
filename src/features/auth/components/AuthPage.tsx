import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, RefreshCw, ExternalLink } from 'lucide-react';
import { ApiService } from '../../../services/api';
import type { AuthResponse } from '../../../types';
import { AppleDotsRing } from './AppleDotsRing';
import styles from '../AuthModal.module.css';

interface AuthPageProps {
  onSuccess: (authData: AuthResponse) => void;
  onCancel: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const res = await ApiService.login({ email, password });
        onSuccess(res);
      } else {
        const res = await ApiService.register({
          email,
          password,
          name: name || undefined,
          phone: phone || undefined,
        });
        onSuccess(res);
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error en la autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.authCard}>
        <button onClick={onCancel} className={styles.backButton} title="Volver">
          <ArrowLeft size={14} /> Volver
        </button>

        {/* Apple ID Style Logo Ring Header */}
        <div className={styles.header}>
          <div className={styles.logoRingContainer}>
            <AppleDotsRing />
            <div className={styles.logoCenter}>
              <RefreshCw size={26} color="#1d1d1f" />
            </div>
          </div>

          <h3 className={styles.title}>
            {isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
          </h3>
          <p className={styles.subtitle}>
            {isLogin
              ? 'Ingresa con tu cuenta para continuar'
              : 'Registrate para solicitar y gestionar cotizaciones'}
          </p>
        </div>

        {error && <div className={styles.alertError}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Registration Extra Fields */}
          {!isLogin && (
            <>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Nombre completo</label>
                <div className={styles.inputWrapper}>
                  <input
                    type="text"
                    className={styles.appleInput}
                    placeholder="Nombre y Apellido"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Teléfono / Celular</label>
                <div className={styles.inputWrapper}>
                  <input
                    type="text"
                    className={styles.appleInput}
                    placeholder="+591 70000000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* Email Input */}
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Reecicla ID (Correo electrónico)</label>
            <div className={styles.inputWrapper}>
              <input
                type="email"
                className={styles.appleInput}
                placeholder="ejemplo@reecicla.bo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password Input with Action Arrow */}
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Contraseña</label>
            <div className={styles.inputWrapper}>
              <input
                type="password"
                className={styles.appleInput}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="submit"
                className={styles.inputActionButton}
                disabled={loading || !email || !password}
                title="Continuar"
              >
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? 'Procesando...' : isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        </form>

        {/* Footer Links */}
        <div className={styles.linksContainer}>
          {isLogin ? (
            <>
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => {
                  setIsLogin(false);
                  setError(null);
                }}
              >
                Crear cuenta
              </button>
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => alert('Contacta a soporte@reecicla.bo para restablecer tu contraseña.')}
              >
                ¿Olvidaste tu Reecicla ID o la contraseña? <ExternalLink size={12} />
              </button>
            </>
          ) : (
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => {
                setIsLogin(true);
                setError(null);
              }}
            >
              ¿Ya tienes una cuenta? Iniciar sesión
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
