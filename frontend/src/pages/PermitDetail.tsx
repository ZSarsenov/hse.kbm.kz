import React, { useState } from 'react';
import {
  ArrowLeft, MapPin, User, Clock, FileText, CheckCircle2, AlertTriangle, FileSignature, XCircle, Download, Shield, Users, Edit3, Trash2, Copy
} from 'lucide-react';
import { WorkPermit, PermitCategory, ElectricalLifecycle } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ElectricalPermitForm } from '../components/ElectricalPermitForm';
import { useNCALayer } from '../hooks/useNCALayer';
import { ApprovalTracker } from '../components/ApprovalTracker';
import { FileCheck, ClipboardList } from 'lucide-react';
import ChecklistSection, { ChecklistData } from '../components/ChecklistSection';

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

  // Ищем все мои шаги (может быть несколько ролей)
  const steps = (permit as any).approvalSteps || [];
  const mySteps = steps.filter((s: any) => String(s.approver_id) === currentUserId);
  // Выдающий наряд для блока «Ответственные лица» — из Хода согласования (шаг 1 ISSUER), не инициатор
  const issuerStep = steps.find((s: any) => s.role === 'ISSUER');
  const myPendingSteps = mySteps.filter((s: any) => s.status === 'PENDING');
  
  // Для обратной совместимости оставляем myStep (первый найденный)
  const myStep = mySteps[0];

  // 🔥 ЛОГИКА РЕДАКТИРОВАНИЯ ВО ВРЕМЯ СОГЛАСОВАНИЯ
  // Разрешаем редактировать: Ответственному, Допускающему и Производителю
  const editableRoles = ['RESPONSIBLE', 'ADMITTING', 'WORK_PRODUCER'];
  const isEditableRole = editableRoles.includes(myStep?.role || '');

  // Условие: Статус PENDING + Есть хотя бы один активный шаг + Роль в списке разрешенных
  const canEditAsManager = permit.status === 'PENDING_APPROVAL' && myPendingSteps.length > 0 && 
                          myPendingSteps.some((s: any) => editableRoles.includes(s.role));

  // Проверяем, является ли текущий пользователь "Допускающим" (чтобы дать ему право закрыть наряд)
  const admittingStep = steps.find((s: any) => s.role === 'ADMITTING');
  const isAdmittingUser = admittingStep && String(admittingStep.approver_id) === currentUserId;

  // 3. ЛОГИКА ВИДИМОСТИ КНОПОК
  // Кнопка "Отправить на согласование" — создатель черновика или отклонённого наряда (без подписи ЭЦП)
  const showSubmitForApproval = (permit.status === 'DRAFT' || permit.status === 'REJECTED') && isInitiator;

  // Кнопка "Согласовать (ЭЦП)" — только те, кого указали в наряде и кому пришла очередь
  const showApprove = permit.status === 'PENDING_APPROVAL' && myPendingSteps.length > 0;

  // Кнопка "Отклонить" (если есть хотя бы один активный шаг)
  const showReject = permit.status === 'PENDING_APPROVAL' && myPendingSteps.length > 0;

  // 👇 ЛОГИКА ДЛЯ КНОПКИ КОПИРОВАНИЯ
  // Показывать только инициатору, если наряд ОТКЛОНЕН, ЗАКРЫТ или АРХИВИРОВАН.
  const showDuplicate = isInitiator && (permit.status === 'REJECTED' || permit.status === 'CLOSED' || permit.status === 'ARCHIVED');

  // 👇 НОВОЕ: Показывать кнопку скачивания ТОЛЬКО если наряд согласован или закрыт
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
  const [activeTab, setActiveTab] = useState<'info' | 'safety' | 'team' | 'checklist'>('info');
  const { execute, loading, error: ncaError } = useNCALayer();

    // 👇 ВСТАВИТЬ СЮДА:
  const [isClosing, setIsClosing] = useState(false); // Открыто ли меню закрытия
  const [scanFile, setScanFile] = useState<File | null>(null); // Файл скана


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


