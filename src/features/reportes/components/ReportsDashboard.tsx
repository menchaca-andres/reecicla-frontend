import React, { useCallback, useEffect, useState } from 'react';
import { ChartColumn, Download, RefreshCw, CircleAlert, Info } from 'lucide-react';
import { ApiService } from '../../../services/api';
import type { AmountsByCurrency, ReportSummary } from '../../../types';
import styles from '../ReportsDashboard.module.css';

interface ReportsDashboardProps {
  token: string | null;
}

const QUOTE_STATUS_LABELS: Record<string, string> = {
  ANONYMOUS: 'Anónimas (sin cuenta)',
  PENDING: 'Pendientes',
  ACCEPTED: 'Aceptadas',
  REJECTED: 'Rechazadas',
  EXPIRED: 'Vencidas',
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  ACCEPTED: 'Pedido aceptado',
  BOX_REQUESTED: 'Caja solicitada',
  BOX_SHIPPED: 'Caja enviada',
  IN_TRANSIT: 'Equipo en tránsito',
  RECEIVED: 'Equipo recibido',
  INSPECTING: 'En inspección',
  INSPECTED: 'Inspección completada',
  ADJUSTMENT_PENDING: 'Ajuste pendiente',
  ADJUSTMENT_REJECTED: 'Ajuste rechazado',
  PAYMENT_PENDING: 'Pago pendiente',
  PAID: 'Pagado',
  DISPOSED: 'Equipo procesado',
  CLOSED: 'Cerrado',
  CANCELLED: 'Cancelado',
};

// Orden del proceso, para que las barras sigan el flujo de la orden.
const ORDER_STATUS_ORDER = Object.keys(ORDER_STATUS_LABELS);

const METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: 'Transferencia bancaria',
  CHECK: 'Cheque',
};

const QUICK_RANGES = [7, 30, 90];

function toInputDate(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - (days - 1));
  return toInputDate(date);
}

