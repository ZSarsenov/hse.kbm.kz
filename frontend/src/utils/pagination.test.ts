import { describe, it, expect } from 'vitest';
import { getPageItems } from './pagination';

describe('getPageItems', () => {
  it('до 7 страниц показывает все без многоточий', () => {
    expect(getPageItems(1, 1)).toEqual([1]);
    expect(getPageItems(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('текущая в начале: 1 2 3 4 5 … N', () => {
    expect(getPageItems(2, 20)).toEqual([1, 2, 3, 4, 5, 'ellipsisR', 20]);
    expect(getPageItems(4, 50)).toEqual([1, 2, 3, 4, 5, 'ellipsisR', 50]);
  });

  it('текущая в конце: 1 … N-4 N-3 N-2 N-1 N', () => {
    expect(getPageItems(20, 20)).toEqual([1, 'ellipsisL', 16, 17, 18, 19, 20]);
    expect(getPageItems(47, 50)).toEqual([1, 'ellipsisL', 46, 47, 48, 49, 50]);
  });

  it('текущая в середине: 1 … c-1 c c+1 … N', () => {
    expect(getPageItems(10, 20)).toEqual([1, 'ellipsisL', 9, 10, 11, 'ellipsisR', 20]);
    expect(getPageItems(5, 20)).toEqual([1, 'ellipsisL', 4, 5, 6, 'ellipsisR', 20]);
  });

  it('на границах перехода между режимами нет разрывов и дублей', () => {
    // 5 — первая «средняя» страница, 8 при total=8+3=… проверяем стык «конец»
    expect(getPageItems(5, 20)).toEqual([1, 'ellipsisL', 4, 5, 6, 'ellipsisR', 20]);
    expect(getPageItems(17, 20)).toEqual([1, 'ellipsisL', 16, 17, 18, 19, 20]);
  });

  it('всегда содержит текущую страницу и не длиннее 7 элементов', () => {
    for (let total = 8; total <= 60; total += 7) {
      for (let cur = 1; cur <= total; cur++) {
        const items = getPageItems(cur, total);
        expect(items.length).toBeLessThanOrEqual(7);
        expect(items).toContain(cur);
        const nums = items.filter((i): i is number => typeof i === 'number');
        expect(new Set(nums).size).toBe(nums.length); // без дублей
      }
    }
  });
});
