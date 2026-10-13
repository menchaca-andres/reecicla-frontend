import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiService } from '../../../services/api';
import type {
  ChecklistItem,
  Inspection,
  InspectionChecklist,
  InspectionItemInput,
  InspectionItemValue,
  Order,
  PendingInspection,
} from '../../../types';
import styles from '../InspectionManager.module.css';

interface InspectionManagerProps {
  token: string | null;
  /** Solo el rol INSPECTOR registra y completa inspecciones. */
  canRegister: boolean;
}

interface Answer {
  value: boolean | string | null;
  observation: string;
  evidence: string;
}

const CONDITIONS = [
  { id: 'working', label: 'Excelente / Funcionando' },
  { id: 'damaged', label: 'Detalles / Daño Estético' },
  { id: 'broken', label: 'Averiado / Repuestos' },
];

const emptyAnswer: Answer = { value: null, observation: '', evidence: '' };

const conditionLabel = (id?: string | null) => CONDITIONS.find((c) => c.id === id)?.label || id || '—';
const formatDate = (iso: string) => new Date(iso).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' });
const parseEvidence = (text: string) => text.split('\n').map((line) => line.trim()).filter(Boolean);

function formatValue(value: InspectionItemValue): string {
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  return String(value);
}

export const InspectionManager: React.FC<InspectionManagerProps> = ({ token, canRegister }) => {
  const [view, setView] = useState<'pending' | 'done'>('pending');
  const [pending, setPending] = useState<PendingInspection[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [orders, setOrders] = useState<Record<string, Order>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [form, setForm] = useState<InspectionChecklist | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [actualCondition, setActualCondition] = useState('');
  const [observations, setObservations] = useState('');
  const [evidence, setEvidence] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [detail, setDetail] = useState<Inspection | null>(null);
  const [completionResult, setCompletionResult] = useState<'' | 'RESALE' | 'RECYCLE'>('');
  const [justification, setJustification] = useState('');

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [pendingRes, inspectionsRes] = await Promise.all([
        ApiService.getPendingInspections(token),
        ApiService.getInspections(token),
      ]);
      setPending(pendingRes.pending);
      setInspections(inspectionsRes.inspections);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las inspecciones.');
    } finally {
      setLoading(false);
    }
    // Los datos de la orden (número, marca, condición declarada) son complementarios.
    try {
      const res = await ApiService.getAllOrders(token);
      setOrders(Object.fromEntries(res.orders.map((order) => [order.id, order])));
    } catch {
      setOrders({});
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const orderTitle = useCallback((orderId: string, deviceTypeName?: string) => {
    const order = orders[orderId];
    if (!order) return deviceTypeName || 'Equipo';
    return `${order.device_type_name}${order.brand ? ` · ${order.brand}` : ''}${order.model ? ` (${order.model})` : ''}`;
  }, [orders]);

  const orderNumber = useCallback(
    (orderId: string) => orders[orderId]?.order_number || `Orden ${orderId.slice(0, 8)}`,
    [orders]
  );

  const resetForm = () => {
    setForm(null);
    setAnswers({});
    setActualCondition('');
    setObservations('');
    setEvidence('');
  };

  const openForm = async (orderId: string) => {
    if (!token) return;
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);
    try {
      const checklist = await ApiService.getInspectionChecklist(orderId, token);
      setAnswers({});
      setForm(checklist);
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar la checklist.');
    } finally {
      setSubmitting(false);
    }
  };

  const openDetail = async (orderId: string) => {
    if (!token) return;
    setError(null);
    setSuccessMsg(null);
    setCompletionResult('');
    setJustification('');
    try {
      const res = await ApiService.getInspectionByOrder(orderId, token);
      setDetail(res.inspection);
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar la inspección.');
    }
  };

  const updateAnswer = (key: string, changes: Partial<Answer>) => {
    setAnswers((current) => ({ ...current, [key]: { ...(current[key] ?? emptyAnswer), ...changes } }));
  };

  const missingRequired = useMemo(() => {
    if (!form) return [];
    return form.checklist.filter((criterion) => {
      const value = answers[criterion.id]?.value;
      return criterion.required && (value === null || value === undefined || value === '');
    });
  }, [form, answers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !token) return;
    setError(null);

    if (!actualCondition) {
      setError('Selecciona la condición real del equipo.');
      return;
    }
    if (missingRequired.length > 0) {
      setError(`Faltan criterios obligatorios: ${missingRequired.map((c) => c.label).join(', ')}`);
      return;
    }

    const items: InspectionItemInput[] = [];
    for (const criterion of form.checklist) {
      const answer = answers[criterion.id];
      if (!answer || answer.value === null || answer.value === '') continue;

      let value: InspectionItemValue = answer.value;
      if (criterion.type === 'number') {
        value = Number(answer.value);
        if (!Number.isFinite(value)) {
          setError(`"${criterion.label}": ingresa un número válido.`);
          return;
        }
      }
      items.push({
        criterion_key: criterion.id,
        value,
        observation: answer.observation.trim() || undefined,
        evidence_refs: parseEvidence(answer.evidence),
      });
    }

    setSubmitting(true);
    try {
      const res = await ApiService.registerInspection(
        {
          order_id: form.order_id,
          evaluation_rule_id: form.evaluation_rule_id,
          evaluation_rule_version: form.evaluation_rule_version,
          actual_condition: actualCondition,
          observations: observations.trim() || undefined,
          evidence_refs: parseEvidence(evidence),
          items,
        },
        token
      );
      setSuccessMsg(`${res.message} ${orderNumber(form.order_id)}.`);
      resetForm();
      setView('done');
      await fetchData();
    } catch (err: any) {
      // 409: la checklist cambió o la orden ya fue inspeccionada.
      if (err.status === 409 && /checklist cambió/i.test(err.message)) {
        await openForm(form.order_id);
        setError('La checklist del tipo cambió mientras inspeccionabas. Se cargó la versión vigente: revisa y vuelve a responder.');
      } else {
        setError(err.message || 'No se pudo registrar la inspección.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail || !token) return;
    setError(null);
    const reason = justification.trim();
    if (!completionResult) {
      setError('Selecciona si el equipo se destinará a reventa o reciclaje.');
      return;
    }
    if (!reason) {
      setError('La justificación del resultado es obligatoria.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await ApiService.completeInspection(
        detail.order_id,
        { result: completionResult, justification: reason },
        token
      );
      setDetail(response.inspection);
      setInspections((current) =>
        current.map((inspection) => inspection.id === response.inspection.id ? response.inspection : inspection)
      );
      setSuccessMsg(`${response.message} ${orderNumber(detail.order_id)}.`);
    } catch (err: any) {
      setError(err.message || 'No se pudo completar la inspección.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderInput = (criterion: ChecklistItem) => {
    const answer = answers[criterion.id] ?? emptyAnswer;
    switch (criterion.type) {
      case 'boolean':
        return (
          <div className={styles.choiceRow}>
            {[{ v: true, l: 'Sí' }, { v: false, l: 'No' }].map((option) => (
              <button
                type="button"
                key={option.l}
                onClick={() => updateAnswer(criterion.id, { value: option.v })}
                className={answer.value === option.v ? styles.choiceActive : styles.choice}
              >
                {option.l}
              </button>
            ))}
          </div>
        );
      case 'number':
        return (
          <input
            type="number"
            step="any"
            className="input-field"
            style={{ maxWidth: '180px' }}
            value={typeof answer.value === 'string' ? answer.value : ''}
            onChange={(e) => updateAnswer(criterion.id, { value: e.target.value })}
          />
        );
      case 'select':
        return (
          <select
            className="input-field"
            style={{ maxWidth: '320px' }}
            value={typeof answer.value === 'string' ? answer.value : ''}
            onChange={(e) => updateAnswer(criterion.id, { value: e.target.value })}
          >
            <option value="">Selecciona una opción</option>
            {(criterion.options ?? []).map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      default:
        return (
          <input
            type="text"
            className="input-field"
            value={typeof answer.value === 'string' ? answer.value : ''}
            onChange={(e) => updateAnswer(criterion.id, { value: e.target.value })}
          />
        );
    }
  };

  const alerts = (
    <>
      {successMsg && <div className={styles.alertSuccess}>{successMsg}</div>}
      {error && <div className={styles.alertError}>{error}</div>}
    </>
  );

  if (form) {
    const order = orders[form.order_id];
    return (
      <div className={styles.container}>
        <form onSubmit={handleSubmit} className={`glass-panel ${styles.panel}`}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Inspección · {orderNumber(form.order_id)}</h2>
              <p className={styles.subtitle}>
                Checklist de {form.device_type_name}, versión {form.evaluation_rule_version}.
              </p>
            </div>
            <button type="button" onClick={resetForm} className={`btn-secondary ${styles.smallBtn}`}>
              Volver
            </button>
          </div>

          <div className={styles.summaryGrid}>
            <div>
              <p className={styles.fieldCategory}>Equipo</p>
              <p className={styles.fieldValue}>{orderTitle(form.order_id, form.device_type_name)}</p>
            </div>
            <div>
              <p className={styles.fieldCategory}>Condición declarada</p>
              <p className={styles.fieldValue}>{conditionLabel(order?.declared_condition)}</p>
            </div>
            <div>
              <p className={styles.fieldCategory}>Recibido</p>
              <p className={styles.fieldValue}>{formatDate(form.received_at)}</p>
            </div>
          </div>

          <h3 className={styles.sectionTitle}>Checklist</h3>
          {form.checklist.map((criterion) => (
            <div key={criterion.id} className={styles.itemCard}>
              <p className={styles.itemLabel}>
                {criterion.label}
                {criterion.required
                  ? <span className={styles.required}>*</span>
                  : <span className={styles.optional}>(opcional)</span>}
              </p>
              {renderInput(criterion)}
              <div className={styles.extraGrid}>
                <div>
                  <label className={styles.label}>Observación</label>
                  <input
                    type="text"
                    className="input-field"
                    value={(answers[criterion.id] ?? emptyAnswer).observation}
                    onChange={(e) => updateAnswer(criterion.id, { observation: e.target.value })}
                  />
                </div>
                <div>
                  <label className={styles.label}>Referencias de evidencia (una por línea)</label>
                  <textarea
                    className={`input-field ${styles.textarea}`}
                    placeholder="URL o código de la foto"
                    value={(answers[criterion.id] ?? emptyAnswer).evidence}
                    onChange={(e) => updateAnswer(criterion.id, { evidence: e.target.value })}
                  />
                </div>
              </div>
            </div>
          ))}

          <h3 className={styles.sectionTitle}>Condición real del equipo<span className={styles.required}>*</span></h3>
          <div className={styles.choiceRow}>
            {CONDITIONS.map((condition) => (
              <button
                type="button"
                key={condition.id}
                onClick={() => setActualCondition(condition.id)}
                className={actualCondition === condition.id ? styles.choiceActive : styles.choice}
              >
                {condition.label}
              </button>
            ))}
          </div>

          <div className={styles.extraGrid}>
            <div>
              <label className={styles.label}>Observaciones generales</label>
              <textarea
                className={`input-field ${styles.textarea}`}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
              />
            </div>
            <div>
              <label className={styles.label}>Evidencia general (una referencia por línea)</label>
              <textarea
                className={`input-field ${styles.textarea}`}
                placeholder="URL o código de la foto"
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
              />
            </div>
          </div>

          {alerts}

          <div className={styles.actions}>
            <button type="button" onClick={resetForm} className={`btn-secondary ${styles.smallBtn}`}>Cancelar</button>
            <button type="submit" disabled={submitting} className={`btn-primary ${styles.smallBtn}`}>
              {submitting ? 'Guardando...' : 'Registrar inspección'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (detail) {
    return (
      <div className={styles.container}>
        {alerts}
        <div className={`glass-panel ${styles.panel}`}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Inspección · {orderNumber(detail.order_id)}</h2>
              <p className={styles.subtitle}>
                {orderTitle(detail.order_id, detail.device_type_name)} — checklist versión {detail.evaluation_rule_version}.
              </p>
            </div>
            <button type="button" onClick={() => setDetail(null)} className={`btn-secondary ${styles.smallBtn}`}>
              Volver
            </button>
          </div>

          <div className={styles.summaryGrid}>
            <div>
              <p className={styles.fieldCategory}>Condición declarada</p>
              <p className={styles.fieldValue}>{conditionLabel(orders[detail.order_id]?.declared_condition)}</p>
            </div>
            <div>
              <p className={styles.fieldCategory}>Condición real</p>
              <p className={styles.fieldValue}>{conditionLabel(detail.actual_condition)}</p>
            </div>
            <div>
              <p className={styles.fieldCategory}>Inspeccionado</p>
              <p className={styles.fieldValue}>{formatDate(detail.inspected_at)}</p>
            </div>
            <div>
              <p className={styles.fieldCategory}>Estado de inspección</p>
              <p className={styles.fieldValue}>{detail.status === 'COMPLETED' ? 'Completada' : 'Pendiente de resultado'}</p>
            </div>
          </div>

          {detail.status === 'COMPLETED' ? (
            <div className={styles.resultPanel}>
              <h3 className={styles.sectionTitle}>Resultado final de la inspección</h3>
              <p className={styles.fieldValue}>
                {detail.result === 'RESALE' ? 'Reventa' : detail.result === 'RECYCLE' ? 'Reciclaje' : '—'}
              </p>
              <p className={styles.fieldCategory}>Justificación</p>
              <p className={styles.fieldValue}>{detail.result_justification}</p>
              {detail.completed_at && (
                <p className={styles.cardMeta}>Completada {formatDate(detail.completed_at)}</p>
              )}
            </div>
          ) : canRegister ? (
            <form onSubmit={handleCompleteInspection} className={styles.resultPanel}>
              <h3 className={styles.sectionTitle}>Determinar destino del equipo (HU-016)</h3>
              <div className={styles.extraGrid}>
                <div>
                  <label className={styles.label} htmlFor="inspection-result">Resultado final *</label>
                  <select
                    id="inspection-result"
                    className="input-field"
                    value={completionResult}
                    onChange={(event) => setCompletionResult(event.target.value as '' | 'RESALE' | 'RECYCLE')}
                    required
                  >
                    <option value="">Selecciona un resultado</option>
                    <option value="RESALE">Reventa</option>
                    <option value="RECYCLE">Reciclaje</option>
                  </select>
                </div>
                <div>
                  <label className={styles.label} htmlFor="inspection-justification">Justificación *</label>
                  <textarea
                    id="inspection-justification"
                    className={`input-field ${styles.textarea}`}
                    value={justification}
                    onChange={(event) => setJustification(event.target.value)}
                    maxLength={2000}
                    required
                  />
                </div>
              </div>
              <div className={styles.actions}>
                <button type="submit" disabled={submitting} className={`btn-primary ${styles.smallBtn}`}>
                  {submitting ? 'Completando...' : 'Guardar resultado'}
                </button>
              </div>
            </form>
          ) : (
            <div className={styles.alertInfo}>
              Solo un usuario con rol INSPECTOR puede determinar el resultado y completar la inspección.
            </div>
          )}

          <h3 className={styles.sectionTitle}>Checklist</h3>
          {(detail.items ?? []).map((item) => (
            <div key={item.id} className={styles.itemCard}>
              <p className={styles.itemLabel}>{item.criterion_label}</p>
              <p className={styles.fieldValue}>
                <span className={item.result === 'PASS' ? styles.resultPass : item.result === 'FAIL' ? styles.resultFail : undefined}>
                  {formatValue(item.value)}
                </span>
              </p>
              {item.observation && <p className={styles.cardMeta}>Observación: {item.observation}</p>}
              {item.evidence_refs.length > 0 && (
                <ul className={styles.evidenceList}>
                  {item.evidence_refs.map((ref) => <li key={ref}>{ref}</li>)}
                </ul>
              )}
            </div>
          ))}

          {detail.observations && (
            <div>
              <p className={styles.fieldCategory}>Observaciones generales</p>
              <p className={styles.fieldValue}>{detail.observations}</p>
            </div>
          )}
          {detail.evidence_refs.length > 0 && (
            <div>
              <p className={styles.fieldCategory}>Evidencia general</p>
              <ul className={styles.evidenceList}>
                {detail.evidence_refs.map((ref) => <li key={ref}>{ref}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={`glass-panel ${styles.headerCard}`}>
        <div className={styles.headerLeft}>
          <div>
            <h2 className={styles.title}>Inspección</h2>
            <p className={styles.subtitle}>Registra la evaluación y el resultado de cada equipo.</p>
          </div>
        </div>
        <button onClick={fetchData} className={`btn-secondary ${styles.smallBtn}`}>
          {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {alerts}
      {!canRegister && (
        <div className={styles.alertInfo}>
          Solo un usuario con rol INSPECTOR puede registrar y completar inspecciones. Puedes consultar las ya registradas.
        </div>
      )}

      <div className={styles.tabRow}>
        <button onClick={() => setView('pending')} className={view === 'pending' ? styles.tabChipActive : styles.tabChip}>
          Pendientes ({pending.length})
        </button>
        <button onClick={() => setView('done')} className={view === 'done' ? styles.tabChipActive : styles.tabChip}>
          Registradas ({inspections.length})
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingText}>Cargando inspecciones...</div>
      ) : view === 'pending' ? (
        pending.length === 0 ? (
          <div className={styles.emptyBox}>No hay equipos pendientes de inspección.</div>
        ) : (
          <div className={styles.list}>
            {pending.map((device) => (
              <div key={device.order_id} className={`glass-card ${styles.card}`}>
                <div>
                  <p className={styles.cardTitle}>
                    {orderNumber(device.order_id)}
                    <span className={styles.badge}>Pendiente</span>
                  </p>
                  <p className={styles.cardMeta}>
                    {orderTitle(device.order_id, device.device_type_name)} · Recibido {formatDate(device.received_at)}
                  </p>
                </div>
                {canRegister && (
                  <button
                    onClick={() => void openForm(device.order_id)}
                    disabled={submitting}
                    className={`btn-primary ${styles.smallBtn}`}
                  >
                    Inspeccionar
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      ) : inspections.length === 0 ? (
        <div className={styles.emptyBox}>Todavía no hay inspecciones registradas.</div>
      ) : (
        <div className={styles.list}>
          {inspections.map((inspection) => (
            <div key={inspection.id} className={`glass-card ${styles.card}`}>
              <div>
                <p className={styles.cardTitle}>
                  {orderNumber(inspection.order_id)}
                  <span className={`${styles.badge} ${inspection.status === 'COMPLETED' ? styles.badgeDone : ''}`}>
                    {inspection.status === 'COMPLETED' ? 'Completada' : 'Registrada'}
                  </span>
                </p>
                <p className={styles.cardMeta}>
                  {orderTitle(inspection.order_id, inspection.device_type_name)} · Condición real: {conditionLabel(inspection.actual_condition)}
                  {inspection.result && ` · Resultado: ${inspection.result === 'RESALE' ? 'Reventa' : 'Reciclaje'}`}
                  {' · '}{formatDate(inspection.inspected_at)}
                </p>
              </div>
              <button onClick={() => void openDetail(inspection.order_id)} className={`btn-secondary ${styles.smallBtn}`}>
                Ver detalle
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
