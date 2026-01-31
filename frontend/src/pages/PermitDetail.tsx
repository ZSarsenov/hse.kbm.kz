import React, { useState } from 'react';
import {
  ArrowLeft, MapPin, User, Clock, FileText, CheckCircle2, AlertTriangle, FileSignature, XCircle, Download, Shield, Users, Edit3, Trash2, Copy
} from 'lucide-react';
import { WorkPermit, PermitCategory, ElectricalLifecycle } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ElectricalPermitForm } from '../components/ElectricalPermitForm';
import { useNCALayer } from '../hooks/useNCALayer';
import { ApprovalTracker } from '../components/ApprovalTracker';

interface PermitDetailProps {
  permit: WorkPermit;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const PermitDetail: React.FC<PermitDetailProps> = ({ permit, onBack, onEdit, onDelete }) => {
  // Распаковка данных (безопасный доступ)
  const data: any = permit.data || (permit as any).formData || {};
  const initiator = (permit.initiator as any) || {};

  // 1. ПОЛУЧАЕМ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ
  const currentUser = JSON.parse(localStorage.getItem('user_data') || '{}');
  const currentUserId = String(currentUser.id || currentUser.user_id);

  // 2. ОПРЕДЕЛЯЕМ РОЛЬ
  const initiatorId = String(initiator.id || data.issuer?.id || '');
  const isInitiator = currentUserId === initiatorId;

  // Ищем мой шаг
  const steps = (permit as any).approvalSteps || [];
  const myStep = steps.find((s: any) => String(s.approver_id) === currentUserId);

  // 3. ЛОГИКА ВИДИМОСТИ КНОПОК
  // Кнопка "Подписать" (только для автора, если статус Черновик)
  const showSignDraft = permit.status === 'DRAFT' && isInitiator;

  // Кнопка "Согласовать" (только если наряд в работе И мой шаг сейчас активен)
  const showApprove = permit.status === 'PENDING_APPROVAL' && myStep?.status === 'PENDING';

  // Кнопка "Отклонить" (аналогично)
  const showReject = permit.status === 'PENDING_APPROVAL' && myStep?.status === 'PENDING';

  // 👇 ЛОГИКА ДЛЯ КНОПКИ КОПИРОВАНИЯ
  // Показывать только инициатору, если наряд ОТКЛОНЕН, ЗАКРЫТ или АРХИВИРОВАН.
  const showDuplicate = isInitiator && (permit.status === 'REJECTED' || permit.status === 'CLOSED' || permit.status === 'ARCHIVED');

  // 👇 НОВОЕ: Показывать кнопку скачивания ТОЛЬКО если наряд согласован или закрыт
  // В Django модели обычно есть статусы APPROVED или CLOSED. Проверьте, какой у вас финальный статус.
  // Я добавил проверку на 'APPROVED', 'CLOSED' и 'ARCHIVED' (если архивный был успешным).
  const showDownload = permit.status === 'APPROVED' || permit.status === 'CLOSED' || permit.status === 'ARCHIVED';


  // --- ЭЛЕКТРОУСТАНОВКИ ---
  const [lifecycle, setLifecycle] = useState<ElectricalLifecycle>({
    dailyAdmissions: permit.lifecycle?.dailyAdmissions || [],
    brigadeChanges: permit.lifecycle?.brigadeChanges || [],
    briefingLogs: permit.lifecycle?.briefingLogs || [],
    completionDateTime: permit.lifecycle?.completionDateTime,
    notifiedTo: permit.lifecycle?.notifiedTo,
  });

  if (permit.category === PermitCategory.ELECTRICAL) {
    return (
      <div className="space-y-6">
        <button onClick={onBack} className="flex items-center text-gray-500 hover:text-gray-900 transition-colors w-fit text-lg font-medium">
          <ArrowLeft size={24} className="mr-2" /> Назад к списку
        </button>
        <ElectricalPermitForm
          mode="execution"
          initialData={data}
          initialLifecycle={lifecycle}
          onUpdateLifecycle={(updated) => setLifecycle(updated)}
        />
      </div>
    );
  }

  // --- ОБЫЧНЫЕ НАРЯДЫ ---
  const [activeTab, setActiveTab] = useState<'info' | 'safety' | 'team'>('info');
  const { execute, loading, error: ncaError } = useNCALayer();


  // --- HANDLERS ---

  // 👇 ФУНКЦИЯ КОПИРОВАНИЯ
  const handleDuplicate = async () => {
      if (!confirm("Создать новый черновик на основе этого наряда?")) return;

      try {
          const response = await fetch(`/api/v1/permits/${permit.id}/duplicate/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Token ${localStorage.getItem('auth_token')}`
            }
          });

          const resData = await response.json();
          if (response.ok && resData.ok) {
             alert(`✅ Копия создана! Новый черновик доступен в меню "Главное".`);
             onBack(); // Возвращаемся в список, там уже будет новый наряд сверху
          } else {
             alert(`Ошибка: ${resData.error || 'Не удалось скопировать'}`);
          }
      } catch (e) {
          console.error(e);
          alert("Ошибка сети");
      }
  };


