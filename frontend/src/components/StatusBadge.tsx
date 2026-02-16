import React from 'react';
import { PermitStatus } from '../types';

/** Нормализует статус с бэкенда (например Pending_Approval) к enum-значению */
function normalizeStatus(s: PermitStatus | string): string {
  const u = String(s).toUpperCase().replace(/\s+/g, '_');
  if (u === 'PENDING_APPROVAL' || u === 'PENDINGAPPROVAL') return PermitStatus.PENDING_APPROVAL;
  if (u === 'PENDING') return PermitStatus.PENDING_APPROVAL;
  return u;
}

interface StatusBadgeProps {
  status: PermitStatus | string;
}

/** Возвращает русскую подпись для статуса (можно использовать вне бейджа) */
export function getStatusLabel(status: PermitStatus | string): string {
  const n = normalizeStatus(status);
  switch (n) {
    case PermitStatus.DRAFT: return 'Черновик';
    case PermitStatus.PENDING_APPROVAL: return 'На согласовании';
    case PermitStatus.APPROVED: return 'Согласован';
    case PermitStatus.ACTIVE: return 'В работе';
    case PermitStatus.REJECTED: return 'Отклонён';
    case PermitStatus.CLOSED: return 'Закрыт';
    case 'ARCHIVED': return 'В архиве';
    default: return n ? String(status).replace(/_/g, ' ') : '—';
  }
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const n = normalizeStatus(status);

  const getStyle = () => {
    switch (n) {
      case PermitStatus.DRAFT:
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case PermitStatus.PENDING_APPROVAL:
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case PermitStatus.APPROVED:
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case PermitStatus.REJECTED:
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case PermitStatus.CLOSED:
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      case PermitStatus.ACTIVE:
        return 'bg-sky-100 text-sky-700 border-sky-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const label = getStatusLabel(status);

  return (
    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[10px] font-bold border tracking-wide uppercase ${getStyle()}`}>
      {label.toUpperCase()}
    </span>
  );
};