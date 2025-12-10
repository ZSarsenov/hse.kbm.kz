import React, { useState } from 'react';
import {
  ArrowLeft, MapPin, User, Clock, AlertTriangle,
  FileText, CheckCircle2, FileSignature, XCircle,
  Download, Share2, MoreVertical
} from 'lucide-react';
import { WorkPermit } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { useNCALayer } from '../hooks/useNCALayer';

interface PermitDetailProps {
  permit: WorkPermit;
  onBack: () => void;
}

export const PermitDetail: React.FC<PermitDetailProps> = ({ permit, onBack }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'safety' | 'team'>('info');

  const { execute, loading, error: ncaError } = useNCALayer();

  const handleSign = async () => {
    // 1. Формируем чистый XML
    const cleanXml = `<WorkPermit><ID>${permit.id}</ID><IIN>${permit.initiator.iin}</IIN></WorkPermit>`;

    try {
      console.log("Начинаем подписание (signXml)...");

      // 2. Аргументы для signXml (5 штук)
      const args = [
        "PKCS12",
        "SIGNATURE",
        cleanXml,
        "",
        ""
      ];

      // 3. Вызываем метод через универсальный execute
      const signedXml = await execute("signXml", args);

      if (signedXml) {
            console.log("✅ УСПЕХ! Подписанный XML получен.");
            alert("Документ подписан! Отправляем на расшифровку...");

            try {
                const response = await fetch(`http://127.0.0.1:8000/api/v1/permits/${permit.id}/sign/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ xml: signedXml })
                });

                // Сначала проверяем статус, прежде чем парсить JSON
                if (response.status === 401) {
                    alert("Ошибка 401: Вы не авторизованы на сервере Django. (Но мы это исправили в Шаге 1)");
                    return;
                }

                const result = await response.json();

                if (response.ok) {
                    // УСПЕХ! Показываем данные, которые вернул Python
                    let msg = `✅ ПРОВЕРКА ПРОШЛА УСПЕШНО!\n\n`;
                    msg += `ФИО: ${result.signer_fio}\n`;
                    msg += `ИИН: ${result.signer_iin}\n`;
                    if (result.signer_bin) {
                        msg += `БИН: ${result.signer_bin}\n`;
                        msg += `Организация: ${result.organization}\n`;
                    }
                    alert(msg);
                    console.log("Данные с сервера:", result);
                } else {
                    alert(`Ошибка сервера: ${result.error}\nДетали: ${result.details || ''}`);
                }
            } catch (serverErr) {
                console.error(serverErr);
                alert("Ошибка соединения с сервером Django. Проверь консоль.");
            }
        }
    } catch (err: any) {
      console.error("Ошибка:", err);
      // Ошибку покажет ncaError в интерфейсе
    }
  };

  const tabs = [
    { id: 'info', label: 'Основное' },
    { id: 'safety', label: 'Меры безопасности' },
    { id: 'team', label: 'Бригада' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <button onClick={onBack} className="flex items-center text-slate-500 hover:text-blue-600 transition-colors group mb-4">
        <div className="p-2 rounded-full bg-white border border-gray-200 group-hover:border-blue-200 mr-3 shadow-sm">
           <ArrowLeft size={20} />
        </div>
        <span className="font-medium">Назад к списку</span>
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-gray-100 bg-gradient-to-r from-white to-slate-50/50">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <StatusBadge status={permit.status} />
                <span className="text-sm font-mono text-slate-400">#{permit.permitId}</span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 leading-tight mb-2">{permit.templateType}</h1>
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin size={18} className="text-blue-500" />
                <span className="font-medium">{permit.location.name}</span>
              </div>
            </div>
            <div className="flex gap-2">
               <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Share2 size={20} /></button>
               <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Download size={20} /></button>
               <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><MoreVertical size={20} /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-100">
             <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600"><User size={20} /></div>
                <div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Инициатор</p>
                   <p className="font-semibold text-slate-700">{permit.initiator.name}</p>
                   <p className="text-xs text-slate-500">{permit.department}</p>
                </div>
             </div>
             <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm text-amber-500"><Clock size={20} /></div>
                <div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Время работ</p>
                   <p className="font-semibold text-slate-700">14.11.2024, 08:00</p>
                   <p className="text-xs text-slate-500">до 14.11.2024, 17:00</p>
                </div>
             </div>
             <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm text-rose-500"><AlertTriangle size={20} /></div>
                <div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Опасные факторы</p>
                   <div className="flex flex-wrap gap-1">
                      {permit.dangerousWorks.map(w => (
                        <span key={w.id} className="text-xs bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-100 font-medium">{w.name}</span>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        </div>

        <div className="border-b border-gray-200 px-6 md:px-8">
           <div className="flex gap-6 overflow-x-auto">
             {tabs.map(tab => (
               <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`pb-4 pt-4 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>{tab.label}</button>
             ))}
           </div>
        </div>

        <div className="p-6 md:p-8 min-h-[300px]">
           {activeTab === 'info' && (
             <div className="space-y-6">
                <div>
                   <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2"><FileText size={20} className="text-slate-400"/> Описание работ</h3>
                   <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">{permit.formData?.content || "Описание отсутствует"}</p>
                </div>
                <div className="mt-8">
                   <h3 className="text-lg font-bold text-slate-800 mb-6">Маршрут согласования</h3>
                   <div className="relative pl-4 border-l-2 border-slate-100 space-y-8">
                      {permit.approvalSteps.map((step, idx) => (
                        <div key={step.id} className="relative">
                           <div className={`absolute -left-[21px] top-1 w-10 h-10 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${step.status === 'APPROVED' ? 'bg-green-100 text-green-600' : step.status === 'CURRENT' ? 'bg-blue-100 text-blue-600 ring-4 ring-blue-50' : 'bg-slate-100 text-slate-400'}`}>
                              {step.status === 'APPROVED' ? <CheckCircle2 size={18} /> : step.status === 'CURRENT' ? <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse" /> : <div className="w-2.5 h-2.5 bg-slate-400 rounded-full" />}
                           </div>
                           <div className="ml-6">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{step.roleLabel}</span>
                                {step.signedAt && <span className="text-xs text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded">{step.signedAt}</span>}
                              </div>
                              <h4 className={`font-bold ${step.status === 'PENDING' ? 'text-slate-400' : 'text-slate-800'}`}>{step.approverName}</h4>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
           )}
           {activeTab === 'safety' && <div className="text-slate-500">Здесь будут меры безопасности</div>}
           {activeTab === 'team' && <div className="text-slate-500">Здесь будет список бригады</div>}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg md:relative md:bg-transparent md:border-0 md:shadow-none md:p-0 z-20">
         <div className="max-w-5xl mx-auto flex flex-col sm:flex-row gap-3 justify-end">
            {ncaError && <div className="w-full text-red-600 bg-red-50 border border-red-100 px-4 py-2 rounded text-sm flex items-center"><AlertTriangle size={16} className="mr-2"/>{ncaError}</div>}
            <button className="flex-1 sm:flex-none px-6 py-2.5 border border-gray-300 bg-white text-slate-700 rounded-lg hover:bg-gray-50 font-medium transition-colors flex items-center justify-center gap-2"><XCircle size={18} />Отклонить</button>
            <button onClick={handleSign} disabled={loading} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-white font-medium shadow-sm flex items-center justify-center gap-2 transition-all ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
               {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <FileSignature size={18} />}
               {loading ? 'Подключение...' : 'Подписать (ЭЦП)'}
            </button>
         </div>
      </div>
    </div>
  );
};