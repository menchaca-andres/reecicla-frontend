import React from 'react';
import type { PaginationMeta } from '../types';
import styles from './PaginationControls.module.css';

interface PaginationControlsProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({ pagination, onPageChange }) => {
  if (pagination.total_pages <= 1) return null;

  return (
    <nav className={styles.controls} aria-label="Paginación">
      <span className={styles.summary}>
        {pagination.total_items} registros · Página {pagination.page} de {pagination.total_pages}
      </span>
      <div className={styles.actions}>
        <button
          type="button"
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={pagination.page <= 1}
        >
          Anterior
        </button>
        <button
          type="button"
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.total_pages}
        >
          Siguiente
        </button>
      </div>
    </nav>
  );
};
