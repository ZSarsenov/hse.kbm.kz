import React, { useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  User,
  Calendar,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileSignature,
  XCircle,
  Download,
  Share2,
  MoreVertical
} from 'lucide-react';
import { WorkPermit, PermitStatus, PermitCategory, ElectricalLifecycle } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ElectricalPermitForm } from '../components/ElectricalPermitForm';
import { useNCALayer } from '../hooks/useNCALayer';

interface PermitDetailProps {
  permit: WorkPermit;
  onBack: () => void;
}

export const PermitDetail: React.FC<PermitDetailProps> = ({ permit, onBack }) => {
  // --- ЛОГИКА ДЛЯ ЭЛЕКТРОУСТАНОВОК ---
  const [lifecycle, setLifecycle] = useState<ElectricalLifecycle>({
    dailyAdmissions: permit.lifecycle?.dailyAdmissions || [],
    brigadeChanges: permit.lifecycle?.brigadeChanges || [],
    briefingLogs: permit.lifecycle?.briefingLogs || [],
    completionDateTime: permit.lifecycle?.completionDateTime,
    notifiedTo: permit.lifecycle?.notifiedTo,
  });

  // Если это электроустановка — возвращаем специальный компонент
  if (permit.category === PermitCategory.ELECTRICAL) {
    return (
      <div className="space-y-6">
        <button 
          onClick={onBack}
          className="flex items-center text-gray-500 hover:text-gray-900 transition-colors w-fit text-lg font-medium"
        >
          <ArrowLeft size={24} className="mr-2" />
          Назад к списку
        </button>

        <ElectricalPermitForm 
          mode="execution"
          initialData={permit.formData}
          initialLifecycle={lifecycle}
          onUpdateLifecycle={(updated) => setLifecycle(updated)}
        />
      </div>
    );
  }

  // --- ЛОГИКА ДЛЯ ОБЫЧНЫХ НАРЯДОВ (STANDARD VIEW) ---
  const [activeTab, setActiveTab] = useState<'info' | 'safety' | 'team'>('info');
  
  // Подключаем NCALayer
  const { execute, loading, error: ncaError } = useNCALayer();

  const handleSign = async () => {
    try {
      // 1. Формируем XML для подписи
      // Берем ID и ИИН инициатора (если есть), либо заглушку
      const initiatorIIN = (permit.initiator as any).iin || '000000000000';
      const xmlToSign = `<WorkPermit><ID>${permit.permitId}</ID><IIN>${initiatorIIN}</IIN><Date>${new Date().toISOString()}</Date></WorkPermit>`;

      // 2. Аргументы для signXml
      const args = ['PKCS12', 'SIGNATURE', xmlToSign, '', ''];

      // 3. Вызываем NCALayer
      console.log("Вызов NCALayer...");
      const signedXml = await execute('signXml', args);
      console.log("XML подписан:", signedXml);

      // 4. Отправляем на Бэкенд (Используем IP адрес!)
      // Важно: если используешь токены, раскомментируй строку Authorization
      const response = await fetch(`http://10.60.2.89:8000/api/v1/permits/${permit.id}/sign/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('auth_token')}` 
        },
        body: JSON.stringify({ signed_xml: signedXml }),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
         alert(`УСПЕХ!\nПодписант: ${data.sign_subject}\nИИН: ${data.sign_iin}`);
         // Здесь можно обновить статус наряда локально или перезапросить данные
      } else {
         alert(`ОШИБКА СЕРВЕРА: ${data.error || data.sign_error || 'Не удалось проверить подпись'}`);
      }

    } catch (e: any) {
      console.error(e);
      if (e.message) alert(`Ошибка: ${e.message}`);
    }
  };

  const tabs = [
    { id: 'info', label: 'Основное' },
    { id: 'safety', label: 'Меры безопасности' },
    { id: 'team', label: 'Бригада' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

      {/* Навигация */}
      <button
        onClick={onBack}
        className="flex items-center text-slate-500 hover:text-blue-600 transition-colors group mb-4"
      >
        <div className="p-2 rounded-full bg-white border border-gray-200 group-hover:border-blue-200 mr-3 shadow-sm">
           <ArrowLeft size={20} />
        </div>
        <span className="font-medium">Назад к списку</span>
      </button>

      {/* Карточка наряда */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

        {/* Шапка */}
        <div className="p-6 md:p-8 border-b border-gray-100 bg-gradient-to-r from-white to-slate-50/50">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <StatusBadge status={permit.status} />
                <span className="text-sm font-mono text-slate-400">#{permit.permitId}</span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 leading-tight mb-2">{permit.templateType || 'Наряд-допуск'}</h1>
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin size={18} className="text-blue-500" />
                <span className="font-medium">{permit.location.name}</span>
              </div>
            </div>

            <div className="flex gap-2">
               <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                 <Share2 size={20} />
               </button>
               <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                 <Download size={20} />
               </button>
               <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                 <MoreVertical size={20} />
               </button>
            </div>
          </div>

          {/* Инфо-блоки */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-100">
             <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600">
                   <User size={20} />
                </div>
                <div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Инициатор</p>
                   <p className="font-semibold text-slate-700">{permit.initiator.name}</p>
                   <p className="text-xs text-slate-500">{permit.initiator.position}</p>
                </div>
             </div>
             <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm text-amber-500">
                   <Clock size={20} />
                </div>
                <div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Время создания</p>
                   <p className="font-semibold text-slate-700">{new Date(permit.createdAt).toLocaleDateString()}</p>
                   <p className="text-xs text-slate-500">{new Date(permit.createdAt).toLocaleTimeString()}</p>
                </div>
             </div>
             <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm text-rose-500">
                   <AlertTriangle size={20} />
                </div>
                <div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Опасные факторы</p>
                   <div className="flex flex-wrap gap-1">
                      {permit.dangerousWorks?.map(w => (
                        <span key={w.id} className="text-xs bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-100 font-medium">
                          {w.name}
                        </span>
                      )) || <span className="text-xs text-gray-400">Нет</span>}
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Табы */}
        <div className="border-b border-gray-200 px-6 md:px-8">
           <div className="flex gap-6 overflow-x-auto">
             {tabs.map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as any)}
                 className={`
                   pb-4 pt-4 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors whitespace-nowrap
                   ${activeTab === tab.id
                     ? 'border-blue-600 text-blue-600'
                     : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                 `}
               >
                 {tab.label}
               </button>
             ))}
           </div>
        </div>

        {/* Контент табов */}
        <div className="p-6 md:p-8 min-h-[300px]">
           {activeTab === 'info' && (
             <div className="space-y-6">
                <div>
                   <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                     <FileText size={20} className="text-slate-400"/>
                     Описание работ
                   </h3>
                   <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                     {permit.formData?.content || "Описание отсутствует"}
                   </p>
                </div>

                {/* Маршрут согласования (если есть) */}
                {permit.approvalSteps && (
                  <div className="mt-8">
                     <h3 className="text-lg font-bold text-slate-800 mb-6">Маршрут согласования</h3>
                     <div className="relative pl-4 border-l-2 border-slate-100 space-y-8">
                        {permit.approvalSteps.map((step, idx) => (
                          <div key={idx} className="relative">
                             <div className={`
                               absolute -left-[21px] top-1 w-10 h-10 rounded-full border-4 border-white shadow-sm flex items-center justify-center
                               ${step.status === 'APPROVED' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}
                             `}>
                                {step.status === 'APPROVED' ? <CheckCircle2 size={18} /> : <div className="w-2.5 h-2.5 bg-slate-400 rounded-full" />}
                             </div>
                             <div className="ml-6">
                                <h4 className="font-bold text-slate-800">{step.approverName || 'Согласующий'}</h4>
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{step.roleLabel}</span>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
                )}
             </div>
           )}
           {activeTab === 'safety' && <div className="text-slate-500 italic p-4">Раздел мер безопасности...</div>}
           {activeTab === 'team' && <div className="text-slate-500 italic p-4">Список членов бригады...</div>}
        </div>
      </div>

      {/* FOOTER (Кнопки действий) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg md:relative md:bg-transparent md:border-0 md:shadow-none md:p-0 z-20">
         <div className="max-w-5xl mx-auto flex flex-col sm:flex-row gap-3 justify-end">

            {/* Ошибка NCALayer */}
            {ncaError && (
              <div className="flex-1 text-red-600 bg-red-50 border border-red-100 px-4 py-2 rounded-lg text-sm flex items-center">
                <AlertTriangle size={16} className="mr-2 shrink-0"/>
                {ncaError}
              </div>
            )}

            <button className="flex-1 sm:flex-none px-6 py-2.5 border border-gray-300 bg-white text-slate-700 rounded-lg hover:bg-gray-50 font-medium transition-colors flex items-center justify-center gap-2">
               <XCircle size={18} />
               Отклонить
            </button>

            <button
              onClick={handleSign}
              disabled={loading}
              className={`
                flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-white font-medium shadow-sm flex items-center justify-center gap-2 transition-all
                ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
              `}
            >
               {loading ? (
                 <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
               ) : (
                 <FileSignature size={18} />
               )}
               {loading ? 'Подключение...' : 'Подписать (ЭЦП)'}
            </button>

         </div>
      </div>

    </div>
  );
};