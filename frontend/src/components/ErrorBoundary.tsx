import React from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

/**
 * Страховочные сетки React (Error Boundary).
 *
 * - AppErrorBoundary — обёртка всего приложения: если что-то упало в рендере,
 *   вместо белого экрана показывается внятная страница с кнопкой перезагрузки.
 * - CardErrorBoundary — компактная обёртка элемента (например, карточки наряда):
 *   падает только этот элемент, остальное приложение продолжает работать.
 */

interface BoundaryProps {
  children: React.ReactNode;
}

interface BoundaryState {
  error: Error | null;
}

/** Полноэкранная заглушка — «страховка» всего приложения */
export class AppErrorBoundary extends React.Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Полный след — в консоль для поддержки
    console.error('Ошибка интерфейса (Error Boundary):', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 shadow-[0_24px_64px_-16px_rgba(6,32,58,0.35)] p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-5">
            <ShieldAlert size={28} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Что-то пошло не так</h1>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            В интерфейсе произошла непредвиденная ошибка. Ваши данные в безопасности.
            Обновите страницу — в большинстве случаев этого достаточно.
            Если ошибка повторяется, сообщите в поддержку ИТ.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0A3D62] hover:bg-[#0C4A77] text-white text-sm font-semibold transition-colors focus:outline-none focus:ring-4 focus:ring-[#0A3D62]/20"
          >
            <RefreshCw size={16} /> Обновить страницу
          </button>
          <p className="mt-6 text-[11px] text-slate-400 font-mono break-all">
            {this.state.error.message}
          </p>
        </div>
      </div>
    );
  }
}

/** Компактная заглушка элемента (карточка наряда и т.п.) */
export class CardErrorBoundary extends React.Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Ошибка элемента (Error Boundary):', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
        <div className="w-11 h-11 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert size={22} />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">Не удалось отобразить элемент</h3>
        <p className="text-sm text-slate-500 mb-4">
          Остальные разделы продолжают работать. Можно попробовать ещё раз.
        </p>
        <button
          onClick={() => this.setState({ error: null })}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors"
        >
          <RefreshCw size={15} /> Повторить
        </button>
      </div>
    );
  }
}
