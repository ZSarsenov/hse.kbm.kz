// Оконная пагинация: на большом числе страниц рисуем не все кнопки,
// а «1 … 4 5 6 … 50» — иначе ряд кнопок шире карточки и обрезается
// overflow-hidden контейнером (пагинация «исчезала» в Журнале).

export type PageItem = number | 'ellipsisL' | 'ellipsisR';

const range = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

/** Возвращает видимые элементы пагинации: номера страниц и многоточия. */
export function getPageItems(current: number, total: number, siblings = 1): PageItem[] {
  if (total <= 7) return range(1, total);

  // Текущая внутри первой пятёрки: 1 2 3 4 5 … N
  if (current <= 4) return [...range(1, 5), 'ellipsisR', total];
  // Текущая внутри последней пятёрки: 1 … N-4 N-3 N-2 N-1 N
  if (current >= total - 3) return [1, 'ellipsisL', ...range(total - 4, total)];

  // Посередине: 1 … c-1 c c+1 … N
  return [1, 'ellipsisL', ...range(current - siblings, current + siblings), 'ellipsisR', total];
}
