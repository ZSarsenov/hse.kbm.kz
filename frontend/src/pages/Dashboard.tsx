import { useState, useEffect } from 'react';
import { Calendar, MapPin, Search, Download, Plus, ChevronRight, Building2, SlidersHorizontal, User, ChevronLeft, Filter } from 'lucide-react';
import { WorkPermit, PermitStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface DashboardProps {
  permits: WorkPermit[];
  onSelectPermit: (id: string) => void;
  onCreateNew: () => void;
  isArchiveView?: boolean; // 👈 ДОБАВИЛИ ФЛАГ "РЕЖИМ АРХИВА"
}

const ITEMS_PER_PAGE = 10;

export const Dashboard: React.FC<DashboardProps> = ({ permits, onSelectPermit, onCreateNew, isArchiveView = false }) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const user = JSON.parse(localStorage.getItem('user_data') || '{}');
  const canCreatePermit = user.role === 'ISSUER' || user.role === 'ADMITTING' || user.role === 'ADMIN';

  // 🔥 НОВАЯ ЛОГИКА ФИЛЬТРАЦИИ
  const filteredPermits = permits.filter(p => {
    // Является ли наряд архивным? (Закрыт или Отклонен)
    const isArchived = p.status === 'CLOSED' || p.status === 'REJECTED';

    // Если режим АРХИВА -> показываем только архивные
    // Если режим ГЛАВНОЙ -> показываем только активные
    if (isArchiveView) {
        if (!isArchived) return false;
    } else {
        if (isArchived) return false;
    }

    const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      (p.permitId?.toLowerCase() || '').includes(query) ||
      (p.initiator?.name?.toLowerCase() || '').includes(query) ||
      (p.location?.name?.toLowerCase() || '').includes(query);
    return matchesStatus && matchesSearch;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredPermits.length / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredPermits.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => { setCurrentPage(1); }, [filterStatus, searchQuery, isArchiveView]);

  const goToPage = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          {/* Меняем заголовок в зависимости от режима */}
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              {isArchiveView ? 'Журнал учета выдачи наряда-допусков' : 'Оперативный контроль работ повышенной опасности.'}
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
              {isArchiveView ? 'История закрытых и отклоненных работ' : 'Оперативный контроль работ повышенной опасности'}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-5 py-3 rounded-lg text-base font-medium hover:bg-gray-50 transition-all shadow-sm">
            <Download size={20} />
            <span className="hidden sm:inline">Экспорт отчета</span>
          </button>

          {/* Кнопку "Создать" показываем только на ГЛАВНОЙ (в архиве она не нужна) */}
          {!isArchiveView && canCreatePermit && (
              <button
                onClick={onCreateNew}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-base font-medium transition-all shadow-md shadow-blue-200 flex items-center gap-2"
              >
                <Plus size={20} />
                <span>Создать наряд</span>
              </button>
          )}
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4 text-base font-semibold text-gray-700">
          <SlidersHorizontal size={18} />
          <span>Фильтры данных</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

          {/* Status Filter */}
          <div className="relative group">
             <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 group-focus-within:text-blue-600 transition-colors">
                <Filter size={18} />
              </span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white transition-shadow outline-none cursor-pointer hover:border-gray-400"
            >
              <option value="ALL">Все статусы</option>
              {isArchiveView ? (
                  <>
                      <option value={PermitStatus.CLOSED}>Закрыт</option>
                      <option value={PermitStatus.REJECTED}>Отклонено</option>
                  </>
              ) : (
                  <>
                      <option value={PermitStatus.DRAFT}>Черновик</option>
                      <option value={PermitStatus.PENDING_APPROVAL}>На согласовании</option>
                      <option value={PermitStatus.APPROVED}>Согласовано</option>
                  </>
              )}
            </select>
          </div>

           {/* Date Range */}
           <div className="relative group">
             <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 group-focus-within:text-blue-600 transition-colors">
                <Calendar size={18} />
              </span>
            <input
              type="date"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-600 outline-none transition-shadow"
            />
          </div>

          {/* Department */}
          <div className="relative group">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 group-focus-within:text-blue-600 transition-colors">
                <Building2 size={18} />
            </span>
            <select className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-600 appearance-none outline-none cursor-pointer hover:border-gray-400">
              <option>Все цеха / отделы</option>
              <option>Цех №1</option>
              <option>Цех №2</option>
              <option>Ремонтная служба</option>
            </select>
          </div>

           {/* Search */}
           <div className="relative group">
             <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 group-focus-within:text-blue-600 transition-colors">
                <Search size={18} />
              </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по номеру, ФИО..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
            />
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-base text-left">
            <thead className="bg-slate-50 border-b border-gray-200 text-slate-500 font-bold uppercase tracking-wider text-sm">
              <tr>
                {isArchiveView ? (
                  <>
                    <th className="px-4 py-5 w-12">№</th>
                    <th className="px-4 py-5 w-[140px]">Первичный допуск</th>
                    <th className="px-4 py-5 w-[140px]">Вторичный допуск</th>
                    <th className="px-4 py-5 w-36">№ наряда-допуска</th>
                    <th className="px-4 py-5">Лицо, выдавшее наряд</th>
                    <th className="px-4 py-5">Характер выполняемых работ</th>
                    <th className="px-4 py-5 text-center w-28">Статус</th>
                    <th className="px-4 py-5 w-12"></th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-5 w-36">Номер (ID)</th>
                    <th className="px-6 py-5">Тип работ</th>
                    <th className="px-6 py-5">Место работ (Установка)</th>
                    <th className="px-6 py-5">Ответственный</th>
                    <th className="px-6 py-5">Дата начала</th>
                    <th className="px-6 py-5 text-center">Статус</th>
                    <th className="px-6 py-5 w-12"></th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentItems.map((permit, index) => {
                const formatDt = (s: string | undefined) => {
                  if (!s) return '—';
                  try {
                    const d = new Date(s);
                    return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                  } catch { return '—'; }
                };
                const issuerStep = (permit as any).approvalSteps?.find((s: any) => s.role === 'ISSUER');
                const issuerName = issuerStep?.approver_name || permit.initiator?.name || '—';

                if (isArchiveView) {
                  return (
                    <tr
                      key={permit.id}
                      onClick={() => onSelectPermit(permit.id)}
                      className="group cursor-pointer transition-colors even:bg-slate-50/50 hover:bg-blue-50/60"
                    >
                      <td className="px-4 py-5 font-medium text-gray-700">{indexOfFirstItem + index + 1}</td>
                      <td className="px-4 py-5 text-gray-600 text-sm">
                        <div className="leading-tight">Начало: {formatDt(permit.validFrom)}</div>
                        <div className="leading-tight mt-0.5">Окончание: {formatDt(permit.validTo)}</div>
                      </td>
                      <td className="px-4 py-5 text-gray-400 text-sm">
                        <div className="leading-tight">Начало: —</div>
                        <div className="leading-tight mt-0.5">Окончание: —</div>
                      </td>
                      <td className="px-4 py-5 font-mono font-medium text-blue-600 group-hover:text-blue-800">{permit.permitId}</td>
                      <td className="px-4 py-5 text-gray-700">{issuerName}</td>
                      <td className="px-4 py-5 font-semibold text-gray-800">{permit.templateType || 'Наряд повышенной опасности'}</td>
                      <td className="px-4 py-5 text-center">
                        <StatusBadge status={permit.status} />
                      </td>
                      <td className="px-4 py-5 text-right text-gray-300 group-hover:text-blue-500 transition-colors">
                        <ChevronRight size={22} />
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr
                    key={permit.id}
                    onClick={() => onSelectPermit(permit.id)}
                    className="group cursor-pointer transition-colors even:bg-slate-50/50 hover:bg-blue-50/60"
                  >
                    <td className="px-6 py-5 font-mono font-medium text-blue-600 group-hover:text-blue-800">{permit.permitId}</td>
                    <td className="px-6 py-5 font-semibold text-gray-800">{permit.templateType}</td>
                    <td className="px-6 py-5 text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-gray-400 shrink-0" />
                        <span className="truncate max-w-[200px]">{permit.location?.name || 'Не указано'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-gray-700">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm text-slate-600 font-bold shrink-0">
                          {permit.initiator?.name?.charAt(0) || '?'}
                        </div>
                        <span className="font-medium truncate">{permit.initiator?.name || 'Неизвестно'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-gray-500 font-mono text-sm">
                      {new Date(permit.createdAt).toLocaleDateString('ru-RU')}
                      <span className="text-gray-400 ml-2">{new Date(permit.createdAt).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <StatusBadge status={permit.status} />
                    </td>
                    <td className="px-6 py-5 text-right text-gray-300 group-hover:text-blue-500 transition-colors">
                      <ChevronRight size={22} />
                    </td>
                  </tr>
                );
              })}

              {/* Empty State */}
              {filteredPermits.length === 0 && (
                <tr>
                  <td colSpan={isArchiveView ? 8 : 7} className="p-16 text-center text-gray-500">
                    <div className="inline-block p-5 rounded-full bg-gray-50 mb-4">
                      <Search size={40} className="text-gray-300" />
                    </div>
                    <p className="text-xl font-medium">Наряды не найдены</p>
                    <p className="text-base mt-2">
                        {isArchiveView
                            ? 'В архиве пока пусто'
                            : 'В журнале нет активных нарядов. Попробуйте изменить фильтры.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredPermits.length > 0 && (
          <div className="flex items-center justify-between px-6 py-5 border-t border-gray-200 bg-white">
            <div className="text-base text-gray-500">
              Показано <span className="font-medium text-gray-900">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredPermits.length)}</span> из <span className="font-medium text-gray-900">{filteredPermits.length}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={22} />
              </button>

              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                  <button
                    key={number}
                    onClick={() => goToPage(number)}
                    className={`
                      w-11 h-11 flex items-center justify-center rounded-lg text-base font-semibold transition-colors
                      ${currentPage === number
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                        : 'text-gray-600 hover:bg-gray-100'}
                    `}
                  >
                    {number}
                  </button>
                ))}
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={22} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {currentItems.map((permit, index) => {
          const formatDt = (s: string | undefined) => {
            if (!s) return '—';
            try {
              const d = new Date(s);
              return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            } catch { return '—'; }
          };
          const issuerStep = (permit as any).approvalSteps?.find((s: any) => s.role === 'ISSUER');
          const issuerName = issuerStep?.approver_name || permit.initiator?.name || '—';

          return (
            <div
              key={permit.id}
              onClick={() => onSelectPermit(permit.id)}
              className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm active:bg-gray-50 transition-colors relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-0">
                 <StatusBadge status={permit.status} />
              </div>

              <div className="flex justify-between items-start mb-4 mt-2">
                <div>
                  {isArchiveView ? (
                    <>
                      <span className="text-sm text-gray-500 block mb-1">№ {indexOfFirstItem + index + 1}</span>
                      <span className="text-sm font-mono text-blue-600 block mb-1">{permit.permitId}</span>
                      <h3 className="font-bold text-gray-900 text-xl leading-tight">{permit.templateType || 'Наряд повышенной опасности'}</h3>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-mono text-blue-600 block mb-1">{permit.permitId}</span>
                      <h3 className="font-bold text-gray-900 text-xl leading-tight">{permit.templateType}</h3>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4 text-base text-gray-600 mb-6">
                {isArchiveView ? (
                  <>
                    <div className="flex items-start gap-2.5">
                      <Calendar size={18} className="text-gray-400 mt-0.5 shrink-0" />
                      <span><strong>Первичный допуск:</strong> {formatDt(permit.validFrom)} — {formatDt(permit.validTo)}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Calendar size={18} className="text-gray-400 mt-0.5 shrink-0" />
                      <span><strong>Вторичный допуск:</strong> —</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <User size={18} className="text-gray-400 mt-0.5 shrink-0" />
                      <span><strong>Выдал наряд:</strong> {issuerName}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-2.5">
                      <MapPin size={18} className="text-gray-400 mt-0.5 shrink-0" />
                      <span>{permit.location?.name || 'Не указано'}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <User size={18} className="text-gray-400 mt-0.5 shrink-0" />
                      <span>{permit.initiator?.name || 'Неизвестно'}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Calendar size={18} className="text-gray-400 shrink-0" />
                      <span className="font-mono text-sm">{new Date(permit.createdAt).toLocaleDateString('ru-RU')}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center justify-end pt-4 border-t border-gray-100">
                <span className="text-blue-600 text-base font-semibold flex items-center">
                  Открыть карточку <ChevronRight size={18} className="ml-1"/>
                </span>
              </div>
            </div>
          );
        })}

        {/* Mobile Pagination */}
        {filteredPermits.length > 0 && (
          <div className="flex justify-center gap-4 pt-4 pb-20">
            <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex-1 py-4 px-4 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium disabled:opacity-50 shadow-sm text-lg"
              >
                Назад
            </button>
            <span className="flex items-center font-medium text-gray-600 text-lg">
              {currentPage} / {totalPages}
            </span>
             <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex-1 py-4 px-4 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium disabled:opacity-50 shadow-sm text-lg"
              >
                Далее
            </button>
          </div>
        )}
      </div>

    </div>
  );
};