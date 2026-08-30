import { WorkPermit, PermitCategory } from '../types';

/** Сырой наряд в формате API (snake_case) — как его отдаёт бэкенд */
export interface RawPermit {
  id: string | number;
  permit_id?: string | null;
  templateType?: string | null;
  status?: string;
  scan_file?: string | null;
  safety_document?: string | null;
  loto_photo?: string | null;
  initiator?: {
    name?: string | null;
    last_name?: string | null;
    first_name?: string | null;
    surname?: string | null;
    position?: string | null;
    iin?: string | null;
    bin?: string | null;
    id?: number;
  } | null;
  location_name?: string | null;
  created_at?: string;
  valid_from?: string | null;
  valid_to?: string | null;
  data?: Record<string, any>;
  approval_steps?: any[];
  producer_closed?: boolean;
}

/**
 * Единственное место приведения сырого объекта наряда из API
 * к формату фронтенда (camelCase + подстраховка пустых полей).
 * Раньше логика была скопирована в трёх местах App.tsx и могла расходиться.
 */
export const formatPermit = (p: RawPermit): WorkPermit => ({
  id: p.id,
  permitId: p.permit_id || 'Черновик',
  templateType: p.templateType || 'Наряд повышенной опасности',
  status: p.status,
  scan_file: p.scan_file,
  safety_document: p.safety_document,
  loto_photo: p.loto_photo,
  initiator: {
    name: p.initiator?.name || [p.initiator?.last_name, p.initiator?.first_name, p.initiator?.surname].filter(Boolean).join(' ') || '—',
    position: p.initiator?.position,
    iin: p.initiator?.iin,
    bin: p.initiator?.bin,
    id: p.initiator?.id,
  },
  location: { name: p.location_name || 'Место не указано' },
  createdAt: p.created_at,
  validFrom: p.valid_from,
  validTo: p.valid_to,
  data: p.data,
  category: p.data?.category === PermitCategory.ELECTRICAL ? PermitCategory.ELECTRICAL : PermitCategory.DANGEROUS,
  approvalSteps: p.approval_steps,
  producer_closed: p.producer_closed,
});
