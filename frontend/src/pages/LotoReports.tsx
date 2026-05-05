
import React, { useState, useEffect } from 'react';
import { Lock, Unlock, AlertTriangle, Search, RefreshCw, FileText, ChevronRight, X } from 'lucide-react';
import { LOTOReport, LotoStatus } from '../types';
import { IsolationMatrixForm } from '../components/IsolationMatrixForm';

interface LotoReportsProps {
  onNavigateToPermit: (permitId: string) => void;
}

const mapPermitStatus = (status: string): LotoStatus => {
  if (status === 'CLOSED' || status === 'REJECTED') return LotoStatus.UNLOCKED;
  if (status === 'APPROVED') return LotoStatus.LOCKED;
  return LotoStatus.PARTIAL;
};

export const LotoReports: React.FC<LotoReportsProps> = ({ onNavigateToPermit }) => {
  const [reports, setReports] = useState<LOTOReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<LOTOReport | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/v1/permits/', {
        headers: { ...(token ? { 'Authorization': `Token ${token}` } : {}) }
      });
      if (!res.ok) throw new Error('Ошибка загрузки');
      const raw = await res.json();
      const items = Array.isArray(raw) ? raw : (raw.results || []);

      const lotoReports: LOTOReport[] = items
        .filter((p: any) => p.data?.lotoEnabled)
        .map((p: any) => {
          const d = p.data || {};
          const matrix = d.isolationMatrix || {};
          const admitting = d.admitting || {};
          return {
            id: p.permit_id || `#${p.id}`,
            permitId: String(p.id),
            equipmentTag: matrix.techNumber || '—',
            isolationPoint: matrix.installLocation || '—',
            status: mapPermitStatus(p.status),
            lockedBy: admitting.name || '—',
            lockedAt: matrix.dateDeveloped || p.created_at || '',
            signatureStatus: p.status === 'APPROVED' || p.status === 'CLOSED' ? 'VALID' as const : 'PENDING' as const,
            matrixData: {
              department: matrix.department || '',
              site: matrix.site || '',
              dateDeveloped: matrix.dateDeveloped || '',
              dateRevised: matrix.dateRevised || '',
              equipmentName: matrix.equipmentName || '',
              techNumber: matrix.techNumber || '',
              energySourceCount: matrix.energySourceCount || 1,
              energyType: matrix.energyType || '',
              lockType: matrix.lockType || '',
              installLocation: matrix.installLocation || '',
              checkResidualEnergy: matrix.checkResidualEnergy || false,
              checkLockDevice: matrix.checkLockDevice || false,
              checkPadlock: matrix.checkPadlock || false,
              checkTag: matrix.checkTag || false,
            },
          };
        });

      setReports(lotoReports);
    } catch (error) {
      console.error("Ошибка загрузки LOTO:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredReports = reports.filter(r =>
    r.equipmentTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.isolationPoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.lockedBy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: LotoStatus) => {
    switch (status) {
      case LotoStatus.LOCKED:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
            <Lock size={12} /> ЗАБЛОКИРОВАНО
          </span>
        );
      case LotoStatus.UNLOCKED:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
            <Unlock size={12} /> РАЗБЛОКИРОВАНО
          </span>
        );
      case LotoStatus.PARTIAL:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">
            <AlertTriangle size={12} /> В ПРОЦЕССЕ
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Отчеты LOTO</h1>
          <p className="text-slate-500 mt-2 text-lg">Реестр блокировок и изоляции источников энергии</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
        >
          <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
          <span>Обновить</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по номеру наряда, тегу, точке изоляции, ответственному..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-base"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
            Загрузка данных...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-gray-200 text-slate-500 font-bold uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-6 py-4">ID Отчета</th>
                  <th className="px-6 py-4">Оборудование / Тег</th>
                  <th className="px-6 py-4">Точка изоляции</th>
                  <th className="px-6 py-4">Статус</th>
                  <th className="px-6 py-4">Ответственный</th>
                  <th className="px-6 py-4">Дата блокировки</th>
                  <th className="px-6 py-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredReports.map((report) => (
                  <tr
                    key={report.permitId}
                    className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                    onClick={() => setSelectedReport(report)}
                  >
                    <td className="px-6 py-4 font-mono font-medium text-gray-900">{report.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800">{report.equipmentTag}</div>
                      <div className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                          onClick={(e) => { e.stopPropagation(); onNavigateToPermit(report.permitId); }}>
                        <FileText size={10} /> Открыть наряд
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{report.isolationPoint}</td>
                    <td className="px-6 py-4">{getStatusBadge(report.status)}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{report.lockedBy}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono">
                      {report.lockedAt ? new Date(report.lockedAt).toLocaleDateString('ru-RU') : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button className="text-gray-300 group-hover:text-blue-600 transition-colors">
                          <ChevronRight size={20} />
                       </button>
                    </td>
                  </tr>
                ))}
                {filteredReports.length === 0 && (
                   <tr>
                     <td colSpan={7} className="p-12 text-center text-gray-500">
                       {searchQuery ? 'По запросу ничего не найдено' : 'Нет нарядов с включённой процедурой LOTO'}
                     </td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL VIEW MODAL */}
      {selectedReport && (
         <div className="fixed inset-0 z-[110] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">

               {/* Modal Header */}
               <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                  <div>
                      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                         Матрица LOTO: {selectedReport.id}
                         {getStatusBadge(selectedReport.status)}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">Детализированный отчет о блокировке (Read-Only)</p>
                  </div>
                  <div className="flex gap-2">
                     <button
                        onClick={() => setSelectedReport(null)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                     >
                        <X size={24} />
                     </button>
                  </div>
               </div>

               {/* Modal Content */}
               <div className="flex-1 overflow-y-auto p-6 md:p-8">
                   <IsolationMatrixForm
                      data={selectedReport.matrixData}
                      onChange={() => {}}
                      readOnly={true}
                   />

                   {/* Audit Trail Footer */}
                   <div className="mt-8 pt-6 border-t border-gray-100">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-w-md">
                         <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Ответственный (Допускающий)</span>
                         <div className="font-bold text-gray-900">{selectedReport.lockedBy}</div>
                         <div className="text-sm text-gray-500 font-mono mt-1">
                           Дата: {selectedReport.lockedAt ? new Date(selectedReport.lockedAt).toLocaleDateString('ru-RU') : '—'}
                         </div>
                      </div>
                   </div>
               </div>

            </div>
         </div>
      )}

    </div>
  );
};