// 👇 НОВАЯ ФУНКЦИЯ СКАЧИВАНИЯ PDF и Docx
  const handleDownloadPdf = async () => {
      try {
          const response = await fetch(`/api/v1/permits/${permit.id}/download_docx/`, {
              method: 'GET',
              headers: {
                  'Authorization': `Token ${localStorage.getItem('auth_token')}`,
              },
          });

          if (response.ok) {
              // Получаем blob (бинарный файл)
              const blob = await response.blob();
              // Создаем ссылку для скачивания
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `Наряд_${permit.permitId}.docx`; // Имя файла
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.URL.revokeObjectURL(url);
          } else {
              alert("Ошибка при скачивании PDF. Возможно, файл еще не сгенерирован.");
          }
      } catch (error) {
          console.error("Download error:", error);
          alert("Ошибка сети при скачивании.");
      }
  };

  const handleSign = async () => {
    try {
      const signerIIN = currentUser.iin || initiator.iin;
      if (!signerIIN) {
          alert("Ошибка: Не найден ИИН пользователя. Проверьте профиль.");
          return;
      }
      console.log("Начинаем подписание...", signerIIN);
      const xmlToSign = `<WorkPermit><ID>${permit.permitId}</ID><Date>${new Date().toISOString()}</Date></WorkPermit>`;
      const args = ['PKCS12', 'SIGNATURE', xmlToSign, '', ''];

      const signedXml = await execute('signXml', args);
      if (!signedXml) throw new Error("Получен пустой ответ от NCALayer");

      const response = await fetch(`/api/v1/permits/${permit.id}/sign/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ signed_xml: signedXml }),
      });

      const resData = await response.json();
      if (response.ok && resData.ok) {
         alert(`✅ УСПЕХ! ${resData.status}`);
         onBack();
      } else {
         alert(`❌ ОШИБКА: ${resData.error || 'Не удалось подписать'}`);
      }
    } catch (e: any) {
      console.error(e);
      alert(`Ошибка: ${e.message || JSON.stringify(e)}`);
    }
  };

  const handleReject = async () => {
      const reason = prompt("Пожалуйста, укажите причину отклонения наряда:");
      if (reason === null) return;
      if (!reason.trim()) {
          alert("Причина отклонения обязательна!");
          return;
      }
      try {
          const response = await fetch(`/api/v1/permits/${permit.id}/reject/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Token ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify({ reason: reason }),
          });
          const resData = await response.json();
          if (response.ok && resData.ok) {
             alert("⛔ Наряд успешно отклонен.");
             onBack();
          } else {
             alert(`Ошибка: ${resData.error}`);
          }
      } catch (e) {
          console.error(e);
          alert("Ошибка соединения с сервером.");
      }
  };



  const tabs = [
    { id: 'info', label: 'Основное' },
    { id: 'safety', label: 'Меры безопасности' },
    { id: 'team', label: 'Бригада' },
  ];

  const renderUserName = (userObj: any, fallback: string = '—') => {
      if (userObj && typeof userObj === 'object' && userObj.name) return userObj.name;
      if (typeof userObj === 'string' && userObj.trim() !== '') return userObj;
      return fallback;
  };

  const safetyFields = [
      { key: 'm5_1_stop', label: '5.1 Остановить' },
      { key: 'm5_2_disconnect', label: '5.2 Отключить' },
      { key: 'm5_3_install', label: '5.3 Установить' },
      { key: 'm5_4_analysis', label: '5.4 Взять пробу для анализа' },
      { key: 'm5_5_fence', label: '5.5 Оградить' },
      { key: 'm5_6_height', label: '5.6 Меры при работе на высоте' },
      { key: 'm5_7_warn', label: '5.7 Предупредить' },
      { key: 'm5_8_railway', label: '5.8 Меры у Ж/Д путей' },
      { key: 'm5_9_routes', label: '5.9 Маршруты к месту работы' },
      { key: 'm5_10_additional', label: '5.10 Дополнительные мероприятия' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">

      <button onClick={onBack} className="flex items-center text-slate-500 hover:text-blue-600 transition-colors group mb-4">
        <div className="p-2 rounded-full bg-white border border-gray-200 group-hover:border-blue-200 mr-3 shadow-sm">
           <ArrowLeft size={20} />
        </div>
        <span className="font-medium">Назад к списку</span>
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* HEADER */}
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
                <span className="font-medium">{permit.location?.name || 'Место не указано'}</span>
              </div>
            </div>
            {/* старая кнопка скачивания
                <div className="flex gap-2">
               <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Download size={20} /></button>
            </div> */}

            {/* 👇 КНОПКА СКАЧИВАНИЯ (Видна только для согласованных/закрытых) */}
            {showDownload && (
                <div className="flex gap-2">
                   <button
                       onClick={handleDownloadPdf}
                       className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-2 font-medium"
                       title="Скачать PDF"
                   >
                       <Download size={20} />
                       <span className="hidden sm:inline">Скачать наряд</span>
                   </button>
                </div>
            )}

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-100">
             <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600"><User size={20} /></div>
                <div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Инициатор</p>
                   <p className="font-semibold text-slate-700">{initiator?.name || 'Неизвестно'}</p>
                   <p className="text-xs text-slate-500">{initiator?.position || 'Сотрудник'}</p>
                </div>
             </div>
             <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm text-amber-500"><Clock size={20} /></div>
                <div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Период работ</p>
                   <p className="font-semibold text-slate-700">{permit.validFrom ? new Date(permit.validFrom).toLocaleDateString() : '—'}</p>
                   <p className="text-xs text-slate-500">{permit.validFrom ? new Date(permit.validFrom).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</p>
                </div>
             </div>
             <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm text-rose-500"><AlertTriangle size={20} /></div>
                <div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Опасность</p>
                   <span className="text-xs bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-100 font-medium">Повышенная</span>
                </div>
             </div>
          </div>
        </div>

        {/* TABS */}
        <div className="border-b border-gray-200 px-6 md:px-8">
           <div className="flex gap-6 overflow-x-auto">
             {tabs.map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as any)}
                 className={`pb-4 pt-4 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
               >
                 {tab.label}
               </button>
             ))}
           </div>
        </div>

        {/* CONTENT */}
        <div className="p-6 md:p-8 min-h-[300px]">
           {activeTab === 'info' && (
             <div className="space-y-8 animate-in fade-in duration-300">
                <div>
                   <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2"><FileText size={20} className="text-slate-400"/> Описание и условия работ</h3>

                   <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-4">
                       <div><span className="text-xs font-bold text-gray-400 uppercase">Наименование работ</span><p className="text-gray-900 font-medium text-lg">{data.workName || '—'}</p></div>
                       <div><span className="text-xs font-bold text-gray-400 uppercase">Содержание работ</span><p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{data.content || "Описание отсутствует"}</p></div>
                       <div><span className="text-xs font-bold text-gray-400 uppercase">Место проведения</span><p className="text-gray-800">{data.workPlace} / {data.department}</p></div>
                   </div>
                </div>

                    {/* ТРЕКЕР СОГЛАСОВАНИЯ (Здесь будет видна причина отказа) */}
                    <ApprovalTracker steps={(permit as any).approvalSteps} />

                <div>
                   <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><User size={20} className="text-slate-400"/> Ответственные лица</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border border-gray-200 rounded-lg"><span className="text-xs text-gray-400 uppercase font-bold">Выдающий наряд</span><p className="font-medium text-gray-900">{initiator?.name || renderUserName(data.issuer, '—')}</p></div>
                      <div className="p-4 border border-gray-200 rounded-lg"><span className="text-xs text-gray-400 uppercase font-bold">Ответственный руководитель</span><p className="font-medium text-gray-900">{renderUserName(data.responsible, 'Не назначался')}</p></div>
                      <div className="p-4 border border-gray-200 rounded-lg"><span className="text-xs text-gray-400 uppercase font-bold">Производитель работ</span><p className="font-medium text-gray-900">{renderUserName(data.producer, '—')}</p></div>
                      <div className="p-4 border border-gray-200 rounded-lg"><span className="text-xs text-gray-400 uppercase font-bold">Допускающий</span><p className="font-medium text-gray-900">{renderUserName(data.admitting, '—')}</p></div>
                      <div className="p-4 border border-gray-200 rounded-lg "><span className="text-xs text-gray-400 uppercase font-bold">Согласовано (Нач. смены / Участка / Инженер ТБ)</span><p className="font-medium text-gray-900">{renderUserName(data.supervisor, '—')}</p></div>
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'safety' && (
               <div className="space-y-6 animate-in fade-in duration-300">
                  <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2"><Shield size={20} className="text-green-600"/> Мероприятия по обеспечению безопасности</h3>
                   <div className="space-y-4">
                       {safetyFields.map(field => {
                           const value = data[field.key];
                           if (!value) return null;
                           return (<div key={field.key} className="p-4 border-l-4 border-green-500 bg-green-50/30 rounded-r-lg"><h4 className="font-bold text-gray-700 text-sm mb-1">{field.label}</h4><p className="text-gray-900">{value}</p></div>);
                       })}
                       {safetyFields.every(f => !data[f.key]) && <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">Меры безопасности не указаны</div>}
                   </div>
               </div>
           )}

           {activeTab === 'team' && (
               <div className="animate-in fade-in duration-300">
                   <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Users size={20} className="text-blue-500"/> Состав бригады</h3><span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Всего: {data.teamMembers?.length || 0} чел.</span></div>
                   {data.teamMembers && data.teamMembers.length > 0 ? (
                       <div className="overflow-x-auto border border-gray-200 rounded-lg">
                           <table className="w-full text-left text-sm">
                               <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase"><tr><th className="px-4 py-3 w-10">№</th><th className="px-4 py-3">ФИО</th><th className="px-4 py-3">Должность</th><th className="px-4 py-3">Инструктаж провел</th><th className="px-4 py-3">Дата</th></tr></thead>
                               <tbody className="divide-y divide-gray-100">{data.teamMembers.map((member: any, idx: number) => (<tr key={idx} className="hover:bg-gray-50"><td className="px-4 py-3 text-gray-400">{idx + 1}</td><td className="px-4 py-3 font-medium text-gray-900">{member.name}</td><td className="px-4 py-3 text-gray-600">{member.role}</td><td className="px-4 py-3 text-gray-600">{member.instructedBy}</td><td className="px-4 py-3 text-gray-500">{member.instructedAt ? new Date(member.instructedAt).toLocaleString() : '-'}</td></tr>))}</tbody>
                           </table>
                       </div>
                   ) : (<div className="text-center py-10 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">Состав бригады не указан</div>)}
               </div>
           )}
        </div>
      </div>

      {/* FOOTER: КНОПКИ ДЕЙСТВИЙ */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg md:relative md:bg-transparent md:border-0 md:shadow-none md:p-0 z-20">
         <div className="max-w-5xl mx-auto flex flex-col sm:flex-row gap-3 justify-end">
            {ncaError && <div className="flex-1 text-red-600 bg-red-50 border border-red-100 px-4 py-2 rounded-lg text-sm flex items-center"><AlertTriangle size={16} className="mr-2 shrink-0"/>{ncaError}</div>}

            {/* 👇 КНОПКА КОПИРОВАНИЯ (ДЛЯ ОТКЛОНЕННЫХ) */}

            {showDuplicate && (
                <button
                    onClick={handleDuplicate}
                    className="flex-1 sm:flex-none px-6 py-2.5 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium flex items-center justify-center gap-2 transition-colors"
                >
                    <Copy size={18} />
                    Создать копию
                </button>
            )}


            {/* 1. ОТКЛОНИТЬ (Только если статус PENDING_APPROVAL) */}
            {showReject && (
                <button
                    onClick={handleReject}
                    disabled={loading}
                    className="hidden sm:flex px-4 py-2.5 border border-red-300 bg-white text-red-700 rounded-lg hover:bg-red-50 font-medium items-center justify-center gap-2"
                >
                    <XCircle size={18} /> Отклонить
                </button>
            )}

            {/* 2. РЕДАКТИРОВАТЬ / УДАЛИТЬ (Только для черновика!) */}
            {/* 👇 ИЗМЕНЕНО: Убрано '|| permit.status === 'REJECTED'' */}
            {permit.status === 'DRAFT' && isInitiator && (
                <>
                    <button onClick={onDelete} className="px-4 py-2.5 border border-red-200 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-medium flex items-center justify-center gap-2"><Trash2 size={18} /><span className="sm:hidden">Удалить</span></button>
                    <button onClick={onEdit} className="flex-1 sm:flex-none px-6 py-2.5 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium flex items-center justify-center gap-2"><Edit3 size={18} />Редактировать</button>
                </>
            )}

            {/* 3. ПОДПИСАТЬ / СОГЛАСОВАТЬ */}
            {(showSignDraft || showApprove) && (
                <button
                    onClick={handleSign}
                    disabled={loading}
                    className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-white font-medium shadow-sm flex items-center justify-center gap-2 transition-all
                    ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                   {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <FileSignature size={18} />}
                   {showSignDraft ? 'Подписать (ЭЦП)' : 'Согласовать (ЭЦП)'}
                </button>
            )}

            {/* 4. ИНФОРМАЦИЯ (Если нечего нажимать, но наряд активен) */}
            {!showSignDraft && !showApprove && permit.status === 'PENDING_APPROVAL' && (
                <div className="flex items-center text-gray-500 text-sm italic px-4 bg-gray-50 rounded-lg border border-gray-100 py-2">
                    {myStep?.status === 'APPROVED'
                        ? <span className="text-green-600 flex items-center gap-2"><CheckCircle2 size={16}/> Вы уже подписали этот наряд</span>
                        : <span className="flex items-center gap-2"><Clock size={16}/> Ожидайте своей очереди подписания</span>
                    }
                </div>
            )}

         </div>
      </div>
    </div>
  );
};