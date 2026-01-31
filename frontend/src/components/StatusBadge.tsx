import React from 'react';
import { PermitStatus } from '../types';

interface StatusBadgeProps {
  status: PermitStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStyle = (s: PermitStatus) => {
    switch (s) {
      case PermitStatus.DRAFT:
        return 'bg-slate-100 text-slate-600 border-slate-200'; // Gray
      case PermitStatus.PENDING_APPROVAL:
        return 'bg-amber-100 text-amber-700 border-amber-200'; // Yellow/Orange
      case PermitStatus.APPROVED:
        return 'bg-emerald-100 text-emerald-700 border-emerald-200'; // Green
      case PermitStatus.REJECTED:
        return 'bg-rose-100 text-rose-700 border-rose-200'; // Red
      case PermitStatus.CLOSED:
        return 'bg-blue-100 text-blue-700 border-blue-200'; // Blue
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLabel = (s: PermitStatus) => {
    switch (s) {
      case PermitStatus.DRAFT: return 'ЧЕРНОВИК';
      case PermitStatus.PENDING_APPROVAL: return 'НА СОГЛАСОВАНИИ';
      case PermitStatus.APPROVED: return 'СОГЛАСОВАН';
      case PermitStatus.REJECTED: return 'ОТКЛОНЕН';
      case PermitStatus.CLOSED: return 'ЗАКРЫТ';
      default: return s;
    }
  };

  return (
    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[10px] font-bold border tracking-wide uppercase ${getStyle(status)}`}>
      {getLabel(status)}
    </span>
  );
};