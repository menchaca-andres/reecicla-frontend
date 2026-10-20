import React, { useState } from 'react';
import { CheckCircle2, Calendar, Cpu, Tag, ArrowRight, UserCheck } from 'lucide-react';
import type { AuthResponse, Quote, User } from '../../../types';
import { ApiService } from '../../../services/api';
import styles from '../QuoteResultCard.module.css';

interface QuoteResultCardProps {
  quote: Quote;
  token?: string | null;
  user?: User | null;
  onUserUpdate?: (user: User) => void;
  onAuthSuccess?: (authData: AuthResponse) => void;
  onNewQuote: () => void;
}

export const QuoteResultCard: React.FC<QuoteResultCardProps> = ({
  quote: initialQuote,
  token,
  user,
  onUserUpdate,
  onAuthSuccess,
  onNewQuote,
}) => {
  const [quote, setQuote] = useState<Quote>(initialQuote);
  const [acceptanceStep, setAcceptanceStep] = useState<
    'closed' | 'choice' | 'guest' | 'login' | 'register' | 'registration-verify' | 'authenticated'
  >('closed');
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrationNotice, setRegistrationNotice] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionUser, setSessionUser] = useState<User | null>(null);

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [address, setAddress] = useState(user?.pickup_address ?? '');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const activeToken = sessionToken ?? token;
  const activeUser = sessionUser ?? user;
  const openAcceptance = () => {
    setError(null);
    setAcceptanceStep(activeToken && activeUser ? 'authenticated' : 'choice');
  };

  const basePrice = Number(quote.base_price);
  const adjustment = Number(quote.adjustment);
  const finalPrice = Number(quote.final_price);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (activeToken && activeUser) {
        const profile = await ApiService.updateProfile(
          { name, phone, pickup_address: address },
          activeToken
        );
        setSessionUser(profile.user);
        onUserUpdate?.(profile.user);
      }
      const res = await ApiService.acceptQuote(quote.id, activeToken, {
        customer_name: name,
        customer_email: email,
        phone,
        address,
        ...(verificationRequired ? { verification_code: verificationCode } : {}),
      });
      if ('verification_required' in res) {
        setVerificationRequired(true);
        setError(null);
        return;
      }
      setQuote(res.quote);
      setAcceptanceStep('closed');
    } catch (err: any) {
      setError(err.message || 'Error al aceptar la cotización');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await ApiService.acceptQuote(quote.id, activeToken, {
        customer_name: name,
        customer_email: email,
        phone,
        address,
      });
      if ('verification_required' in res) {
        setVerificationCode('');
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'No se pudo reenviar el código');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (acceptanceStep === 'login') {
        const result = await ApiService.login({ email, password });
        setSessionToken(result.token);
        setSessionUser(result.user);
        setName(result.user.name ?? '');
        setEmail(result.user.email);
        setPhone(result.user.phone ?? '');
        setAddress(result.user.pickup_address ?? '');
        onAuthSuccess?.(result);
        setAcceptanceStep('authenticated');
      } else if (acceptanceStep === 'register') {
        const result = await ApiService.register({
          email,
          password,
          name,
          phone: phone || undefined,
        });
        setAcceptanceStep('registration-verify');
        setRegistrationNotice(result.message);
      } else if (acceptanceStep === 'registration-verify') {
        const result = await ApiService.verifyRegistration({ email, code: verificationCode });
        setSessionToken(result.token);
        setSessionUser(result.user);
        onAuthSuccess?.(result);
        setVerificationCode('');
        setAcceptanceStep('authenticated');
      }
    } catch (err: any) {
      setError(err.message || 'No se pudo completar la autenticación');
    } finally {
      setLoading(false);
    }
  };

  const isAccepted = quote.status === 'ACCEPTED';

  return (
    <div className={`animate-fade-in ${styles.card}`}>
      <div className={styles.iconWrapper}>
        <CheckCircle2 size={32} color={isAccepted ? '#34c759' : '#0071e3'} />
      </div>

      <div className={styles.badgeMargin}>
        <span className={`badge ${isAccepted ? 'badge-active' : 'badge-pending'}`}>
          Estado: {quote.status}
        </span>
      </div>

      <h2 className={styles.title}>
        {isAccepted ? '¡Cotización Aceptada!' : '¡Cotización Generada!'}
      </h2>
      <p className={styles.subtitle}>
        ID de cotización: <code className={styles.quoteIdCode}>{quote.id}</code>
      </p>

      {error && (
        <div style={{ background: 'rgba(255, 59, 48, 0.08)', border: '1px solid rgba(255, 59, 48, 0.2)', color: '#ff3b30', padding: '12px 16px', borderRadius: '14px', marginBottom: '24px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* Detalle del equipo */}
      <div className={styles.detailsGrid}>
        <div>
          <p className={styles.fieldLabel}><Cpu size={14} /> Equipo</p>
          <p className={styles.fieldValue}>{quote.device_type}</p>
        </div>
        <div>
          <p className={styles.fieldLabel}><Tag size={14} /> Marca / Modelo</p>
          <p className={styles.fieldValuePlain}>{quote.brand || 'Genérica'} {quote.model || ''}</p>
        </div>
        <div>
          <p className={styles.fieldLabel}>Condición Declarada</p>
          <p className={styles.fieldValueGreen}>{quote.condition}</p>
        </div>
        <div>
          <p className={styles.fieldLabel}><Calendar size={14} /> Año de Fabricación</p>
          <p className={styles.fieldValuePlain}>{quote.year || 'N/A'}</p>
        </div>
      </div>

      {/* Desglose de precios en Bs */}
      <div className={styles.pricingBox}>
        <div className={styles.pricingRow}>
          <span>Precio Base Estimado:</span>
          <span style={{ color: '#1d1d1f', fontWeight: 600 }}>Bs. {basePrice.toFixed(2)}</span>
        </div>
        <div className={styles.pricingRowMiddle}>
          <span>Ajuste por Condición:</span>
          <span style={{ color: adjustment < 0 ? '#ff3b30' : '#34c759', fontWeight: 600 }}>
            {adjustment >= 0 ? `+Bs. ${adjustment.toFixed(2)}` : `-Bs. ${Math.abs(adjustment).toFixed(2)}`}
          </span>
        </div>
        <div className={styles.pricingFinalRow}>
          <span className={styles.finalLabel}>Precio Final Ofrecido:</span>
          <span className={styles.finalPrice}>
            <span className={styles.currencyPrefix}>Bs.</span>{finalPrice.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Botón para abrir formulario de aceptación */}
      {!isAccepted && acceptanceStep === 'closed' && (
        <div style={{ marginBottom: '16px' }}>
          <button
            onClick={openAcceptance}
            disabled={Boolean(token && !user)}
            className="btn-primary"
            style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600, fontSize: '15px' }}
          >
            {token && !user ? 'Cargando tus datos...' : 'Aceptar esta Cotización'}
            {!(token && !user) && <ArrowRight size={18} />}
          </button>
        </div>
      )}

      {!isAccepted && acceptanceStep !== 'closed' && (
        <section className={styles.formContainer}>
          {acceptanceStep === 'choice' && (
            <>
              <h3 className={styles.formTitle}>¿Cómo deseas continuar?</h3>
              <p className={styles.formSubtitle}>
                Inicia sesión o crea una cuenta para guardar tus datos y consultar tus cotizaciones.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button type="button" className="btn-primary" onClick={() => setAcceptanceStep('login')}>
                  Iniciar sesión
                </button>
                <button type="button" className="btn-secondary" onClick={() => {
                  setPassword('');
                  setAcceptanceStep('register');
                }}>
                  Crear cuenta
                </button>
                <button type="button" className="btn-secondary" onClick={() => setAcceptanceStep('guest')}>
                  Continuar como invitado
                </button>
              </div>
            </>
          )}

          {(acceptanceStep === 'login' || acceptanceStep === 'register' || acceptanceStep === 'registration-verify') && (
            <form onSubmit={handleAuth}>
              <h3 className={styles.formTitle}>
                {acceptanceStep === 'login'
                  ? 'Inicia sesión para continuar'
                  : acceptanceStep === 'register'
                    ? 'Crea tu cuenta'
                    : 'Confirma tu correo'}
              </h3>
              <p className={styles.formSubtitle}>
                {acceptanceStep === 'registration-verify'
                  ? `Ingresa el código que enviamos a ${email} para activar tu cuenta.`
                  : acceptanceStep === 'register'
                    ? 'Verifica tu correo con un código para crear la cuenta y continuar con la cotización.'
                    : 'Al iniciar sesión, usaremos los datos guardados en este negocio.'}
              </p>
              {registrationNotice && acceptanceStep === 'registration-verify' && (
                <p className={styles.formSubtitle} role="status">{registrationNotice}</p>
              )}
              <div className={styles.inputGroup} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {acceptanceStep === 'register' && (
                  <>
                    <div>
                      <label className={styles.inputLabel}>Nombre completo *</label>
                      <input className="input-field" required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                    </div>
                    <div>
                      <label className={styles.inputLabel}>Teléfono / Celular</label>
                      <input className="input-field" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
                    </div>
                  </>
                )}
                <div>
                  <label className={styles.inputLabel}>Correo electrónico *</label>
                  <input
                    className="input-field"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    readOnly={acceptanceStep === 'registration-verify'}
                    autoComplete="email"
                  />
                </div>
                {acceptanceStep !== 'registration-verify' ? (
                  <div>
                    <label className={styles.inputLabel}>Contraseña *</label>
                    <input
                      className="input-field"
                      type="password"
                      required
                      minLength={8}
                      maxLength={72}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={acceptanceStep === 'login' ? 'current-password' : 'new-password'}
                    />
                  </div>
                ) : (
                  <div>
                    <label className={styles.inputLabel}>Código de verificación *</label>
                    <input
                      className="input-field"
                      required
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1 }}>
                  {loading
                    ? 'Procesando...'
                    : acceptanceStep === 'login'
                      ? 'Iniciar sesión'
                      : acceptanceStep === 'register'
                        ? 'Enviar código y continuar'
                        : 'Verificar y continuar'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => {
                  setError(null);
                  setRegistrationNotice(null);
                  setAcceptanceStep('choice');
                }}>
                  Volver
                </button>
              </div>
            </form>
          )}

          {(acceptanceStep === 'guest' || acceptanceStep === 'authenticated') && (
            <form onSubmit={handleAccept}>
              <h3 className={styles.formTitle}>
                <UserCheck size={20} color="#0071e3" /> Datos para coordinar el retiro
              </h3>
              <p className={styles.formSubtitle}>
                {verificationRequired
                  ? `Enviamos un código a ${email}. Ingrésalo para verificar tu correo y aceptar la cotización.`
                  : acceptanceStep === 'authenticated'
                    ? 'Revisa tus datos guardados y confirma dónde recolectar el equipo.'
                    : 'Completa tus datos. Te enviaremos un código para verificar el correo antes de aceptar.'}
              </p>
              <div className={styles.inputGroup}>
                {!verificationRequired ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label className={styles.inputLabel}>Nombre completo *</label>
                      <input className="input-field" required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                    </div>
                    <div>
                      <label className={styles.inputLabel}>Correo electrónico *</label>
                      <input className="input-field" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} readOnly={acceptanceStep === 'authenticated'} autoComplete="email" />
                    </div>
                    <div>
                      <label className={styles.inputLabel}>Teléfono / Celular *</label>
                      <input className="input-field" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
                    </div>
                    <div>
                      <label className={styles.inputLabel}>Dirección de recolección</label>
                      <input className="input-field" value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className={styles.inputLabel}>Código de verificación *</label>
                    <input
                      className="input-field"
                      required
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1 }}>
                  {loading
                    ? 'Procesando...'
                    : verificationRequired
                      ? 'Verificar y aceptar'
                      : acceptanceStep === 'authenticated'
                        ? 'Confirmar y aceptar cotización'
                        : 'Enviar código'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setAcceptanceStep('choice')}>
                  Volver
                </button>
              </div>
              {verificationRequired && (
                <button type="button" onClick={handleResendCode} disabled={loading} className="btn-secondary" style={{ width: '100%', marginTop: '12px' }}>
                  Reenviar código
                </button>
              )}
            </form>
          )}
        </section>
      )}

      {/* Confirmación exitosa */}
      {isAccepted && (
        <div className={styles.successAlert}>
          ✓ Cotización aceptada exitosamente. Te contactaremos a la brevedad para coordinar el retiro del equipo.
        </div>
      )}

      <button onClick={onNewQuote} className={`btn-secondary ${styles.btnFull}`}>
        Realizar otra cotización
      </button>
    </div>
  );
};
