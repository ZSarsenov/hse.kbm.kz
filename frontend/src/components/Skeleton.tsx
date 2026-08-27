import React from 'react';

/** Серые «мигающие» заглушки на время загрузки данных/чанков */

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200/70 rounded ${className}`} />
);

/** Заглушка списка (строки таблицы нарядов) */
export const ListSkeleton: React.FC<{ rows?: number }> = ({ rows = 8 }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    ))}
  </div>
);
