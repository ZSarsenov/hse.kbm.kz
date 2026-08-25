import { WorkPermit } from '../types';

/**
 * Единственное место приведения сырого объекта наряда из API
 * к формату фронтенда (camelCase + подстраховка пустых полей).
 * Раньше логика была скопирована в трёх местах App.tsx и могла расходиться.
 */
export const formatPermit = (p: any): WorkPermit => ({
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
  approvalSteps: p.approval_steps,
  producer_closed: p.producer_closed,
});
