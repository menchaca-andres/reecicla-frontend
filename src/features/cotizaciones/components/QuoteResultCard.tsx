import React, { useState } from 'react';
import { CheckCircle2, Calendar, Cpu, Tag, ArrowRight, UserCheck } from 'lucide-react';
import type { AuthResponse, Quote } from '../../../types';
import { ApiService } from '../../../services/api';
import styles from '../QuoteResultCard.module.css';

interface QuoteResultCardProps {
  quote: Quote;
  token?: string | null;
  onNewQuote: () => void;
  onGuestRegistered?: (authData: AuthResponse) => void;
  onNeedAuth: () => void;
}

export const QuoteResultCard: React.FC<QuoteResultCardProps> = ({ quote: initialQuote, token, onNewQuote, onGuestRegistered, onNeedAuth }) => {
  const [quote, setQuote] = useState<Quote>(initialQuote);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const needsSignIn = error?.includes('Inicia sesión') ?? false;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const basePrice = Number(quote.base_price);
  const adjustment = Number(quote.adjustment);
  const finalPrice = Number(quote.final_price);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await ApiService.acceptQuote(quote.id, token, {
        customer_name: name,
        customer_email: email,
        phone,
        address,
      });
      setQuote(res.quote);
      setShowForm(false);
      if (res.token && res.user) {
        onGuestRegistered?.({ message: 'Cliente vinculado a la cotización.', token: res.token, user: res.user });
      }
    } catch (err: any) {
      setError(err.message || 'Error al aceptar la cotización');
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
          {needsSignIn && (
            <button type="button" onClick={onNeedAuth} className="btn-secondary" style={{ display: 'block', marginTop: '12px' }}>
              Iniciar sesión
            </button>
          )}
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
      {!isAccepted && !showForm && (
        <div style={{ marginBottom: '16px' }}>
          <button onClick={() => setShowForm(true)} className="btn-primary" style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600, fontSize: '15px' }}>
            Aceptar esta Cotización <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* Formulario de aceptación */}
      {showForm && !isAccepted && (
        <form onSubmit={handleAccept} className={styles.formContainer}>
          <h3 className={styles.formTitle}>
            <UserCheck size={20} color="#0071e3" /> Datos para coordinar el retiro
          </h3>
          <p className={styles.formSubtitle}>
            Completá tus datos de contacto para que coordinemos el retiro o envío del equipo.
          </p>

          <div className={styles.inputGroup}>
            <div>
              <label className={styles.inputLabel}>Nombre Completo *</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Ej: Juan Pérez" style={{ width: '100%', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label className={styles.inputLabel}>Correo Electrónico *</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="ejemplo@correo.com" style={{ width: '100%', boxSizing: 'border-box' }} />
            </div>

            <div className={styles.inputRow}>
              <div>
                <label className={styles.inputLabel}>Teléfono / Celular *</label>
                <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" placeholder="70012345" style={{ width: '100%', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label className={styles.inputLabel}>Dirección de Recolección</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="input-field" placeholder="Av. Principal #123" style={{ width: '100%', boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1, padding: '12px' }}>
              {loading ? 'Confirmando...' : 'Confirmar y Aceptar'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary" style={{ padding: '12px 20px' }}>
              Cancelar
            </button>
          </div>
        </form>
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
