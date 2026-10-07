import React from 'react';
import { History, Plus, PlusCircle, Trash2, AlertCircle } from 'lucide-react';
import type { DeviceType, EvaluationRule, ChecklistItem } from '../../../types';
import styles from '../catalog.module.css';

interface RulesTabProps {
  deviceTypes: DeviceType[];
  selectedTypeForRule: string;
  setSelectedTypeForRule: (id: string) => void;
  showHistoryModal: boolean;
  setShowHistoryModal: (val: boolean) => void;
  ruleHistory: EvaluationRule[];
  showNewRuleForm: boolean;
  setShowNewRuleForm: (val: boolean) => void;
  activeRule: EvaluationRule | null;
  newItemLabel: string;
  setNewItemLabel: (val: string) => void;
  newItemType: 'boolean' | 'number' | 'text';
  setNewItemType: (val: 'boolean' | 'number' | 'text') => void;
  newItemRequired: boolean;
  setNewItemRequired: (val: boolean) => void;
  handleAddItemToChecklist: () => void;
  newChecklist: ChecklistItem[];
  handleRemoveChecklistItem: (idx: number) => void;
  submittingRule: boolean;
  handleCreateRuleVersion: (e: React.FormEvent) => void;
  rulesLoading: boolean;
}

export const RulesTab: React.FC<RulesTabProps> = ({
  deviceTypes,
  selectedTypeForRule,
  setSelectedTypeForRule,
  showHistoryModal,
  setShowHistoryModal,
  ruleHistory,
  showNewRuleForm,
  setShowNewRuleForm,
  activeRule,
  newItemLabel,
  setNewItemLabel,
  newItemType,
  setNewItemType,
  newItemRequired,
  setNewItemRequired,
  handleAddItemToChecklist,
  newChecklist,
  handleRemoveChecklistItem,
  submittingRule,
  handleCreateRuleVersion,
  rulesLoading,
}) => {
  return (
    <div className={styles.panelStack}>
      {/* Type Selector Header */}
      <div className={`${styles.panel} ${styles.rulesHeader}`}>
        <div className={styles.rulesHeaderLeft}>
          <label className={styles.label} style={{ margin: 0, fontSize: '14px', color: '#0f172a' }}>
            Seleccionar Tipo de Equipo:
          </label>
          <select
            value={selectedTypeForRule}
            onChange={(e) => setSelectedTypeForRule(e.target.value)}
            className={styles.select}
            style={{ fontSize: '14px', fontWeight: 600 }}
          >
            {deviceTypes.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
            ))}
          </select>
        </div>

        <div className={styles.rulesActions}>
          <button
            onClick={() => setShowHistoryModal(!showHistoryModal)}
            className={styles.btnSecondary}
          >
            <History size={15} /> Historial de Versiones ({ruleHistory.length})
          </button>
          <button
            onClick={() => setShowNewRuleForm(!showNewRuleForm)}
            className={styles.btnPrimary}
          >
            <Plus size={15} /> Crear Nueva Versión
          </button>
        </div>
      </div>

      {/* History Drawer */}
      {showHistoryModal && (
        <div className={styles.historyPanel}>
          <h4 className={styles.historyTitle}>
            <History size={16} /> Historial de Reglas de Evaluación para {deviceTypes.find(t => t.id === selectedTypeForRule)?.name}
          </h4>
          <table className={styles.tableSmall}>
            <thead className={styles.thead}>
              <tr>
                <th>Versión</th>
                <th>Estado</th>
                <th>Vigencia Desde</th>
                <th>Vigencia Hasta</th>
                <th>Ítems Checklist</th>
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {ruleHistory.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 700 }}>v{r.version}</td>
                  <td>
                    <span className={r.is_active ? styles.badgeVersionActive : styles.badgeVersionHistory}>
                      {r.is_active ? 'VIGENTE' : 'HISTÓRICA'}
                    </span>
                  </td>
                  <td style={{ color: '#475569' }}>{new Date(r.effective_from).toLocaleString()}</td>
                  <td style={{ color: '#475569' }}>{r.effective_until ? new Date(r.effective_until).toLocaleString() : 'Vigente'}</td>
                  <td style={{ fontWeight: 600 }}>{r.checklist?.length || 0} ítems</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Rule Form */}
      {showNewRuleForm && (
        <div className={styles.panelHighlight}>
          <h3 className={styles.sectionTitle}>
            <PlusCircle size={18} color="#2563eb" /> Diseñar Nueva Versión de Regla (v{(activeRule?.version || 0) + 1})
          </h3>
          <p className={styles.headerSubtitle} style={{ marginBottom: '16px' }}>
            Al guardar, la versión actual (v{activeRule?.version || 1}) pasará a estado histórico y esta nueva versión guiará las inspecciones futuras.
          </p>

          <div className={styles.checklistAddBar}>
            <input
              type="text"
              placeholder="Pregunta o criterio de inspección (Ej. ¿Funciona el encendido?)"
              value={newItemLabel}
              onChange={(e) => setNewItemLabel(e.target.value)}
              className={styles.inputInline}
              style={{ maxWidth: 'none' }}
            />
            <select
              value={newItemType}
              onChange={(e) => setNewItemType(e.target.value as any)}
              className={styles.select}
            >
              <option value="boolean">Sí / No (Booleano)</option>
              <option value="number">Puntaje (1-10)</option>
              <option value="text">Texto / Observación</option>
            </select>
            <label className={styles.checklistRequiredLabel}>
              <input type="checkbox" checked={newItemRequired} onChange={(e) => setNewItemRequired(e.target.checked)} /> Obligatorio
            </label>
            <button
              type="button"
              onClick={handleAddItemToChecklist}
              className={styles.btnPrimary}
              style={{ padding: '8px 14px', fontSize: '12px' }}
            >
              + Agregar Ítem
            </button>
          </div>

          <h4 className={styles.checklistTitle}>Vista previa de Ítems del Checklist ({newChecklist.length})</h4>
          {newChecklist.length === 0 ? (
            <p className={`${styles.emptyText} ${styles.italic}`}>No hay ítems en esta regla aún. Agregá al menos uno arriba.</p>
          ) : (
            <ul className={styles.checklistList}>
              {newChecklist.map((item, idx) => (
                <li key={idx} className={styles.checklistItem}>
                  <div className={styles.checklistItemLeft}>
                    <span className={styles.checklistItemNumber}>#{idx + 1}</span>
                    <span className={styles.checklistItemLabel}>{item.label}</span>
                    <span className={styles.checklistItemType}>{item.type}</span>
                    {item.required && <span className={styles.checklistItemRequired}>* Requerido</span>}
                  </div>
                  <button onClick={() => handleRemoveChecklistItem(idx)} className={styles.btnIcon} style={{ color: '#ef4444' }}>
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className={styles.ruleFormActions}>
            <button
              type="button"
              onClick={() => setShowNewRuleForm(false)}
              className={styles.btnSecondary}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreateRuleVersion}
              disabled={submittingRule || newChecklist.length === 0}
              className={styles.btnSuccess}
            >
              {submittingRule ? 'Publicando Versión...' : 'Publicar Nueva Versión'}
            </button>
          </div>
        </div>
      )}

      {/* Active Rule Display */}
      <div className={styles.panel}>
        {rulesLoading ? (
          <p className={styles.loadingText}>Cargando regla de evaluación activa...</p>
        ) : !activeRule ? (
          <div className={styles.emptyCenter}>
            <AlertCircle size={32} color="#94a3b8" style={{ marginBottom: '8px' }} />
            <p className={styles.emptyMutedText}>No hay regla de evaluación definida para este tipo de equipo.</p>
            <button
              onClick={() => setShowNewRuleForm(true)}
              className={styles.btnPrimary}
              style={{ marginTop: '12px' }}
            >
              + Definir Regla Inicial
            </button>
          </div>
        ) : (
          <div>
            <div className={styles.activeRuleHeader}>
              <div className={styles.activeRuleHeaderLeft}>
                <span className={styles.activeVersionBadge}>
                  Versión Vigente v{activeRule.version}
                </span>
                <span className={styles.activeVersionDate}>
                  Desde: {new Date(activeRule.effective_from).toLocaleDateString()}
                </span>
              </div>
              <span className={styles.activeBadge}>
                ✓ ACTIVA PARA INSPECCIONES
              </span>
            </div>

            <h4 className={styles.sectionTitleNoMarginBottom} style={{ marginBottom: '12px' }}>
              Checklist de Inspección ({activeRule.checklist?.length || 0} preguntas):
            </h4>

            <div className={styles.checklistDisplayGrid}>
              {activeRule.checklist?.map((item: ChecklistItem, i: number) => (
                <div key={i} className={styles.checklistDisplayItem}>
                  <div className={styles.checklistDisplayItemLeft}>
                    <span className={styles.checklistItemNumber}>#{i + 1}</span>
                    <span className={styles.checklistItemLabel}>{item.label}</span>
                  </div>
                  <div className={styles.formRow}>
                    <span className={styles.tagBadge}>Tipo: {item.type}</span>
                    {item.required && <span className={styles.requiredBadge}>Requerido</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Criteria Cards */}
            <div className={styles.criteriaGrid}>
              <div className={styles.criteriaCardGreen}>
                <h5 className={`${styles.criteriaTitle} ${styles.criteriaGreenTitle}`}>Criterios de Reventa (Resale):</h5>
                <pre className={`${styles.criteriaCode} ${styles.criteriaGreenCode}`}>
                  {JSON.stringify(activeRule.resale_criteria, null, 2)}
                </pre>
              </div>
              <div className={styles.criteriaCardYellow}>
                <h5 className={`${styles.criteriaTitle} ${styles.criteriaYellowTitle}`}>Criterios de Reciclaje (Recycle):</h5>
                <pre className={`${styles.criteriaCode} ${styles.criteriaYellowCode}`}>
                  {JSON.stringify(activeRule.recycle_criteria, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
