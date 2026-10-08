import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Dashboard } from './Dashboard';

// Компонент тянет useTranslation — мокаем минимально
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'ru' } }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

const mkPermits = (n: number, offset = 0) =>
  Array.from({ length: n }, (_, i) => ({
    id: String(offset + i),
    permitId: `P-${offset + i}`,
    status: 'CLOSED',
    initiator: { name: 'Тестов Т.Т.' },
    location: { name: 'Цех' },
    createdAt: '2026-10-01T10:00:00Z',
    validFrom: '2026-10-01T10:00:00Z',
    validTo: '2026-10-02T10:00:00Z',
    data: { workName: 'Работа', department: 'Цех №1' },
    templateType: 'Опасные работы',
  })) as any[];

const props = (permits: any[], isBackgroundLoading: boolean) => ({
  permits,
  onSelectPermit: () => {},
  onCreateNew: () => {},
  isArchiveView: true,
  isBackgroundLoading,
});

describe('Dashboard: заморозка счётчика на время фоновой догрузки', () => {
  it('пока идёт догрузка, счётчик «из N» не растёт, после завершения — обновляется один раз', () => {
    const { rerender } = render(<Dashboard {...props(mkPermits(30), true)} />);
    // Снимок на начало загрузки: 30
    expect(screen.getByText(/dashboard\.shown/).textContent).toContain('30');

    // Пока загрузка идёт, пришли ещё наряды (30 -> 50): счётчик заморожен
    rerender(<Dashboard {...props(mkPermits(50, 100), true)} />);
    expect(screen.getByText(/dashboard\.shown/).textContent).toContain('30');
    expect(screen.getByText(/dashboard\.shown/).textContent).not.toContain('50');

    // Загрузка завершилась: счётчик показывает полный список
    rerender(<Dashboard {...props(mkPermits(50, 100), false)} />);
    expect(screen.getByText(/dashboard\.shown/).textContent).toContain('50');
  });
});