function formatAmounts(amounts: AmountsByCurrency): string {
  const entries = Object.entries(amounts);
  if (entries.length === 0) return 'Bs 0,00';
  return entries
    .map(([currency, value]) =>
      `${currency === 'BOB' ? 'Bs' : currency} ${value.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
    .join(' · ');
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' });
}

function sortOrderStatuses(entries: [string, number][]): [string, number][] {
  const rank = (status: string) => {
    const index = ORDER_STATUS_ORDER.indexOf(status);
    return index === -1 ? ORDER_STATUS_ORDER.length : index;
  };
  return [...entries].sort((a, b) => rank(a[0]) - rank(b[0]));
}

interface BarListProps {
  rows: Array<{ label: string; value: number; tone?: 'blue' | 'green' | 'orange' | 'red' | 'gray' }>;
  emptyText: string;
}

const BarList: React.FC<BarListProps> = ({ rows, emptyText }) => {
  const max = Math.max(0, ...rows.map((row) => row.value));
  if (max === 0) return <p className={styles.emptyText}>{emptyText}</p>;
  return (
    <ul className={styles.barList}>
      {rows.map((row) => (
        <li key={row.label} className={styles.barRow}>
          <span className={styles.barLabel}>{row.label}</span>
          <span className={styles.barTrack}>
            <span
              className={`${styles.barFill} ${styles[row.tone ?? 'blue']}`}
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          </span>
          <span className={styles.barValue}>{row.value}</span>
        </li>
      ))}
    </ul>
  );
};

export const ReportsDashboard: React.FC<ReportsDashboardProps> = ({ token }) => {
  const [initialRange] = useState(() => ({ from: daysAgo(30), to: toInputDate(new Date()) }));
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (rangeFrom: string, rangeTo: string) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setSummary(await ApiService.getReportSummary(token, rangeFrom, rangeTo));
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar el reporte.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Carga inicial con los últimos 30 días; luego el usuario aplica el filtro con el botón.
  useEffect(() => {
    load(initialRange.from, initialRange.to);
  }, [load, initialRange]);

  const applyQuickRange = (days: number) => {
    const rangeFrom = daysAgo(days);
    const rangeTo = toInputDate(new Date());
    setFrom(rangeFrom);
    setTo(rangeTo);
    load(rangeFrom, rangeTo);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (from && to && from > to) {
      setError('La fecha "desde" no puede ser posterior a la fecha "hasta".');
      return;
    }
    load(from, to);
  };

  const handleExport = async () => {
    if (!token) return;
    setExporting(true);
    setError(null);
    try {
      const blob = await ApiService.downloadReportCsv(token, from, to);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte-${from}-a-${to}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'No se pudo exportar el reporte.');
    } finally {
      setExporting(false);
    }
  };

  const hasData = !!summary && (
    summary.quotes.total > 0 ||
    summary.orders.created_in_period > 0 ||
    summary.payments.completed + summary.payments.failed > 0 ||
    summary.dispositions.total > 0
  );

  return (
    <div className={styles.container}>
      <div className={`glass-panel ${styles.headerCard}`}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}><ChartColumn size={22} /></div>
          <div>
            <h2 className={styles.title}>Reportes del negocio</h2>
            <p className={styles.subtitle}>
              Cotizaciones, órdenes, pagos y destino de los equipos de tu negocio.
            </p>
          </div>
        </div>
        <button
          type="button"
          className={`btn-secondary ${styles.smallBtn}`}
          onClick={handleExport}
          disabled={exporting || loading || !summary}
        >
          <Download size={14} /> {exporting ? 'Exportando...' : 'Exportar CSV'}
        </button>
      </div>

      <form className={`glass-panel ${styles.filters}`} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span>Desde</span>
          <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} required />
        </label>
        <label className={styles.field}>
          <span>Hasta</span>
          <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} required />
        </label>
        <div className={styles.quickRanges}>
          {QUICK_RANGES.map((days) => (
            <button key={days} type="button" className={styles.chip} onClick={() => applyQuickRange(days)}>
              Últimos {days} días
            </button>
          ))}
        </div>
        <button type="submit" className={`btn-primary ${styles.smallBtn}`} disabled={loading}>
          <RefreshCw size={14} /> {loading ? 'Cargando...' : 'Aplicar'}
        </button>
      </form>

      {error && (
        <div className={styles.alertError}><CircleAlert size={16} /> {error}</div>
      )}

      {summary && (
        <p className={styles.meta}>
          Periodo {summary.period.from} a {summary.period.to} ·{' '}
          {summary.last_event_at
            ? `datos actualizados con eventos hasta ${formatDateTime(summary.last_event_at)}`
            : 'aún no se recibieron eventos para este negocio'}
        </p>
      )}

      {summary && !hasData && !loading && (
        <div className={styles.alertInfo}>
          <Info size={16} /> No hay actividad registrada en este periodo. Prueba con un rango de fechas más amplio.
        </div>
      )}

      {summary && (
        <>
          <section className={styles.kpis}>
            <article className={`glass-panel ${styles.kpi}`}>
              <span className={styles.kpiLabel}>Cotizaciones</span>
              <strong className={styles.kpiValue}>{summary.quotes.total}</strong>
              <span className={styles.kpiHint}>{summary.quotes.acceptance_rate}% de aceptación</span>
            </article>
            <article className={`glass-panel ${styles.kpi}`}>
              <span className={styles.kpiLabel}>Órdenes creadas</span>
              <strong className={styles.kpiValue}>{summary.orders.created_in_period}</strong>
              <span className={styles.kpiHint}>en el periodo</span>
            </article>
            <article className={`glass-panel ${styles.kpi}`}>
              <span className={styles.kpiLabel}>Pagado a clientes</span>
              <strong className={styles.kpiValue}>{formatAmounts(summary.payments.completed_amount)}</strong>
              <span className={styles.kpiHint}>
                {summary.payments.completed} completados · {summary.payments.failed} fallidos
              </span>
            </article>
            <article className={`glass-panel ${styles.kpi}`}>
              <span className={styles.kpiLabel}>Equipos con destino final</span>
              <strong className={styles.kpiValue}>{summary.dispositions.total}</strong>
              <span className={styles.kpiHint}>
                {summary.dispositions.by_type.RESALE} reventa · {summary.dispositions.by_type.RECYCLE} reciclaje · {summary.dispositions.by_type.RETURN} devolución
              </span>
            </article>
          </section>

          <section className={styles.grid}>
            <article className={`glass-panel ${styles.card}`}>
              <h3 className={styles.cardTitle}>Cotizaciones por estado</h3>
              <BarList
                emptyText="Sin cotizaciones en el periodo."
                rows={Object.entries(summary.quotes.by_status).map(([status, value]) => ({
                  label: QUOTE_STATUS_LABELS[status] || status,
                  value,
                  tone: status === 'ACCEPTED' ? 'green' : status === 'REJECTED' ? 'red' : status === 'EXPIRED' ? 'gray' : 'blue',
                }))}
              />
              <dl className={styles.stats}>
                <div><dt>Monto cotizado</dt><dd>{formatAmounts(summary.quotes.quoted_amount)}</dd></div>
                <div><dt>Monto aceptado</dt><dd>{formatAmounts(summary.quotes.accepted_amount)}</dd></div>
                <div><dt>Iniciales / ajustadas</dt><dd>{summary.quotes.by_type.INITIAL} / {summary.quotes.by_type.ADJUSTED}</dd></div>
              </dl>
            </article>

            <article className={`glass-panel ${styles.card}`}>
              <h3 className={styles.cardTitle}>Órdenes por estado actual</h3>
              <p className={styles.cardHint}>Todas las órdenes del negocio, sin importar el periodo.</p>
              <BarList
                emptyText="Todavía no hay órdenes."
                rows={sortOrderStatuses(Object.entries(summary.orders.current_by_status)).map(([status, value]) => ({
                  label: ORDER_STATUS_LABELS[status] || status,
                  value,
                  tone: status === 'CLOSED' ? 'green' : status === 'CANCELLED' || status === 'ADJUSTMENT_REJECTED' ? 'red' : 'blue',
                }))}
              />
            </article>

            <article className={`glass-panel ${styles.card}`}>
              <h3 className={styles.cardTitle}>Pagos por método</h3>
              {Object.keys(summary.payments.by_method).length === 0 ? (
                <p className={styles.emptyText}>Sin pagos en el periodo.</p>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr><th>Método</th><th>Completados</th><th>Fallidos</th><th>Monto pagado</th></tr>
                  </thead>
                  <tbody>
                    {Object.entries(summary.payments.by_method).map(([method, row]) => (
                      <tr key={method}>
                        <td>{METHOD_LABELS[method] || method}</td>
                        <td>{row.completed}</td>
                        <td>{row.failed}</td>
                        <td>{formatAmounts(row.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </article>

            <article className={`glass-panel ${styles.card}`}>
              <h3 className={styles.cardTitle}>Destino de los equipos</h3>
              <BarList
                emptyText="Ningún equipo con destino final en el periodo."
                rows={[
                  { label: 'Reventa', value: summary.dispositions.by_type.RESALE, tone: 'blue' },
                  { label: 'Reciclaje', value: summary.dispositions.by_type.RECYCLE, tone: 'green' },
                  { label: 'Devolución al cliente', value: summary.dispositions.by_type.RETURN, tone: 'orange' },
                ]}
              />
            </article>

            <article className={`glass-panel ${styles.card} ${styles.wide}`}>
              <h3 className={styles.cardTitle}>Tipos de equipo más cotizados</h3>
              {summary.quotes.by_device_type.length === 0 ? (
                <p className={styles.emptyText}>Sin cotizaciones en el periodo.</p>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr><th>Tipo de equipo</th><th>Cotizaciones</th><th>Aceptadas</th><th>Aceptación</th></tr>
                  </thead>
                  <tbody>
                    {summary.quotes.by_device_type.map((row) => (
                      <tr key={row.device_type_name}>
                        <td>{row.device_type_name}</td>
                        <td>{row.total}</td>
                        <td>{row.accepted}</td>
                        <td>{row.total ? Math.round((row.accepted / row.total) * 100) : 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </article>
          </section>
        </>
      )}
    </div>
  );
};
