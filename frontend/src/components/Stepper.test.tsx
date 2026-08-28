import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Stepper } from './Stepper';

const steps = [
  { id: 1, label: 'Общие сведения' },
  { id: 2, label: 'Состав бригады' },
  { id: 3, label: 'Оценка риска' },
  { id: 4, label: 'LOTO' },
];

describe('Stepper', () => {
  it('рисует все шаги с номерами', () => {
    render(<Stepper steps={steps} currentIdx={0} onSelect={() => {}} />);
    expect(screen.getByText('Общие сведения')).toBeDefined();
    expect(screen.getByText('LOTO')).toBeDefined();
    expect(screen.getByText('1')).toBeDefined();
    expect(screen.getByText('4')).toBeDefined();
  });

  it('пройденные шаги показывают галочку вместо номера', () => {
    const { container } = render(<Stepper steps={steps} currentIdx={2} onSelect={() => {}} />);
    // Шаги 1 и 2 пройдены — svg-галочки есть, номера 1 и 2 — нет
    expect(container.querySelectorAll('svg').length).toBe(2);
    expect(screen.queryByText('1')).toBeNull();
    expect(screen.queryByText('2')).toBeNull();
    expect(screen.getByText('3')).not.toBeNull();
  });

  it('клик по шагу вызывает onSelect с его id', () => {
    const onSelect = vi.fn();
    render(<Stepper steps={steps} currentIdx={0} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Оценка риска'));
    expect(onSelect).toHaveBeenCalledWith(3);
  });
});
