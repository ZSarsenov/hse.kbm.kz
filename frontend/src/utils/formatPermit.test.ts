import { describe, it, expect } from 'vitest';
import { formatPermit, RawPermit } from './formatPermit';

describe('formatPermit', () => {
  it('приводит snake_case к camelCase', () => {
    const raw: RawPermit = {
      id: 7,
      permit_id: '42-2026',
      status: 'APPROVED',
      location_name: 'УСТ-9',
      valid_from: '2026-08-01',
      valid_to: '2026-08-10',
      initiator: { last_name: 'Иванов', first_name: 'Иван', surname: 'Иванович' },
    };
    const permit = formatPermit(raw);
    expect(permit.id).toBe(7);
    expect(permit.permitId).toBe('42-2026');
    expect(permit.location.name).toBe('УСТ-9');
    expect(permit.validFrom).toBe('2026-08-01');
    expect(permit.initiator.name).toBe('Иванов Иван Иванович');
  });

  it('подставляет заглушки для пустых полей', () => {
    const permit = formatPermit({ id: 1 });
    expect(permit.permitId).toBe('Черновик');
    expect(permit.initiator.name).toBe('—');
    expect(permit.location.name).toBe('Место не указано');
    expect(permit.templateType).toBe('Наряд повышенной опасности');
  });
});
