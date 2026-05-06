import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus, Trash2, Save, FileText, AlertTriangle, Users, CheckCircle2, Lock, Zap, ShieldAlert, Building, Edit3, ClipboardCheck, Paperclip, X } from 'lucide-react';
import { TeamMember, RegulationFormData, UserRole, WORK_TYPES_LIST, RiskTableRow, RiskGroupMember, PermitExtension, PermitCategory, WorkPermit } from '../types';
import { IsolationMatrixForm } from '../components/IsolationMatrixForm';
import { ElectricalPermitForm } from '../components/ElectricalPermitForm';
import { UserSearchSelect } from '../components/UserSearchSelect';
import { SearchableSelect } from  "../components/SearchableSelect"
import ChecklistSection, { ChecklistData, validateRequiredChecklists } from '../components/ChecklistSection';


// Интерфейс для объекта пользователя в роли
interface RoleUser {
    id: number | null;
    name: string;
    role?: string;
    position?: string;
    external?: boolean;
}

interface CreatePermitProps {
  category: PermitCategory;
  onCancel: () => void;
  onSubmit: () => void;
  initialData?: WorkPermit | null; // 👈 Для редактирования
}

// Step icons (labels are translated inside component)
const STEP_ICONS = [FileText, Users, AlertTriangle, Lock];

