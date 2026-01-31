
import React, { useState, useEffect } from 'react';
import { Lock, Unlock, AlertTriangle, Search, Filter, RefreshCw, FileText, ChevronRight, X, Printer } from 'lucide-react';
import { LOTOReport, LotoStatus } from '../types';
import { IsolationMatrixForm } from '../components/IsolationMatrixForm';

// Mock Service Function (Simulating API) with Detailed Matrix Data
const fetchLotoReports = async (): Promise<LOTOReport[]> => {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 500));
  // Return empty array to clear demo data
  return [];
};

interface LotoReportsProps {
  onNavigateToPermit: (permitId: string) => void;
}

export const LotoReports: React.FC<LotoReportsProps> = ({ onNavigateToPermit }) => {
  const [reports, setReports] = useState<LOTOReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<LOTOReport | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchLotoReports();
      setReports(data);
    } catch (error) {
      console.error("Failed to load LOTO reports", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReports = reports.filter(r => 
    r.equipmentTag.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.permitId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.isolationPoint.toLowerCase().includes(searchQuery.toLowerCase())
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
            <AlertTriangle size={12} /> ЧАСТИЧНО
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
            placeholder="Поиск по Тегу оборудования, ID наряда или Точке изоляции..." 
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-base"
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 text-gray-600 cursor-not-allowed opacity-70">
           <Filter size={18} />
           <span>Фильтры</span>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">Загрузка данных...</div>
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
                    key={report.id} 
                    className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                    onClick={() => setSelectedReport(report)}
                  >
                    <td className="px-6 py-4 font-mono font-medium text-gray-900">{report.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800">{report.equipmentTag}</div>
                      <div className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5" 
                          onClick={(e) => { e.stopPropagation(); onNavigateToPermit(report.permitId); }}>
                        <FileText size={10} /> {report.permitId}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{report.isolationPoint}</td>
                    <td className="px-6 py-4">{getStatusBadge(report.status)}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{report.lockedBy}</div>
                      <div className="text-xs text-gray-400">ЭЦП: {report.signatureStatus === 'VALID' ? 'Подтверждена' : 'Ожидает'}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-mono">
                      {new Date(report.lockedAt).toLocaleDateString('ru-RU')} <span className="text-gray-400">{new Date(report.lockedAt).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}</span>
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
                       Записи не найдены
                     </td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL VIEW MODAL (Matrix II Format) */}
      {selectedReport && (
         <div className="fixed inset-0 z-[110] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
               
               {/* Modal Header */}
               <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                  <div>
                      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                         Матрица ИИ: {selectedReport.id}
                         {getStatusBadge(selectedReport.status)}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">Детализированный отчет о блокировке (Read-Only)</p>
                  </div>
                  <div className="flex gap-2">
                     <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Печать">
                        <Printer size={20} />
                     </button>
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
                      onChange={() => {}} // No-op in read-only mode
                      readOnly={true}
                   />
                   
                   {/* Audit Trail Footer */}
                   <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-2 gap-8">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                         <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Блокировка установлена</span>
                         <div className="font-bold text-gray-900">{selectedReport.lockedBy}</div>
                         <div className="text-sm text-gray-500 font-mono">{new Date(selectedReport.lockedAt).toLocaleString('ru-RU')}</div>
                         <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                            ЭЦП Валидна
                         </div>
                      </div>
                      
                      {selectedReport.unlockedBy && (
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                             <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Разблокировка</span>
                             <div className="font-bold text-gray-900">{selectedReport.unlockedBy}</div>
                             <div className="text-sm text-gray-500 font-mono">{new Date(selectedReport.unlockedAt!).toLocaleString('ru-RU')}</div>
                             <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                ЭЦП Валидна
                             </div>
                          </div>
                      )}
                   </div>
               </div>

            </div>
         </div>
      )}

    </div>
  );
};
