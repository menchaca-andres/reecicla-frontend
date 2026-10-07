import React from 'react';
import { CheckCircle2, Calendar, Cpu, Tag } from 'lucide-react';
import type { Quote } from '../../../types';
import styles from '../QuoteResultCard.module.css';

interface QuoteResultCardProps {
  quote: Quote;
  onNewQuote: () => void;
}

export const QuoteResultCard: React.FC<QuoteResultCardProps> = ({ quote, onNewQuote }) => {
  const basePrice = Number(quote.base_price);
  const adjustment = Number(quote.adjustment);
  const finalPrice = Number(quote.final_price);

  return (
    <div className={`glass-panel animate-fade-in ${styles.card}`}>
      <div className={styles.iconWrapper}>
        <CheckCircle2 size={36} color="#10b981" />
      </div>

      <span className={`badge badge-pending ${styles.badgeMargin}`}>
        Estado: {quote.status}
      </span>

      <h2 className={styles.title}>
        ¡Cotización Generada!
      </h2>
      <p className={styles.subtitle}>
        ID de cotización: <code className={styles.quoteIdCode}>{quote.id}</code>
      </p>

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
          <span style={{ color: '#ffffff', fontWeight: 600 }}>Bs. {basePrice.toFixed(2)}</span>
        </div>
        <div className={styles.pricingRowMiddle}>
          <span>Ajuste por Condición:</span>
          <span style={{ color: adjustment < 0 ? '#f87171' : '#34d399', fontWeight: 600 }}>
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

      <button onClick={onNewQuote} className={`btn-secondary ${styles.btnFull}`}>
        Realizar otra cotización
      </button>
    </div>
  );
};
