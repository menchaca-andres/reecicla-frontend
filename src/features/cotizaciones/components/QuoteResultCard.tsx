import React from 'react';
import { CheckCircle2, Calendar, Cpu, Tag } from 'lucide-react';
import type { Quote } from '../../../types';

interface QuoteResultCardProps {
  quote: Quote;
  onNewQuote: () => void;
}

export const QuoteResultCard: React.FC<QuoteResultCardProps> = ({ quote, onNewQuote }) => {
  const basePrice = Number(quote.base_price);
  const adjustment = Number(quote.adjustment);
  const finalPrice = Number(quote.final_price);

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '36px', maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
      <div style={{ background: 'rgba(16, 185, 129, 0.15)', width: '64px', height: '64px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
        <CheckCircle2 size={36} color="#10b981" />
      </div>

      <span className="badge badge-pending" style={{ marginBottom: '12px' }}>
        Estado: {quote.status}
      </span>

      <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
        ¡Cotización Generada!
      </h2>
      <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '28px' }}>
        ID de cotización: <code style={{ color: '#34d399', background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '6px' }}>{quote.id}</code>
      </p>

      {/* Detalle del equipo */}
      <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '20px', marginBottom: '24px', textAlign: 'left', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <p style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}><Cpu size={14} /> Equipo</p>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', textTransform: 'capitalize' }}>{quote.device_type}</p>
        </div>
        <div>
          <p style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}><Tag size={14} /> Marca / Modelo</p>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff' }}>{quote.brand || 'Genérica'} {quote.model || ''}</p>
        </div>
        <div>
          <p style={{ fontSize: '12px', color: '#9ca3af' }}>Condición Declarada</p>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#34d399', textTransform: 'capitalize' }}>{quote.condition}</p>
        </div>
        <div>
          <p style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> Año de Fabricación</p>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>{quote.year || 'N/A'}</p>
        </div>
      </div>

      {/* Desglose de precios en Bs */}
      <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(99, 102, 241, 0.12))', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '20px', padding: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px dashed rgba(255, 255, 255, 0.1)', fontSize: '14px', color: '#9ca3af' }}>
          <span>Precio Base Estimado:</span>
          <span style={{ color: '#ffffff', fontWeight: 600 }}>Bs. {basePrice.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px dashed rgba(255, 255, 255, 0.1)', fontSize: '14px', color: '#9ca3af' }}>
          <span>Ajuste por Condición:</span>
          <span style={{ color: adjustment < 0 ? '#f87171' : '#34d399', fontWeight: 600 }}>
            {adjustment >= 0 ? `+Bs. ${adjustment.toFixed(2)}` : `-Bs. ${Math.abs(adjustment).toFixed(2)}`}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px' }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>Precio Final Ofrecido:</span>
          <span style={{ fontSize: '32px', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '20px', color: '#10b981' }}>Bs.</span>{finalPrice.toFixed(2)}
          </span>
        </div>
      </div>

      <button onClick={onNewQuote} className="btn-secondary" style={{ width: '100%', padding: '14px' }}>
        Realizar otra cotización
      </button>
    </div>
  );
};