export const CreatePermit: React.FC<CreatePermitProps> = ({ category, onCancel, onSubmit, initialData }) => {

  const isEditing = !!initialData;
  const { t } = useTranslation();

  const STEPS = [
    { id: 1, label: t('create.steps.general'), icon: STEP_ICONS[0] },
    { id: 2, label: t('create.steps.brigade'), icon: STEP_ICONS[1] },
    { id: 3, label: t('create.steps.risk'), icon: STEP_ICONS[2] },
    { id: 4, label: t('create.steps.loto'), icon: STEP_ICONS[3] },
  ];

  // --- ELECTRICAL PERMIT MODE ---
  if (category === PermitCategory.ELECTRICAL) {
    return (
      <div className="w-full space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center gap-4">
           <button onClick={onCancel} className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
              <ArrowLeft size={28} />
           </button>
           <div>
               <h1 className="text-3xl font-bold text-slate-900 leading-tight">
                   {isEditing ? `Редактирование: ${initialData?.permitId}` : 'Создание Наряда-Допуска'}
               </h1>
               <div className="flex items-center gap-2 mt-1">
                 <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wide bg-blue-100 text-blue-700 border-blue-200">
                    <Zap size={12}/> Электроустановки
                 </span>
                 <span className="text-slate-400 text-sm font-mono">Стандарт РК</span>
               </div>
           </div>
        </div>

        <ElectricalPermitForm
          mode="create" // Для электро пока оставляем create, т.к. там своя логика
          onCancel={onCancel}
          onSubmit={() => onSubmit()}
        />
      </div>
    );
  }

  // --- STANDARD / DANGEROUS PERMIT MODE ---
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notifyFireService, setNotifyFireService] = useState(false);
  const [callFirePost, setCallFirePost] = useState(false);

  // Form State strictly following Item 1-10 of Order 344 + Risk + LOTO
  const [formData, setFormData] = useState<RegulationFormData>({
    organization: 'АО "Каражанбасмунай"',
    contractor: '',
    department: '',
    workName: '',
    workPlace: '',
    equipment: '',
    content: '',
    // Safety Measures
    m5_1_stop: '', m5_2_disconnect: '', m5_3_install: '', m5_4_analysis: '', m5_5_fence: '',
    m5_6_height: '', m5_7_warn: '', m5_8_railway: '', m5_9_routes: '', m5_10_additional: '',
    // Risk Assessment
    riskIdentifiedBy: '', riskGroup: [], riskTable: [], riskApprovedBy: '',

    // LOTO
    lotoEnabled: false,
    isolationMatrix: {
       department: '',
       site: '',
       dateDeveloped: new Date().toISOString().split('T')[0],
       dateRevised: new Date().toISOString().split('T')[0],
       equipmentName: '',
       techNumber: '',
       energySourceCount: 1,
       energyType: '',
       lockType: '',
       installLocation: '',
       checkResidualEnergy: false, checkLockDevice: false, checkPadlock: false, checkTag: false
    },
    // Dates
    dateStart: '', dateEnd: '',
    // Item 12: Extensions
    extensions: [],
    // Item 13: Completion
    completionDateTime: '', completionHandOverName: '', completionTakeOverName: ''
  });

  // 👇 Стейт ролей теперь хранит объекты (для валидации и ID), а не просто строки
  const [roles, setRoles] = useState<{
      producer: RoleUser;
      admitting: RoleUser;
      responsible: RoleUser;
      issuer: RoleUser;
      supervisor: RoleUser;
  }>({
    producer: { id: null, name: '' },
    admitting: { id: null, name: '' },
    responsible: { id: null, name: '' },
    issuer: { id: null, name: '' },
    supervisor: { id: null, name: '' }
  });

  const [additionalCoordinators, setAdditionalCoordinators] = useState<RoleUser[]>([]);

  /** Исполнитель без ЭЦП: одна строка (ФИО, должность); графическая подпись на согласовании */
  const [producerIsExternal, setProducerIsExternal] = useState(false);

  // Редактирование во время согласования: блок подписантов полностью заблокирован
  const isApprovalEdit = isEditing && initialData?.status === 'PENDING_APPROVAL';

  // Документ к мерам безопасности (PDF/JPG, макс. 10 МБ)
  const maxSafetyDocSizeMb = 10;
  const [safetyDocumentFile, setSafetyDocumentFile] = useState<File | null>(null);
  const [lotoPhotoUrl, setLotoPhotoUrl] = useState<string | null>((initialData as any)?.loto_photo || null);
  const [pendingLotoFile, setPendingLotoFile] = useState<File | null>(null);

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [checklistData, setChecklistData] = useState<ChecklistData>({});
  const [departmentsList, setDepartmentsList] = useState<any[]>([]);
  const [workTypesList, setWorkTypesList] = useState<any[]>([]);
  const canAutoSaveDraft = !isApprovalEdit && (!isEditing || initialData?.status === 'DRAFT');
  const [draftPermitId, setDraftPermitId] = useState<number | null>(
    isEditing && initialData?.status === 'DRAFT' ? Number(initialData.id) : null
  );
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveInProgressRef = useRef(false);

  const hasMeaningfulData = () =>
    Boolean(
      formData.workName ||
      formData.department ||
      formData.workPlace ||
      formData.content ||
      roles.issuer.id ||
      roles.producer.id ||
      !!(roles.producer.name && roles.producer.name.trim()) ||
      roles.admitting.id ||
      roles.responsible.id ||
      roles.supervisor.id ||
      additionalCoordinators.some(c => !!c.id) ||
      teamMembers.length > 0
    );

  const buildApiPayload = () => {
    const producerPayload: RoleUser | { id: null; external: true; name: string } = producerIsExternal
      ? { id: null, external: true, name: roles.producer.name.trim() }
      : (() => {
          const p = { ...roles.producer };
          delete (p as { external?: boolean }).external;
          return p;
        })();

    const fullDataPayload = {
      ...formData,
      ...roles,
      producer: producerPayload,
      ...(producerIsExternal && roles.producer.name.trim()
        ? { completionHandOverName: roles.producer.name.trim() }
        : {}),
      additionalCoordinators: additionalCoordinators.filter(c => c.id),
      teamMembers: teamMembers,
      checklist: checklistData,
      riskTable: formData.riskTable,
      riskGroup: formData.riskGroup,
      isolationMatrix: formData.isolationMatrix,
      extensions: formData.extensions,
      templateType: 'Наряд повышенной опасности',
      category: category,
      notifyFireService: notifyFireService,
      callFirePost: callFirePost
    };

    return {
      location_name: formData.workPlace || "Не указано",
      valid_from: formData.dateStart || null,
      valid_to: formData.dateEnd || null,
      data: fullDataPayload
    };
  };

  const persistDraft = async () => {
    if (!canAutoSaveDraft || !hasMeaningfulData() || autoSaveInProgressRef.current) return;
    autoSaveInProgressRef.current = true;
    try {
      const token = localStorage.getItem('auth_token');
      const permitIdForSave = draftPermitId || (isEditing ? Number(initialData?.id) : null);
      const url = permitIdForSave ? `/api/v1/permits/${permitIdForSave}/` : '/api/v1/permits/';
      const method = permitIdForSave ? 'PATCH' : 'POST';
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(buildApiPayload())
      });
      if (response.ok) {
        const result = await response.json();
        if (result?.id) setDraftPermitId(Number(result.id));
      }
    } catch (e) {
      console.error('Ошибка автосохранения черновика:', e);
    } finally {
      autoSaveInProgressRef.current = false;
    }
  };

  // Автосохранение черновика в БД при вводе
  useEffect(() => {
    if (!canAutoSaveDraft) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      void persistDraft();
    }, 1200);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [formData, roles, additionalCoordinators, teamMembers, checklistData, activeStep, canAutoSaveDraft]);

  // Попытка финального сохранения при закрытии/перезагрузке вкладки
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!canAutoSaveDraft || !hasMeaningfulData()) return;
      const token = localStorage.getItem('auth_token');
      const permitIdForSave = draftPermitId || (isEditing ? Number(initialData?.id) : null);
      const url = permitIdForSave ? `/api/v1/permits/${permitIdForSave}/` : '/api/v1/permits/';
      const method = permitIdForSave ? 'PATCH' : 'POST';
      void fetch(url, {
        method,
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(buildApiPayload())
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [canAutoSaveDraft, draftPermitId, isEditing, initialData?.id, formData, roles, additionalCoordinators, teamMembers, checklistData, activeStep]);

  // Загружаем справочники
  useEffect(() => {
    const fetchDictionaries = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const headers = { 'Authorization': `Token ${token}` };

            const deptRes = await fetch('/api/v1/departments/', { headers });
            if (deptRes.ok) {
                const data = await deptRes.json();
                setDepartmentsList(data.results || data);
            }

            const workRes = await fetch('/api/v1/work-types/', { headers });
            if (workRes.ok) {
                const data = await workRes.json();
                setWorkTypesList(data.results || data);
            }
        } catch (e) {
            console.error("Ошибка загрузки справочников:", e);
        }
    };
    fetchDictionaries();
  }, []);


  // 👇 ГЛАВНАЯ ЛОГИКА: ЗАПОЛНЕНИЕ ПРИ РЕДАКТИРОВАНИИ (или создание)
  useEffect(() => {
      if (initialData && initialData.data) {
          // --- РЕЖИМ РЕДАКТИРОВАНИЯ ---
          console.log("✏️ Загружаем данные для редактирования:", initialData.data);
          const savedData = initialData.data;

          // 1. Заполняем основные поля
          setFormData(prev => ({ ...prev, ...savedData }));

          // 2. Восстанавливаем роли (функция helper)
          const restoreRole = (roleData: any): RoleUser => {
              if (roleData && typeof roleData === 'object' && 'id' in roleData) {
                  return roleData; // Уже объект, всё ок
              }
              return { id: null, name: typeof roleData === 'string' ? roleData : '' };
          };

          // 👇 ИСПРАВЛЕНИЕ: Если в JSON нет выдающего, берем из инициатора наряда (из базы)
          let issuerRole = restoreRole(savedData.issuer);
          if (!issuerRole.name && initialData.initiator) {
              issuerRole = {
                  id: initialData.initiator.id,
                  name: initialData.initiator.name,
                  role: 'ISSUER'
              };
          }

          const restoredRoles = {
              producer: restoreRole(savedData.producer),
              admitting: restoreRole(savedData.admitting),
              responsible: restoreRole(savedData.responsible),
              issuer: issuerRole,
              supervisor: restoreRole(savedData.supervisor),
          };
          setRoles(restoredRoles);
          setProducerIsExternal(
            !!(savedData.producer && typeof savedData.producer === 'object' && (savedData.producer as RoleUser).external)
          );

          if (savedData.additionalCoordinators && Array.isArray(savedData.additionalCoordinators)) {
              setAdditionalCoordinators(savedData.additionalCoordinators.map((c: any) => restoreRole(c)));
          }

          // При редактировании во время согласования блок подписантов
          // полностью заблокирован — менять подписантов может только Выдающий наряд

          // 3. Восстанавливаем сложные массивы (Бригада, Риски, Расширения)
          if (savedData.teamMembers) setTeamMembers(savedData.teamMembers);
          if (savedData.checklist) setChecklistData(savedData.checklist);
          if (savedData.notifyFireService) setNotifyFireService(true);
          if (savedData.callFirePost) setCallFirePost(true);

      } else if (!isEditing) {
          // --- РЕЖИМ СОЗДАНИЯ: поле "Наряд выдал" оставляем пустым — выбирает сам создатель
          const savedUser = localStorage.getItem('user_data');
          if (savedUser) {
              try {
                  const user = JSON.parse(savedUser);
                  if (user.department) updateForm('department', user.department);
              } catch (e) { console.error(e); }
          }
      }
  }, [initialData, isEditing]);


  const updateForm = (field: keyof RegulationFormData, value: any) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'department' || field === 'workPlace' || field === 'contractor') {
        const dept = field === 'department' ? value : next.department;
        const isContractor = dept === 'Подрядная организация';
        const contractorName = field === 'contractor' ? value : next.contractor;
        next.isolationMatrix = {
          ...next.isolationMatrix,
          department: isContractor ? (contractorName || '') : (dept || next.isolationMatrix.department),
          site: field === 'workPlace' ? value : next.workPlace || next.isolationMatrix.site,
        };
      }
      return next;
    });
  };

  const addTeamMember = () => {
    const newId = (teamMembers.length + 1).toString();
    const admittingName = roles.admitting?.name || '';
    setTeamMembers([...teamMembers, { id: newId, name: '', role: '', instructedAt: '', instructedBy: admittingName }]);
  };

  const removeTeamMember = (id: string) => {
    setTeamMembers(teamMembers.filter(m => m.id !== id));
  };

  const updateTeamMember = (id: string, field: keyof TeamMember, value: string) => {
    setTeamMembers(teamMembers.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  // --- Extension Logic ---
  const addExtension = () => {
    const newExt: PermitExtension = {
      id: Date.now().toString(),
      dateTime: '',
      producerHandOverName: '',
      incomingTeamCount: 0,
      producerTakeOverName: '',
      admittingName: ''
    };
    setFormData(prev => ({ ...prev, extensions: [...prev.extensions, newExt] }));
  };

  const removeExtension = (id: string) => {
    setFormData(prev => ({ ...prev, extensions: prev.extensions.filter(e => e.id !== id) }));
  };

  const updateExtension = (id: string, field: keyof PermitExtension, value: any) => {
    setFormData(prev => ({
      ...prev,
      extensions: prev.extensions.map(e => e.id === id ? { ...e, [field]: value } : e)
    }));
  };

  // --- Risk Group Logic ---
  const addRiskGroupMember = () => {
      const newMember: RiskGroupMember = { id: Date.now().toString(), name: '', position: '' };
      setFormData(prev => ({ ...prev, riskGroup: [...prev.riskGroup, newMember] }));
  };

  const removeRiskGroupMember = (id: string) => {
      setFormData(prev => ({ ...prev, riskGroup: prev.riskGroup.filter(m => m.id !== id) }));
  };

  const updateRiskGroupMember = (id: string, field: keyof RiskGroupMember, value: string) => {
      setFormData(prev => ({
          ...prev,
          riskGroup: prev.riskGroup.map(m => m.id === id ? { ...m, [field]: value } : m)
      }));
  };

  // --- Risk Table Logic ---
  const addRiskRow = () => {
      const newRow: RiskTableRow = { id: Date.now().toString(), step: '', hazards: '', measures: '', isControlled: '' };
      setFormData(prev => ({ ...prev, riskTable: [...prev.riskTable, newRow] }));
  };

  const removeRiskRow = (id: string) => {
      setFormData(prev => ({ ...prev, riskTable: prev.riskTable.filter(r => r.id !== id) }));
  };

  const updateRiskRow = (id: string, field: keyof RiskTableRow, value: string) => {
      setFormData(prev => ({
          ...prev,
          riskTable: prev.riskTable.map(r => r.id === id ? { ...r, [field]: value } : r)
      }));
  };

  // --- ЛОГИКА ОТПРАВКИ (CREATE vs UPDATE) ---
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      console.log("🚀 Начало отправки наряда...");

      // Валидация перед отправкой
      if (!roles.issuer.id && !roles.issuer.name) {
          alert("Укажите, кто выдал наряд (поле «Наряд выдал (Выдающий)»)."); setIsSubmitting(false); return;
      }
      if (producerIsExternal) {
          if (!roles.producer.name.trim()) {
            alert("Введите ФИО и должность производителя работ — исполнителя без ЭЦП (одной строкой)."); setIsSubmitting(false); return;
          }
      } else if (!roles.producer.id) {
          alert("Не заполнен Производитель работ!"); setIsSubmitting(false); return;
      }
      if (!roles.admitting.id && !roles.admitting.name) {
          alert("Не заполнен Допускающий к работе!"); setIsSubmitting(false); return;
      }

      // Валидация обязательных чек-листов
      const checklistValidation = validateRequiredChecklists(checklistData);
      if (!checklistValidation.valid) {
          alert(`❌ Не заполнены обязательные чек-листы:\n\n${checklistValidation.missing.map(m => `• ${m}`).join('\n')}\n\nОтветьте на все вопросы в обязательных чек-листах (шаг "Оценка риска").`);
          setIsSubmitting(false);
          return;
      }

      const apiPayload = buildApiPayload();

      // 👇 ОПРЕДЕЛЯЕМ URL И МЕТОД (РЕДАКТИРОВАНИЕ ИЛИ СОЗДАНИЕ)
      const permitIdForSubmit = isEditing ? Number(initialData?.id) : draftPermitId;
      const url = permitIdForSubmit
          ? `/api/v1/permits/${permitIdForSubmit}/`
          : '/api/v1/permits/';

      const method = permitIdForSubmit ? 'PUT' : 'POST';

      // 3. Отправляем запрос
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(apiPayload)
      });

      if (response.ok) {
        const result = await response.json();
        const permitId = result.id || initialData?.id;

        if (safetyDocumentFile && permitId) {
          const formDataUpload = new FormData();
          formDataUpload.append('safety_document', safetyDocumentFile);
          const uploadRes = await fetch(`/api/v1/permits/${permitId}/upload_safety_document/`, {
            method: 'POST',
            headers: { 'Authorization': `Token ${localStorage.getItem('auth_token')}` },
            body: formDataUpload
          });
          if (!uploadRes.ok) {
            const errData = await uploadRes.json().catch(() => ({}));
            alert(`Наряд сохранён, но документ не прикреплён: ${errData.error || uploadRes.status}`);
          }
        }

        if (pendingLotoFile && permitId) {
          const lotoFormData = new FormData();
          lotoFormData.append('loto_photo', pendingLotoFile);
          const lotoRes = await fetch(`/api/v1/permits/${permitId}/upload_loto_photo/`, {
            method: 'POST',
            headers: { 'Authorization': `Token ${localStorage.getItem('auth_token')}` },
            body: lotoFormData
          });
          if (lotoRes.ok) {
            const lotoResult = await lotoRes.json();
            setLotoPhotoUrl(lotoResult.loto_photo_url);
            setPendingLotoFile(null);
          }
        }

        if (result?.id) setDraftPermitId(Number(result.id));
        alert(isEditing ? '✅ Наряд успешно обновлен!' : '✅ Черновик наряда сохранён. Номер будет присвоен при отправке на согласование.');
        onSubmit();
      } else {
        // Пробуем прочитать JSON-ошибку, если не получится — читаем текст
        let errorMsg = `Ошибка сервера (${response.status})`;
        try {
          const errorData = await response.json();
          console.error("Ошибка сервера:", errorData);
          errorMsg = typeof errorData === 'object'
            ? (errorData.detail || errorData.error || JSON.stringify(errorData))
            : String(errorData);
        } catch {
          const text = await response.text();
          console.error("Ошибка сервера (не JSON):", text.substring(0, 500));
        }
        alert(`❌ ${errorMsg}`);
      }

    } catch (error: any) {
      console.error("Ошибка сети:", error);
      alert(`❌ Ошибка соединения: ${error?.message || 'Нет связи с сервером Django'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (canAutoSaveDraft && hasMeaningfulData()) {
      await persistDraft();
    }
    onCancel();
  };

  const commonInputClasses = "w-full bg-[#f7f7f7] border-gray-300 rounded-md px-4 py-3 text-lg text-gray-900 focus:ring-blue-500 focus:border-blue-500 border transition-colors placeholder-gray-400 max-w-full";

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
         <button onClick={handleCancel} className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={28} />
         </button>
         <div className="flex-1">
             <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-900 leading-tight">
                    {isEditing ? t('create.editTitle', { id: initialData?.permitId }) : t('create.title')}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wide bg-orange-100 text-orange-700 border-orange-200">
                  <AlertTriangle size={12}/>
                  {t('create.dangerBadge')}
                </span>
             </div>
             <p className="text-lg text-slate-500 font-mono mt-0.5">{t('create.formRef')}</p>
         </div>
      </div>

       {/* Stepper (Sticky) */}
       <div className="sticky top-0 z-50 grid grid-cols-4 gap-2 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
         {STEPS.map((step) => (
           <button
             key={step.id}
             onClick={() => setActiveStep(step.id)}
             className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all text-lg ${
               activeStep === step.id
                 ? 'border-blue-200 bg-blue-50 text-blue-700 font-bold shadow-sm'
                 : 'border-transparent bg-transparent text-gray-500 hover:bg-gray-50'
             }`}
           >
             <step.icon size={22} />
             <span className="hidden xl:inline">{step.label}</span>
           </button>
         ))}
       </div>

       {/* Form Content */}

       {/* STEP 1: GENERAL INFO */}
       {activeStep === 1 && (
         <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
           {/* Section 1: Place and Character */}
           <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 uppercase text-base tracking-wider border-b pb-2">{t('create.general.sectionTitle')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="block text-lg font-semibold text-gray-700 mb-2">{t('create.general.organization')}</label>
                   <input type="text" value={formData.organization} readOnly className="w-full bg-gray-100 border border-gray-300 rounded-md px-4 py-3 text-lg text-gray-500 cursor-not-allowed" />
                 </div>

                 <div>
                   <label className="block text-lg font-semibold text-gray-700 mb-2">{t('create.general.department')}</label>
                   {/* Компонент поиска */}
                   <SearchableSelect
                        value={formData.department}
                        apiEndpoint="/api/v1/departments/"
                        placeholder={t('create.general.departmentPlaceholder')}
                        additionalOptions={[
                            { id: 'CONTRACTOR', label: 'Мердігер ұйым / Подрядная организация' }
                        ]}
                        onChange={(val) => {
                            if (val === 'CONTRACTOR' || val.includes('Мердігер') || val.includes('Подрядная')) {
                                 updateForm('department', 'Подрядная организация');
                            } else {
                                 updateForm('department', val);
                                 updateForm('contractor', '');
                            }
                        }}
                    />

                   {/* Conditional Contractor Input */}
                   {formData.department === 'Подрядная организация' && (
                     <div className="mt-4 animate-in slide-in-from-top-2 duration-200">
                       <label className="block text-sm font-bold text-blue-600 mb-1 flex items-center gap-1.5">
                         <Building size={14} /> {t('create.general.contractorLabel')}
                       </label>
                       <input
                         type="text"
                         value={formData.contractor || ''}
                         onChange={(e) => updateForm('contractor', e.target.value)}
                         placeholder={t('create.general.contractorPlaceholder')}
                         className={`${commonInputClasses} border-blue-200 ring-2 ring-blue-50 focus:ring-blue-500 bg-white`}
                         autoFocus
                       />
                     </div>
                   )}
                 </div>

                 <div className="md:col-span-2">
                    <SearchableSelect
                        label={t('create.general.workName')}
                        value={formData.workName}
                        apiEndpoint="/api/v1/work-types/"
                        placeholder={t('create.general.workNamePlaceholder')}
                        onChange={(val) => updateForm('workName', val)}
                    />
                 </div>
                 <div className="md:col-span-2">
                   <label className="block text-lg font-semibold text-gray-700 mb-2">{t('create.general.workPlace')}</label>
                   <input
                     type="text"
                     value={formData.workPlace}
                     onChange={(e) => updateForm('workPlace', e.target.value)}
                     placeholder={t('create.general.workPlacePlaceholder')}
                     className={commonInputClasses}
                   />
                 </div>
                 <div className="md:col-span-2">
                   <label className="block text-lg font-semibold text-gray-700 mb-2">{t('create.general.workContent')}</label>
                   <textarea
                     rows={3}
                     value={formData.content}
                     onChange={(e) => updateForm('content', e.target.value)}
                     placeholder={t('create.general.workContentPlaceholder')}
                     className={commonInputClasses}
                   />
                 </div>
                 <div className="md:col-span-2">
                   <label className="flex items-center gap-3 cursor-pointer select-none">
                     <div
                       onClick={() => {
                         const next = !notifyFireService;
                         setNotifyFireService(next);
                         if (!next) setCallFirePost(false);
                       }}
                       className={`relative w-12 h-7 rounded-full transition-colors ${notifyFireService ? 'bg-red-500' : 'bg-gray-300'}`}
                     >
                       <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${notifyFireService ? 'translate-x-5' : ''}`} />
                     </div>
                     <span className="text-lg font-medium text-gray-700">
                       {t('create.general.notifyFire')}
                     </span>
                     {notifyFireService && (
                       <span className="text-sm text-red-600 font-medium">{t('create.general.notifyFireHint')}</span>
                     )}
                   </label>
                 </div>
                 {notifyFireService && (
                   <div className="md:col-span-2">
                     <label className="flex items-center gap-3 cursor-pointer select-none">
                       <div
                         onClick={() => setCallFirePost(!callFirePost)}
                         className={`relative w-12 h-7 rounded-full transition-colors ${callFirePost ? 'bg-orange-500' : 'bg-gray-300'}`}
                       >
                         <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${callFirePost ? 'translate-x-5' : ''}`} />
                       </div>
                       <span className="text-lg font-medium text-gray-700">
                         {t('create.general.callFirePost')}
                       </span>
                       {callFirePost && (
                         <span className="text-sm text-orange-600 font-medium">{t('create.general.callFirePostHint')}</span>
                       )}
                     </label>
                   </div>
                 )}
              </div>
           </div>

           {/* Section 2: Responsible Persons */}
           <div className={`bg-white p-6 rounded-xl border shadow-sm ${isApprovalEdit ? 'border-orange-200 bg-orange-50/30' : 'border-gray-200'}`}>
              <h3 className="font-bold text-gray-900 mb-4 uppercase text-base tracking-wider border-b pb-2 flex items-center gap-2">
                {t('create.roles.sectionTitle')}
                {isApprovalEdit && <span className="text-sm normal-case text-orange-600 font-medium ml-2">🔒 {t('create.roles.readOnlyHint')}</span>}
              </h3>

              {/* При редактировании во время согласования — только просмотр */}
              {isApprovalEdit ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-xs text-gray-400 uppercase font-bold">{t('create.roles.issuer')}</span>
                    <p className="font-medium text-gray-700 mt-1">{roles.issuer.name || '—'}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-xs text-gray-400 uppercase font-bold">{t('create.roles.responsible')}</span>
                    <p className="font-medium text-gray-700 mt-1">{roles.responsible.name || t('create.roles.notAssigned')}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-xs text-gray-400 uppercase font-bold">{t('create.roles.admitting')}</span>
                    <p className="font-medium text-gray-700 mt-1">{roles.admitting.name || '—'}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-xs text-gray-400 uppercase font-bold">{t('create.roles.producer')}</span>
                    <p className="font-medium text-gray-700 mt-1">{roles.producer.name || '—'}</p>
                  </div>
                  <div className="md:col-span-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-xs text-gray-400 uppercase font-bold">{t('create.roles.supervisor')}</span>
                    <p className="font-medium text-gray-700 mt-1">{roles.supervisor.name || t('create.roles.notAssigned')}</p>
                  </div>
                </div>
              ) : (
                /* При создании / редактировании черновика — полный доступ */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">

                 {/* 1. Наряд выдал (Выдающий) — при создании выбирает сам создатель наряда */}
                 <div>
                   <UserSearchSelect
                      label={t('create.roles.issuer')}
                      value={roles.issuer.name}
                      requiredRole="ISSUER"
                      onChange={(user) => {
                         const displayName = user ? `${user.name} (${user.position || t('create.roles.positionNotSet')})` : '';
                         setRoles(prev => ({
                             ...prev,
                             issuer: user ? { id: user.id, name: displayName, role: user.role } : { id: null, name: '' }
                         }));
                      }}
                      placeholder={t('create.roles.searchPlaceholder')}
                   />
                 </div>

                 {/* 2. Ответственный руководитель (необязательный — без звёздочки) */}
                 <div>
                   <UserSearchSelect
                      label={t('create.roles.responsible')}
                      value={roles.responsible.name}
                      required={false}
                      requiredRole="RESPONSIBLE"
                      onChange={(user) => {
                             const displayName = user ? `${user.name} (${user.position || t('create.roles.positionNotSet')})` : '';
                             setRoles(prev => ({
                                 ...prev,
                                 responsible: user
                                    ? { id: user.id, name: displayName, role: user.role }
                                    : { id: null, name: '' }
                             }));
                         }}
                      placeholder={t('create.roles.searchPlaceholder')}
                   />
                 </div>

                 {/* 3. Допускающий */}
                 <div>
                   <UserSearchSelect
                      label={t('create.roles.admitting')}
                      value={roles.admitting.name}
                      requiredRole="ADMITTING"
                      onChange={(user) => {
                         const displayName = user ? `${user.name} (${user.position || t('create.roles.positionNotSet')})` : '';
                         const userData = user ? { id: user.id, name: displayName, role: user.role } : { id: null, name: '' };
                         setRoles(prev => ({ ...prev, admitting: userData }));
                         if (user) updateForm('completionTakeOverName', displayName);
                     }}
                      placeholder={t('create.roles.searchPlaceholder')}
                   />
                 </div>

                 {/* 4. Производитель работ (исполнитель работ) */}
                 <div className="flex flex-col min-w-0">
                   {producerIsExternal ? (
                     <>
                       <label className="block text-sm font-bold text-gray-700 mb-1">
                         {t('create.roles.producer')}
                         <span className="text-red-500 ml-1">*</span>
                       </label>
                       <textarea
                         rows={2}
                         value={roles.producer.name}
                         onChange={(e) => {
                           setRoles((prev) => ({
                             ...prev,
                             producer: { id: null, name: e.target.value, external: true },
                           }));
                           updateForm('completionHandOverName', e.target.value);
                         }}
                         placeholder={t('create.roles.externalPlaceholder')}
                         className={commonInputClasses}
                       />
                     </>
                   ) : (
                     <UserSearchSelect
                       label={t('create.roles.producer')}
                       value={roles.producer.name}
                       requiredRole="WORK_PRODUCER"
                       onChange={(user) => {
                         const displayName = user ? `${user.name} (${user.position || t('create.roles.positionNotSet')})` : '';
                         const userData = user
                           ? { id: user.id, name: displayName, role: user.role }
                           : { id: null, name: '' };
                         setProducerIsExternal(false);
                         setRoles((prev) => ({ ...prev, producer: userData }));
                         if (user) updateForm('completionHandOverName', displayName);
                       }}
                       placeholder={t('create.roles.searchPlaceholder')}
                     />
                   )}
                   <div className="flex justify-end mt-1.5">
                     <button
                       type="button"
                       onClick={() => {
                         if (producerIsExternal) {
                           setProducerIsExternal(false);
                           setRoles((prev) => ({ ...prev, producer: { id: null, name: '' } }));
                         } else {
                           setProducerIsExternal(true);
                           setRoles((prev) => ({ ...prev, producer: { id: null, name: '', external: true } }));
                         }
                       }}
                       className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                     >
                       <Plus size={14} className="shrink-0" />
                       {producerIsExternal ? t('create.roles.selectFromDb') : t('create.roles.externalProducer')}
                     </button>
                   </div>
                 </div>

                 {/* 5. Согласующий (необязательный — без звёздочки) */}
                  <div className="md:col-span-2 border-t pt-4 mt-2">
                   <UserSearchSelect
                      label={t('create.roles.supervisor')}
                      value={roles.supervisor.name}
                      required={false}
                      requiredRole="COORDINATOR"
                      onChange={(user) => {
                         const displayName = user ? `${user.name} (${user.position || t('create.roles.positionNotSet')})` : '';
                         setRoles(prev => ({
                             ...prev,
                             supervisor: user ? { id: user.id, name: displayName, role: user.role } : { id: null, name: '' }
                         }));
                      }}
                      placeholder={t('create.roles.searchPlaceholder')}
                   />

                   {/* Дополнительные согласующие (до 5) */}
                   {additionalCoordinators.map((coord, idx) => (
                     <div key={idx} className="mt-3 flex items-start gap-2">
                       <div className="flex-1">
                         <UserSearchSelect
                           label={t('create.roles.additionalCoord', { n: idx + 1 })}
                           value={coord.name}
                           required={false}
                           requiredRole="COORDINATOR"
                           onChange={(user) => {
                             const displayName = user ? `${user.name} (${user.position || t('create.roles.positionNotSet')})` : '';
                             setAdditionalCoordinators(prev => {
                               const updated = [...prev];
                               updated[idx] = user ? { id: user.id, name: displayName, role: user.role } : { id: null, name: '' };
                               return updated;
                             });
                           }}
                           placeholder={t('create.roles.searchPlaceholder')}
                         />
                       </div>
                       <button
                         type="button"
                         onClick={() => setAdditionalCoordinators(prev => prev.filter((_, i) => i !== idx))}
                         className="mt-8 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                         title="Удалить согласующего"
                       >
                         <Trash2 size={18} />
                       </button>
                     </div>
                   ))}

                   {additionalCoordinators.length < 5 && (
                     <button
                       type="button"
                       onClick={() => setAdditionalCoordinators(prev => [...prev, { id: null, name: '' }])}
                       className="mt-3 flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                     >
                       <Plus size={16} />
                       {t('create.roles.addCoordinator')}
                     </button>
                   )}
                 </div>

              </div>
              )}
           </div>

           {/* Section 3: Safety Measures */}
           <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
             <h3 className="font-bold text-gray-900 mb-6 uppercase text-base tracking-wider border-b pb-2 flex items-center gap-2">
               <ShieldAlert size={24} className="text-blue-600"/>
               {t('create.safety.sectionTitle')}
             </h3>
             <div className="space-y-5">
               {[
                 { key: 'm5_1_stop', label: t('create.safety.m5_1'), placeholder: t('create.safety.m5_1_ph') },
                 { key: 'm5_2_disconnect', label: t('create.safety.m5_2'), placeholder: t('create.safety.m5_2_ph') },
                 { key: 'm5_3_install', label: t('create.safety.m5_3'), placeholder: t('create.safety.m5_3_ph') },
                 { key: 'm5_4_analysis', label: t('create.safety.m5_4'), placeholder: t('create.safety.m5_4_ph') },
                 { key: 'm5_5_fence', label: t('create.safety.m5_5'), placeholder: t('create.safety.m5_5_ph') },
                 { key: 'm5_6_height', label: t('create.safety.m5_6'), placeholder: t('create.safety.m5_6_ph') },
                 { key: 'm5_7_warn', label: t('create.safety.m5_7'), placeholder: t('create.safety.m5_7_ph') },
                 { key: 'm5_8_railway', label: t('create.safety.m5_8'), placeholder: t('create.safety.m5_8_ph') },
                 { key: 'm5_9_routes', label: t('create.safety.m5_9'), placeholder: t('create.safety.m5_9_ph') },
                 { key: 'm5_10_additional', label: t('create.safety.m5_10'), placeholder: t('create.safety.m5_10_ph') },
               ].map((field) => (
                 <div key={field.key} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start border-b border-gray-100 pb-4 last:border-0">
                    <label className="md:col-span-1 text-lg font-bold text-gray-700 pt-2">{field.label}</label>
                    <div className="md:col-span-3">
                       <textarea
                         rows={2}
                         className={commonInputClasses}
                         placeholder={field.placeholder}
                         value={(formData as any)[field.key]}
                         onChange={(e) => updateForm(field.key as keyof RegulationFormData, e.target.value)}
                       />
                    </div>
                 </div>
               ))}
               {/* Кнопка прикрепления документа */}
               <div className="pt-4 border-t border-gray-100">
                 <input
                   type="file"
                   id="safety-doc-upload"
                   accept=".pdf,.jpg,.jpeg"
                   className="hidden"
                   onChange={(e) => {
                     const file = e.target.files?.[0];
                     if (!file) return;
                     const ext = file.name.split('.').pop()?.toLowerCase();
                     if (!['pdf','jpg','jpeg'].includes(ext || '')) {
                       alert(t('create.safety.onlyPdfJpg'));
                       return;
                     }
                     if (file.size > maxSafetyDocSizeMb * 1024 * 1024) {
                       alert(t('create.safety.fileTooBig', { size: maxSafetyDocSizeMb }));
                       return;
                     }
                     setSafetyDocumentFile(file);
                   }}
                 />
                 <div className="flex items-center gap-3 flex-wrap">
                   <label
                     htmlFor="safety-doc-upload"
                     className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 cursor-pointer transition-colors"
                   >
                     <Paperclip size={18} />
                     {t('create.safety.attachDoc')}
                   </label>
                   {safetyDocumentFile && (
                     <span className="flex items-center gap-2 text-gray-700">
                       <span className="text-sm">{safetyDocumentFile.name}</span>
                       <button
                         type="button"
                         onClick={() => { setSafetyDocumentFile(null); (document.getElementById('safety-doc-upload') as HTMLInputElement).value = ''; }}
                         className="p-1 text-red-500 hover:bg-red-50 rounded"
                       >
                         <X size={18} />
                       </button>
                     </span>
                   )}
                   {(initialData as any)?.safety_document && !safetyDocumentFile && (
                     <span className="text-sm text-green-600">{t('create.safety.docAttached')}</span>
                   )}
                 </div>
                 <p className="text-xs text-gray-500 mt-1">{t('create.safety.docFormats', { size: maxSafetyDocSizeMb })}</p>
               </div>
             </div>
           </div>
         </div>


       )}

       {/* STEP 2: TEAM & DATES */}
       {activeStep === 2 && (
         <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

            {/* Dates */}
            {/* Сроки выполнения — временно скрыт
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
               <h3 className="font-bold text-gray-900 mb-4 uppercase text-base tracking-wider border-b pb-2">Сроки выполнения</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label className="block text-lg font-semibold text-gray-700 mb-2">Начало работ</label>
                     <input
                       type="datetime-local"
                       value={formData.dateStart}
                       onChange={(e) => updateForm('dateStart', e.target.value)}
                       className={commonInputClasses}
                     />
                  </div>
               </div>
            </div>
            */}

            {/* Team Table */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-gray-900 uppercase text-base tracking-wider">{t('create.brigade.sectionTitle')}</h3>
                 <button onClick={addTeamMember} className="text-base text-blue-600 font-semibold hover:bg-blue-50 px-3 py-1 rounded transition-colors flex items-center gap-1">
                   <Plus size={20} /> {t('create.brigade.add')}
                 </button>
               </div>

               <div className="overflow-x-auto">
                  <table className="w-full text-lg text-left border border-gray-200 rounded-lg">
                     <thead className="bg-gray-50 text-gray-500 font-semibold text-base">
                        <tr>
                           <th className="px-3 py-2 w-10">{t('create.brigade.colNo')}</th>
                           <th className="px-3 py-2">{t('create.brigade.colName')}</th>
                           <th className="px-3 py-2">{t('create.brigade.colPosition')}</th>
                           <th className="px-3 py-2">{t('create.brigade.colSignature')}</th>
                           <th className="px-3 py-2">{t('create.brigade.colInstructor')}</th>
                           <th className="px-3 py-2">{t('create.brigade.colDate')}</th>
                           <th className="px-3 py-2 w-10"></th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {teamMembers.map((member, idx) => (
                          <tr key={member.id} className="group hover:bg-gray-50/50">
                             <td className="px-3 py-2 text-center text-gray-400">{idx + 1}</td>
                             <td className="px-3 py-2">
                               <input
                                 type="text"
                                 value={member.name}
                                 onChange={(e) => updateTeamMember(member.id, 'name', e.target.value)}
                                 className="w-full bg-[#f7f7f7] border-gray-300 rounded px-2 py-2 text-lg text-gray-900 border focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
                                 placeholder={t('create.brigade.namePlaceholder')}
                               />
                             </td>
                             <td className="px-3 py-2">
                               <input
                                 type="text"
                                 value={member.role}
                                 onChange={(e) => updateTeamMember(member.id, 'role', e.target.value)}
                                 className="w-full bg-[#f7f7f7] border-gray-300 rounded px-2 py-2 text-lg text-gray-900 border focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
                                 placeholder={t('create.brigade.positionPlaceholder')}
                               />
                             </td>
                             <td className="px-3 py-2 text-center">
                               <div className="bg-gray-100 border border-gray-200 rounded px-2 py-2 text-base text-gray-400 italic">
                                 {t('create.brigade.signaturePlaceholder')}
                               </div>
                             </td>
                             <td className="px-3 py-2">
                               <input
                                 type="text"
                                 value={roles.admitting?.name || member.instructedBy || ''}
                                 readOnly
                                 className="w-full bg-gray-100 border-gray-200 rounded px-2 py-2 text-lg text-gray-600 border cursor-not-allowed"
                                 placeholder={t('create.brigade.admittingPlaceholder')}
                               />
                             </td>
                             <td className="px-3 py-2">
                                <input
                                   type="datetime-local"
                                   value={member.instructedAt}
                                   onChange={(e) => updateTeamMember(member.id, 'instructedAt', e.target.value)}
                                   className="w-full bg-[#f7f7f7] border-gray-300 rounded px-2 py-2 text-lg text-gray-900 border focus:ring-1 focus:ring-blue-500"
                                />
                             </td>
                             <td className="px-3 py-2 text-center">
                                <button onClick={() => removeTeamMember(member.id)} className="text-gray-300 hover:text-red-500">
                                  <Trash2 size={20} />
                                </button>
                             </td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>

            {/* 12. Продление наряда-допуска */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-gray-900 uppercase text-base tracking-wider">{t('create.extension.sectionTitle')}</h3>
                 <button onClick={addExtension} className="text-base text-blue-600 font-semibold hover:bg-blue-50 px-3 py-1 rounded transition-colors flex items-center gap-1">
                   <Plus size={20} /> {t('create.extension.addRecord')}
                 </button>
               </div>

               <div className="overflow-x-auto">
                  <table className="w-full text-lg text-left border border-gray-200 rounded-lg">
                     <thead className="bg-gray-50 text-gray-500 font-semibold text-sm">
                        <tr>
                           <th rowSpan={2} className="px-2 py-2 border-r border-gray-200 w-32">{t('create.extension.dateTime')}</th>
                           <th colSpan={2} className="px-2 py-2 border-r border-gray-200 text-center border-b">{t('create.extension.handOver')}</th>
                           <th rowSpan={2} className="px-2 py-2 border-r border-gray-200 w-32">{t('create.extension.teamCount')}</th>
                           <th colSpan={2} className="px-2 py-2 border-r border-gray-200 text-center border-b">{t('create.extension.takeOver')}</th>
                           <th colSpan={2} className="px-2 py-2 text-center border-b">{t('create.extension.admittingShift')}</th>
                           <th rowSpan={2} className="px-2 py-2 w-10"></th>
                        </tr>
                        <tr>
                            <th className="px-2 py-1 border-r border-gray-200 text-xs text-center">{t('create.extension.colName')}</th>
                            <th className="px-2 py-1 border-r border-gray-200 text-xs text-center w-24">{t('create.extension.colSign')}</th>
                            <th className="px-2 py-1 border-r border-gray-200 text-xs text-center">{t('create.extension.colName')}</th>
                            <th className="px-2 py-1 border-r border-gray-200 text-xs text-center w-24">{t('create.extension.colSign')}</th>
                            <th className="px-2 py-1 border-r border-gray-200 text-xs text-center">{t('create.extension.colName')}</th>
                            <th className="px-2 py-1 text-xs text-center w-24">{t('create.extension.colSign')}</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {formData.extensions.map((ext) => (
                           <tr key={ext.id} className="hover:bg-gray-50/50">
                               <td className="p-2 border-r border-gray-100">
                                   <input type="datetime-local" value={ext.dateTime} onChange={e => updateExtension(ext.id, 'dateTime', e.target.value)} className={commonInputClasses + " text-sm"} />
                               </td>
                               <td className="p-2 border-r border-gray-100">
                                   <input type="text" placeholder={t('create.extension.namePlaceholder')} value={ext.producerHandOverName} onChange={e => updateExtension(ext.id, 'producerHandOverName', e.target.value)} className={commonInputClasses + " text-sm"} />
                               </td>
                               <td className="p-2 border-r border-gray-100 bg-gray-50/30"></td>
                               <td className="p-2 border-r border-gray-100">
                                   <input type="number" min={0} value={ext.incomingTeamCount} onChange={e => updateExtension(ext.id, 'incomingTeamCount', parseInt(e.target.value))} className={commonInputClasses + " text-sm"} />
                               </td>
                               <td className="p-2 border-r border-gray-100">
                                   <input type="text" placeholder={t('create.extension.namePlaceholder')} value={ext.producerTakeOverName} onChange={e => updateExtension(ext.id, 'producerTakeOverName', e.target.value)} className={commonInputClasses + " text-sm"} />
                               </td>
                               <td className="p-2 border-r border-gray-100 bg-gray-50/30"></td>
                               <td className="p-2 border-r border-gray-100">
                                   <input type="text" placeholder={t('create.extension.namePlaceholder')} value={ext.admittingName} onChange={e => updateExtension(ext.id, 'admittingName', e.target.value)} className={commonInputClasses + " text-sm"} />
                               </td>
                               <td className="p-2 bg-gray-50/30"></td>
                               <td className="p-2 text-center">
                                   <button onClick={() => removeExtension(ext.id)} className="text-gray-300 hover:text-red-500">
                                      <Trash2 size={20} />
                                   </button>
                               </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>

            {/* 13. Работа окончена — дата заполняется при закрытии наряда Допускающим */}
             <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
               <h3 className="font-bold text-gray-900 uppercase text-base tracking-wider border-b pb-2 mb-4">{t('create.completion.sectionTitle')}</h3>
               <p className="text-sm text-gray-500 mb-4">{t('create.completion.hint')}</p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="md:col-span-2 flex items-end gap-2">
                       <span className="text-lg text-gray-700 font-semibold whitespace-nowrap">{t('create.completion.dateTime')}</span>
                       <input
                         type="datetime-local"
                         value={formData.completionDateTime}
                         onChange={e => updateForm('completionDateTime', e.target.value)}
                         className={`${commonInputClasses} bg-gray-100 cursor-not-allowed`}
                         disabled
                         title={t('create.completion.closedByAdmitting')}
                       />
                       <span className="text-lg text-gray-700 ml-2">{t('create.completion.equipmentRemoved')}</span>
                   </div>

                   <div className="md:col-span-2 pt-4 border-t border-gray-100">
                       <label className="block text-lg font-semibold text-gray-700 mb-2">{t('create.completion.handOver')}</label>
                       <input
                          type="text"
                          value={formData.completionHandOverName}
                          onChange={e => updateForm('completionHandOverName', e.target.value)}
                          placeholder={t('create.completion.positionName')}
                          className={commonInputClasses}
                       />
                   </div>

                   <div className="md:col-span-2">
                       <label className="block text-lg font-semibold text-gray-700 mb-2">{t('create.completion.takeOver')}</label>
                       <input
                          type="text"
                          value={formData.completionTakeOverName}
                          onChange={e => updateForm('completionTakeOverName', e.target.value)}
                          placeholder={t('create.completion.positionName')}
                          className={commonInputClasses}
                       />
                   </div>
               </div>
             </div>

         </div>
       )}

       {/* STEP 3: RISK ASSESSMENT */}
       {activeStep === 3 && (
         <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

            {/* General Info (Static) */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 uppercase text-base tracking-wider border-b pb-2">{t('create.risk.generalInfo')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-lg">
                    <div className="flex flex-col">
                        <span className="text-gray-500 font-semibold text-sm uppercase">{t('create.risk.workPlace')}</span>
                        <span className="text-gray-900">{formData.workPlace || t('create.risk.notSpecified')}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-500 font-semibold text-sm uppercase">{t('create.risk.company')}</span>
                        <span className="text-gray-900">{formData.organization}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-500 font-semibold text-sm uppercase">{t('create.risk.permitNo')}</span>
                        <span className="text-gray-400 italic">
                            {isEditing ? initialData?.permitId : t('create.risk.draftNoNumber')}
                        </span>
                    </div>
                     <div className="flex flex-col">
                        <span className="text-gray-500 font-semibold text-sm uppercase">{t('create.risk.date')}</span>
                        <span className="text-gray-900">{new Date().toLocaleDateString('ru-RU')}</span>
                    </div>
                    <div className="flex flex-col md:col-span-2">
                        <span className="text-gray-500 font-semibold text-sm uppercase">{t('create.risk.workTask')}</span>
                        <span className="text-gray-900">{formData.content || t('create.risk.notFilled')}</span>
                    </div>
                </div>
            </div>



            {/* Participants */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-6 uppercase text-base tracking-wider border-b pb-2">{t('create.risk.participants')}</h3>

                <div className="mb-6">
                    <label className="block text-lg font-semibold text-gray-700 mb-2">{t('create.risk.hazardsIdentified')}</label>
                    <input
                          type="text"
                          value={formData.completionTakeOverName}
                          onChange={e => updateForm('completionTakeOverName', e.target.value)}
                          placeholder="Должность, Ф.И.О."
                          className={commonInputClasses}
                       />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-lg font-semibold text-gray-700">{t('create.risk.riskGroupTitle')}</label>
                        <button onClick={addRiskGroupMember} className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded text-sm font-medium flex items-center gap-1 transition-colors">
                            <Plus size={16}/> {t('create.risk.addParticipant')}
                        </button>
                    </div>

                    <div className="space-y-3">
                        {formData.riskGroup.map((member, index) => (
                            <div key={member.id} className="flex gap-3 items-start">
                                <div className="w-8 pt-3 text-center text-gray-400 font-bold">{index + 1}.</div>
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        placeholder={t('create.risk.namePlaceholder')}
                                        className={commonInputClasses}
                                        value={member.name}
                                        onChange={(e) => updateRiskGroupMember(member.id, 'name', e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        placeholder={t('create.risk.positionPlaceholder')}
                                        className={commonInputClasses}
                                        value={member.position}
                                        onChange={(e) => updateRiskGroupMember(member.id, 'position', e.target.value)}
                                    />
                                </div>
                                <button onClick={() => removeRiskGroupMember(member.id)} className="mt-3 text-gray-300 hover:text-red-500 transition-colors">
                                    <Trash2 size={20}/>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Risk Table */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                     <h3 className="font-bold text-gray-900 uppercase text-base tracking-wider flex items-center gap-2">
                        <AlertTriangle size={24} className="text-orange-500"/>
                        {t('create.risk.riskTableTitle')}
                     </h3>
                     <button onClick={addRiskRow} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm">
                        <Plus size={18}/> {t('create.risk.addRow')}
                     </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="p-3 font-bold text-gray-600 text-sm uppercase w-[25%]">{t('create.risk.colSteps')}</th>
                                <th className="p-3 font-bold text-gray-600 text-sm uppercase w-[25%]">{t('create.risk.colHazards')}</th>
                                <th className="p-3 font-bold text-gray-600 text-sm uppercase w-[30%]">{t('create.risk.colMeasures')}</th>
                                <th className="p-3 font-bold text-gray-600 text-sm uppercase w-[15%] text-center">{t('create.risk.colControlled')}</th>
                                <th className="p-3 w-[5%]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {formData.riskTable.map((row) => (
                                <tr key={row.id} className="group hover:bg-gray-50/30">
                                    <td className="p-2 align-top">
                                        <textarea
                                            rows={4}
                                            className={`${commonInputClasses} text-base min-h-[100px]`}
                                            placeholder={t('create.risk.stepPlaceholder')}
                                            value={row.step}
                                            onChange={(e) => updateRiskRow(row.id, 'step', e.target.value)}
                                        />
                                    </td>
                                    <td className="p-2 align-top">
                                        <textarea
                                            rows={4}
                                            className={`${commonInputClasses} text-base min-h-[100px]`}
                                            placeholder={t('create.risk.hazardPlaceholder')}
                                            value={row.hazards}
                                            onChange={(e) => updateRiskRow(row.id, 'hazards', e.target.value)}
                                        />
                                    </td>
                                    <td className="p-2 align-top">
                                        <textarea
                                            rows={4}
                                            className={`${commonInputClasses} text-base min-h-[100px]`}
                                            placeholder={t('create.risk.measurePlaceholder')}
                                            value={row.measures}
                                            onChange={(e) => updateRiskRow(row.id, 'measures', e.target.value)}
                                        />
                                    </td>
                                    <td className="p-2 align-top text-center">
                                        <select
                                            className={`${commonInputClasses} text-base text-center`}
                                            value={row.isControlled}
                                            onChange={(e) => updateRiskRow(row.id, 'isControlled', e.target.value)}
                                        >
                                            <option value="">-</option>
                                            <option value="Да">{t('create.risk.yes')}</option>
                                            <option value="Нет">{t('create.risk.no')}</option>
                                        </select>
                                    </td>
                                    <td className="p-2 align-middle text-center">
                                        <button onClick={() => removeRiskRow(row.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                            <Trash2 size={20}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ЧЕК-ЛИСТ ОЦЕНКИ РИСКА */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-2 uppercase text-base tracking-wider flex items-center gap-2 border-b pb-3">
                    <ClipboardCheck size={22} className="text-orange-500"/>
                    {t('create.risk.checklistTitle')}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                    {t('create.risk.checklistHint')} <span className="font-bold text-orange-600">"{t('create.risk.mandatory')}"</span> {t('create.risk.checklistHintEnd')}
                </p>
                <ChecklistSection
                    checklist={checklistData}
                    onChange={setChecklistData}
                    readOnly={false}
                />
            </div>
         </div>
       )}

       {/* STEP 4: LOTO with Isolation Matrix */}
       {activeStep === 4 && (
         <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between border-b pb-2 mb-6">
                <h3 className="font-bold text-gray-900 uppercase text-base tracking-wider flex items-center gap-2">
                    <Lock size={24} className={formData.lotoEnabled ? "text-red-600" : "text-gray-400"}/>
                    {t('create.loto.sectionTitle')}
                </h3>

                <label className="inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.lotoEnabled}
                        onChange={(e) => updateForm('lotoEnabled', e.target.checked)}
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ms-3 text-sm font-medium text-gray-700">
                        {formData.lotoEnabled ? t('create.loto.enabled') : t('create.loto.disabled')}
                    </span>
                </label>
            </div>

            {formData.lotoEnabled ? (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
                   <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <Zap className="h-5 w-5 text-yellow-600" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            <b>⚠</b> {t('create.loto.warning')}
                          </p>
                        </div>
                      </div>
                   </div>

                   <IsolationMatrixForm
                      data={formData.isolationMatrix}
                      onChange={(newData) => updateForm('isolationMatrix', newData)}
                      permitId={draftPermitId || (isEditing ? Number(initialData?.id) : null)}
                      lotoPhotoUrl={lotoPhotoUrl}
                      onPhotoUploaded={(url) => { setLotoPhotoUrl(url); setPendingLotoFile(null); }}
                      onFileSelected={(file) => setPendingLotoFile(file)}
                   />
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <div className="flex justify-center mb-3">
                        <Lock size={48} className="text-gray-300" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">{t('create.loto.notApplied')}</h3>
                    <p className="text-gray-500 mt-1 max-w-md mx-auto">
                        {t('create.loto.notAppliedHint')}
                    </p>
                </div>
            )}
         </div>
       )}

      {/* Sticky Footer */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-2 md:-mx-4 mt-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10 w-[calc(100%+16px)] md:w-[calc(100%+32px)]">
        <div className="w-full flex justify-between items-center">
           <div className="hidden sm:block text-lg text-gray-400">
             {t('create.step', { current: activeStep, total: 4 })}
           </div>
           <div className="flex gap-3 w-full sm:w-auto">
             {activeStep > 1 && (
               <button onClick={() => setActiveStep(activeStep - 1)} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-lg font-medium">
                 {t('create.back')}
               </button>
             )}

             {activeStep < 4 ? (
               <button onClick={() => setActiveStep(activeStep + 1)} className="flex-1 sm:flex-none px-8 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 text-lg font-medium ml-auto">
                 {t('create.next')}
               </button>
             ) : (
               <>
                 <button
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting} // Блокируем, чтобы не нажали дважды
                  className={`flex-1 sm:flex-none px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg font-medium shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all transform active:scale-95 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                     <>⏳ {t('create.saving')}</>
                  ) : (
                     <>
                       {isEditing ? <Edit3 size={20}/> : <CheckCircle2 size={20} />}
                       <span className="ml-2">{isEditing ? t('create.saveChanges') : t('create.submitForApproval')}</span>
                     </>
                  )}
                </button>
               </>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};