// Скачивание наряда (сервер отдаёт PDF, при недоступности LibreOffice — DOCX)
  const handleDownloadPdf = async () => {
      try {
          const response = await fetch(`/api/v1/permits/${permit.id}/download_docx/`, {
              method: 'GET',
              headers: {
                  'Authorization': `Token ${localStorage.getItem('auth_token')}`,
              },
          });

          if (response.ok) {
              const blob = await response.blob();
              const contentType = response.headers.get('Content-Type') || '';
              const isPdf = contentType.includes('application/pdf');
              const ext = isPdf ? 'pdf' : 'docx';
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `Наряд_${permit.permitId}.${ext}`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.URL.revokeObjectURL(url);
          } else {
              alert("Ошибка при скачивании документа.");
          }
      } catch (error) {
          console.error("Download error:", error);
          alert("Ошибка сети при скачивании.");
      }
  };

  const handleSubmitForApproval = async () => {
    try {
      const response = await fetch(`/api/v1/permits/${permit.id}/submit_for_approval/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({})
      });
      const resData = await response.json();
      if (response.ok && resData.ok) {
        alert(`✅ ${resData.status || 'Наряд отправлен на согласование.'}`);
        onBack();
      } else {
        alert(resData.error || 'Ошибка при отправке на согласование.');
      }
    } catch (e: any) {
      console.error(e);
      alert(`Ошибка: ${e.message || 'Сеть'}`);
    }
  };

  const handleSign = async (role?: string) => {
    try {
      // Если несколько ролей и роль не указана - показываем выбор
      if (myPendingSteps.length > 1 && !role) {
        const roleOptions = myPendingSteps.map((s: any) => ({
          role: s.role,
          display: s.role_label || s.role,
          step_order: s.step_order
        })).sort((a: any, b: any) => a.step_order - b.step_order);
        
        const roleList = roleOptions.map((r: any, idx: number) => 
          `${idx + 1}. ${r.display} (очередь ${r.step_order})`
        ).join('\n');
        
        const choice = prompt(
          `У вас несколько ролей для подписания:\n\n${roleList}\n\nВведите номер роли (1-${roleOptions.length}):`
        );
        
        if (!choice) return;
        const choiceNum = parseInt(choice);
        if (isNaN(choiceNum) || choiceNum < 1 || choiceNum > roleOptions.length) {
          alert("Неверный выбор.");
          return;
        }
        role = roleOptions[choiceNum - 1].role;
      } else if (myPendingSteps.length === 1 && !role) {
        // Если только одна роль - используем её автоматически
        role = myPendingSteps[0].role;
      }

      const signerIIN = currentUser.iin || initiator.iin;
      if (!signerIIN) {
          alert("Ошибка: Не найден ИИН пользователя. Проверьте профиль.");
          return;
      }
      console.log("Начинаем подписание...", signerIIN, role ? `за роль ${role}` : '');
      const xmlToSign = `<WorkPermit><ID>${permit.permitId}</ID><Date>${new Date().toISOString()}</Date></WorkPermit>`;
      const args = ['PKCS12', 'SIGNATURE', xmlToSign, '', ''];

      const signedXml = await execute('signXml', args);
      if (!signedXml) throw new Error("Получен пустой ответ от NCALayer");

      const requestBody: any = { signed_xml: signedXml };
      if (role) {
        requestBody.role = role;
      }

      const response = await fetch(`/api/v1/permits/${permit.id}/sign/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(requestBody),
      });

      const resData = await response.json();
      if (response.ok && resData.ok) {
         const roleDisplay = role ? myPendingSteps.find((s: any) => s.role === role)?.role_label || role : '';
         alert(`✅ УСПЕХ! Подписано${roleDisplay ? ` за роль "${roleDisplay}"` : ''}. ${resData.status || ''}`);
         onBack();
      } else {
         // Если ошибка о нескольких ролях - показываем список
         if (resData.available_roles && Array.isArray(resData.available_roles)) {
           const rolesList = resData.available_roles.map((r: any) => 
             typeof r === 'string' ? r : `${r.role_display} (очередь ${r.step_order})`
           ).join('\n');
           alert(`❌ ${resData.error}\n\nДоступные роли:\n${rolesList}`);
         } else {
           alert(`❌ ОШИБКА: ${resData.error || 'Не удалось подписать'}`);
         }
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

  const handleClosePermit = async () => {
      if (!scanFile) {
          alert("Пожалуйста, выберите файл (скан наряда) перед закрытием.");
          return;
      }

      // Валидация типа файла
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
      const fileExt = scanFile.name.toLowerCase().slice(scanFile.name.lastIndexOf('.'));

      if (!allowedTypes.includes(scanFile.type) && !allowedExtensions.includes(fileExt)) {
          alert("Недопустимый формат файла.\nРазрешены только: PDF, JPG, PNG.");
          setScanFile(null);
          return;
      }

      // Валидация размера файла (макс. 10 МБ)
      const maxSizeMB = 10;
      if (scanFile.size > maxSizeMB * 1024 * 1024) {
          const fileSizeMB = (scanFile.size / (1024 * 1024)).toFixed(1);
          alert(`Файл слишком большой: ${fileSizeMB} МБ.\nМаксимальный размер: ${maxSizeMB} МБ.`);
          setScanFile(null);
          return;
      }

      if (!confirm("Вы уверены, что хотите ЗАКРЫТЬ наряд? Это действие необратимо.")) return;

      const formData = new FormData();
      formData.append('scan_file', scanFile);

      try {
          // Отправляем на специальный endpoint 'close'
          const response = await fetch(`/api/v1/permits/${permit.id}/close/`, {
              method: 'POST',
              headers: {
                  'Authorization': `Token ${localStorage.getItem('auth_token')}`
              },
              body: formData
          });

          if (response.ok) {
              alert("✅ Наряд успешно ЗАКРЫТ!");
              setIsClosing(false);
              onBack(); // Возвращаемся назад
          } else {
              const err = await response.json();
              alert("Ошибка: " + (err.error || JSON.stringify(err)));
          }
      } catch (e) {
          console.error(e);
          alert("Ошибка сети");
      }
  };



  const tabs = [
    { id: 'info', label: 'Основное' },
    { id: 'safety', label: 'Меры безопасности' },
    { id: 'team', label: 'Бригада' },
    { id: 'checklist', label: 'Чек лист' },
  ];

  const renderUserName = (userObj: any, fallback: string = '—') => {
      if (userObj && typeof userObj === 'object' && userObj.name) return userObj.name;
      if (typeof userObj === 'string' && userObj.trim() !== '') return userObj;
      return fallback;
  };
  // В блоке «Ответственные лица» Выдающий наряд = подписант шага 1 (Ход согласования)
  const issuerDisplayName = issuerStep?.approver_name || renderUserName(data.issuer, '—');

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

            {permit.status === 'CLOSED' && permit.scan_file && (
            <a
              href={permit.scan_file} // Ссылка на файл
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm ml-3"
            >
              <FileCheck size={20} />
              <span>Скачать скан</span>
            </a>
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

                {/* ТРЕКЕР СОГЛАСОВАНИЯ */}
                <ApprovalTracker steps={(permit as any).approvalSteps} />

                {/* БЛОК ОТВЕТСТВЕННЫХ ЛИЦ (Сохранен оригинал с 5 блоками) */}
                <div>
                   <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><User size={20} className="text-slate-400"/> Ответственные лица</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border border-gray-200 rounded-lg"><span className="text-xs text-gray-400 uppercase font-bold">Выдающий наряд</span><p className="font-medium text-gray-900">{issuerDisplayName}</p></div>
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
                       {(permit as any).safety_document && (
                         <div className="p-4 border-l-4 border-blue-500 bg-blue-50/30 rounded-r-lg">
                           <h4 className="font-bold text-gray-700 text-sm mb-2">Прикреплённый документ</h4>
                           <a
                             href={(permit as any).safety_document}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                           >
                             <FileText size={18} />
                             Открыть документ
                           </a>
                         </div>
                       )}
                       {safetyFields.every(f => !data[f.key]) && !(permit as any).safety_document && (
                         <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">Меры безопасности не указаны</div>
                       )}
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

           {activeTab === 'checklist' && (
               <div className="animate-in fade-in duration-300">
                   <div className="flex items-center gap-2 mb-4">
                       <ClipboardList size={20} className="text-orange-500"/>
                       <h3 className="text-lg font-bold text-slate-800">Чек-лист оценки риска</h3>
                   </div>
                   {data.checklist && Object.keys(data.checklist).length > 0 ? (
                       <ChecklistSection
                           checklist={data.checklist as ChecklistData}
                           onChange={() => {}}
                           readOnly={true}
                       />
                   ) : (
                       <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                           Чек-лист не заполнен
                       </div>
                   )}
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

            {/* 2. РЕДАКТИРОВАТЬ / УДАЛИТЬ */}
            {/* Показываем: автор черновика/отклонённого ИЛИ согласующий с правом редактирования */}
            {(((permit.status === 'DRAFT' || permit.status === 'REJECTED') && isInitiator) || canEditAsManager) && (
                <>
                    {/* Кнопка Удалить - только для черновика и только для автора */}
                    {permit.status === 'DRAFT' && isInitiator && (
                        <button onClick={onDelete} className="px-4 py-2.5 border border-red-200 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-medium flex items-center justify-center gap-2">
                            <Trash2 size={18} /><span className="sm:hidden">Удалить</span>
                        </button>
                    )}

                    {/* 🔥 КНОПКА РЕДАКТИРОВАТЬ */}
                    <button onClick={onEdit} className="flex-1 sm:flex-none px-6 py-2.5 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium flex items-center justify-center gap-2">
                        <Edit3 size={18} /> Редактировать
                    </button>
                </>
            )}

            {/* 3. ОТПРАВИТЬ НА СОГЛАСОВАНИЕ (только создатель черновика, без ЭЦП) */}
            {showSubmitForApproval && (
                <button
                    onClick={handleSubmitForApproval}
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-white font-medium shadow-sm flex items-center justify-center gap-2 transition-all bg-blue-600 hover:bg-blue-700"
                >
                   <FileSignature size={18} />
                   Отправить на согласование
                </button>
            )}

            {/* Если несколько ролей - показываем кнопки для каждой роли */}
            {showApprove && myPendingSteps.length > 1 && (
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                    {myPendingSteps
                        .sort((a: any, b: any) => a.step_order - b.step_order)
                        .map((step: any) => (
                            <button
                                key={step.role}
                                onClick={() => handleSign(step.role)}
                                disabled={loading}
                                className={`px-6 py-2.5 rounded-lg text-white font-medium shadow-sm flex items-center justify-center gap-2 transition-all
                                ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <FileSignature size={18} />}
                                Согласовать как {step.role_label || step.role} (очередь {step.step_order})
                            </button>
                        ))}
                </div>
            )}
            
            {/* Если одна роль - показываем одну кнопку */}
            {showApprove && myPendingSteps.length === 1 && (
                <button
                    onClick={() => handleSign(myPendingSteps[0].role)}
                    disabled={loading}
                    className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-white font-medium shadow-sm flex items-center justify-center gap-2 transition-all
                    ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                   {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <FileSignature size={18} />}
                   Согласовать (ЭЦП) {myPendingSteps[0].role_label ? `как ${myPendingSteps[0].role_label}` : ''}
                </button>
            )}

            {/* 4. ИНФОРМАЦИЯ (Если нечего нажимать, но наряд активен) */}
            {!showSubmitForApproval && !showApprove && permit.status === 'PENDING_APPROVAL' && (
                <div className="flex items-center text-gray-500 text-sm italic px-4 bg-gray-50 rounded-lg border border-gray-100 py-2">
                    {mySteps.some((s: any) => s.status === 'APPROVED')
                        ? <span className="text-green-600 flex items-center gap-2"><CheckCircle2 size={16}/> Вы уже подписали этот наряд{mySteps.filter((s: any) => s.status === 'APPROVED').length > 1 ? ` (${mySteps.filter((s: any) => s.status === 'APPROVED').length} роли)` : ''}</span>
                        : <span className="flex items-center gap-2"><Clock size={16}/> Ожидайте своей очереди подписания</span>
                    }
                </div>
            )}

            {/* 👇 ВСТАВИТЬ СЮДА: КНОПКА ЗАКРЫТИЯ (Только для Допускающего и если статус APPROVED) */}
            {permit.status === 'APPROVED' && isAdmittingUser && (
                <>
                   {!isClosing ? (
                       <button
                           onClick={() => setIsClosing(true)}
                           className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 shadow-sm"
                       >
                           <CheckCircle2 size={18} /> Закрыть наряд
                       </button>
                   ) : (
                       // Меню загрузки файла (появляется при нажатии)
                       <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-300 shadow-lg absolute bottom-20 right-4 md:static md:shadow-none md:border-0 md:bg-transparent animate-in slide-in-from-bottom-2">
                           <input
                               type="file"
                               accept=".pdf,.jpg,.jpeg,.png"
                               onChange={(e) => setScanFile(e.target.files ? e.target.files[0] : null)}
                               className="text-sm text-gray-500 w-48 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                           />
                           <button
                               onClick={handleClosePermit}
                               disabled={!scanFile}
                               className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50 transition-colors"
                           >
                               Подтвердить
                           </button>
                           <button onClick={() => setIsClosing(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                               <XCircle size={20}/>
                           </button>
                       </div>
                   )}
                </>
            )}

         </div>
      </div>
    </div>
  );
};