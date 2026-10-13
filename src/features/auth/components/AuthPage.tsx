import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, RefreshCw, ExternalLink } from 'lucide-react';
import { ApiService } from '../../../services/api';
import type { AuthResponse, PlatformAuthResponse } from '../../../types';
import { AppleDotsRing } from './AppleDotsRing';
import styles from '../AuthModal.module.css';

interface TenantAuthPageProps {
  mode?: 'tenant';
  onSuccess: (authData: AuthResponse) => void;
  onCancel: () => void;
}

interface PlatformAuthPageProps {
  mode: 'platform';
  onPlatformSuccess: (authData: PlatformAuthResponse) => void;
  onCancel: () => void;
  initialError?: string | null;
}

type AuthPageProps = TenantAuthPageProps | PlatformAuthPageProps;

export const AuthPage: React.FC<AuthPageProps> = ({
  onCancel,
  ...props
}) => {
  const platformMode = props.mode === 'platform';
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationPending, setVerificationPending] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [registrationNotice, setRegistrationNotice] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    props.mode === 'platform' ? props.initialError ?? null : null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        if (props.mode === 'platform') {
          const res = await ApiService.platformLogin({ email, password });
          props.onPlatformSuccess(res);
        } else {
          const res = await ApiService.login({ email, password });
          props.onSuccess(res);
        }
      } else {
        if (props.mode !== 'platform') {
          if (verificationPending) {
            const res = await ApiService.verifyRegistration({ email, code: verificationCode });
            props.onSuccess(res);
          } else {
            const res = await ApiService.register({
              email,
              password,
              name: name || undefined,
              phone: phone || undefined,
            });
            setVerificationPending(true);
            setRegistrationNotice(res.message);
          }
        }
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
            {verificationPending
              ? 'Ingresa el código que enviamos a tu correo para activar la cuenta de este negocio.'
              : isLogin
                ? 'Ingresa con tu cuenta para continuar'
                : 'Registrate para solicitar y gestionar cotizaciones'}
          </p>
        </div>

        {error && <div className={styles.alertError}>{error}</div>}
        {registrationNotice && <div className={styles.alertSuccess} role="status">{registrationNotice}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Registration Extra Fields */}
          {!platformMode && !isLogin && !verificationPending && (
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
                readOnly={verificationPending}
                required
              />
            </div>
          </div>

          {!verificationPending && (
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Contraseña</label>
              <div className={styles.inputWrapper}>
                <input
                  type="password"
                  className={styles.appleInput}
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  maxLength={72}
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
          )}

          {verificationPending && (
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel} htmlFor="registration-code">Código de verificación</label>
              <div className={styles.inputWrapper}>
                <input
                  id="registration-code"
                  type="text"
                  className={styles.appleInput}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button type="submit" className={styles.submitButton} disabled={loading || (verificationPending && verificationCode.length !== 6)}>
            {loading ? 'Procesando...' : verificationPending ? 'Verificar y crear cuenta' : isLogin ? 'Iniciar sesión' : 'Enviar código'}
          </button>
        </form>

        {/* Footer Links */}
        <div className={styles.linksContainer}>
          {platformMode ? (
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => alert('Contacta a soporte@reecicla.bo para restablecer tu contraseña.')}
            >
              ¿Olvidaste tu Reecicla ID o la contraseña? <ExternalLink size={12} />
            </button>
          ) : isLogin ? (
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
          ) : verificationPending ? (
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => {
                setVerificationPending(false);
                setVerificationCode('');
                setRegistrationNotice(null);
                setError(null);
              }}
            >
              Volver al registro
            </button>
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
