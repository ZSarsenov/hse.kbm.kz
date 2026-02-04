import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Save, FileText, AlertTriangle, Users, CheckCircle2, Lock, Zap, ShieldAlert, Building, Edit3, ChevronDown, ChevronUp, ClipboardCheck } from 'lucide-react';
import { TeamMember, RegulationFormData, UserRole, WORK_TYPES_LIST, RiskTableRow, RiskGroupMember, PermitExtension, PermitCategory, WorkPermit } from '../types';
import { IsolationMatrixForm } from '../components/IsolationMatrixForm';
import { ElectricalPermitForm } from '../components/ElectricalPermitForm';
import { UserSearchSelect } from '../components/UserSearchSelect';
import { SearchableSelect } from  "../components/SearchableSelect"


// Интерфейс для объекта пользователя в роли
interface RoleUser {
    id: number | null;
    name: string;
    role?: string;
    position?: string;
}

// Интерфейсы для чек-листа
interface ChecklistItem {
    id: string;
    question: string;
    value: '' | 'Да' | 'Нет' | 'НП';  // НП = не применимо
}

interface ChecklistSection {
    id: string;
    sheetName: string;
    required: boolean;
    items: ChecklistItem[];
}

interface CreatePermitProps {
  category: PermitCategory;
  onCancel: () => void;
  onSubmit: () => void;
  initialData?: WorkPermit | null; // 👈 Для редактирования
}

// 1. General Info, 2. Team, 3. Risk, 4. LOTO
const STEPS = [
  { id: 1, label: 'Общие сведения', icon: FileText },
  { id: 2, label: 'Состав бригады', icon: Users },
  { id: 3, label: 'Оценка риска', icon: AlertTriangle },
  { id: 4, label: 'LOTO', icon: Lock },
];

// Заглушка данных чек-листа (9 разделов: 3 обязательных + 6 необязательных)
const CHECKLIST_INITIAL_DATA: ChecklistSection[] = [
  // 3 обязательных раздела
  {
    id: 'permit-check',
    sheetName: 'Проверка по наряду допуску',
    required: true,
    items: [
      { id: 'p1', question: 'Наряд-допуск оформлен надлежащим образом', value: '' },
      { id: 'p2', question: 'Указаны все опасные и вредные факторы', value: '' },
      { id: 'p3', question: 'Определены меры безопасности', value: '' },
    ]
  },
  {
    id: 'bypass-check',
    sheetName: 'Проверка по обходу мер безопасности',
    required: true,
    items: [
      { id: 'b1', question: 'Проверено отсутствие обхода защитных устройств', value: '' },
      { id: 'b2', question: 'Блокировки исправны и не отключены', value: '' },
      { id: 'b3', question: 'Средства защиты в рабочем состоянии', value: '' },
    ]
  },
  {
    id: 'general-check',
    sheetName: 'Проверка по общим вопросам',
    required: true,
    items: [
      { id: 'g1', question: 'Персонал ознакомлен с условиями работы', value: '' },
      { id: 'g2', question: 'СИЗ выданы и используются', value: '' },
      { id: 'g3', question: 'Рабочее место подготовлено', value: '' },
    ]
  },
  // 6 необязательных разделов
  {
    id: 'fire-safety',
    sheetName: 'Пожарная безопасность',
    required: false,
    items: [
      { id: 'f1', question: 'Огнетушители в наличии', value: '' },
      { id: 'f2', question: 'Пути эвакуации свободны', value: '' },
    ]
  },
  {
    id: 'electrical',
    sheetName: 'Электробезопасность',
    required: false,
    items: [
      { id: 'e1', question: 'Заземление проверено', value: '' },
      { id: 'e2', question: 'Изоляция не повреждена', value: '' },
    ]
  },
  {
    id: 'height-work',
    sheetName: 'Работы на высоте',
    required: false,
    items: [
      { id: 'h1', question: 'Страховочная система исправна', value: '' },
      { id: 'h2', question: 'Леса/подмости проверены', value: '' },
    ]
  },
  {
    id: 'confined-space',
    sheetName: 'Работы в замкнутых пространствах',
    required: false,
    items: [
      { id: 'c1', question: 'Анализ воздушной среды проведён', value: '' },
      { id: 'c2', question: 'Наблюдающий назначен', value: '' },
    ]
  },
  {
    id: 'lifting',
    sheetName: 'Грузоподъёмные работы',
    required: false,
    items: [
      { id: 'l1', question: 'Стропы проверены', value: '' },
      { id: 'l2', question: 'Зона ограждена', value: '' },
    ]
  },
  {
    id: 'hot-work',
    sheetName: 'Огневые работы',
    required: false,
    items: [
      { id: 'o1', question: 'Разрешение на огневые работы получено', value: '' },
      { id: 'o2', question: 'Горючие материалы удалены', value: '' },
    ]
  },
];

export const CreatePermit: React.FC<CreatePermitProps> = ({ category, onCancel, onSubmit, initialData }) => {

  const isEditing = !!initialData;

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
       department: 'Ремонтно-механический цех (РМЦ)',
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

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [departmentsList, setDepartmentsList] = useState<any[]>([]);
  const [workTypesList, setWorkTypesList] = useState<any[]>([]);

  // Состояние чек-листа
  const [checklistSections, setChecklistSections] = useState<ChecklistSection[]>(CHECKLIST_INITIAL_DATA);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

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

          setRoles({
              producer: restoreRole(savedData.producer),
              admitting: restoreRole(savedData.admitting),
              responsible: restoreRole(savedData.responsible),
              issuer: issuerRole, // Используем исправленного выдающего
              supervisor: restoreRole(savedData.supervisor),
          });

          // 3. Восстанавливаем сложные массивы (Бригада, Риски, Расширения)
          if (savedData.teamMembers) setTeamMembers(savedData.teamMembers);
          // Остальные массивы (riskTable, extensions) уже попали через setFormData

      } else if (!isEditing) {
          // --- РЕЖИМ СОЗДАНИЯ (Автозаполнение себя) ---
          const savedUser = localStorage.getItem('user_data');
          if (savedUser) {
              try {
                  const user = JSON.parse(savedUser);
                  setRoles(prev => ({
                      ...prev,
                      issuer: {
                          id: user.id,
                          name: `${user.name} (${user.position || 'Сотрудник'})`,
                          role: user.role
                      }
                  }));
                  if (user.department) updateForm('department', user.department);
              } catch (e) { console.error(e); }
          }
      }
  }, [initialData, isEditing]);


  const updateForm = (field: keyof RegulationFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTeamMember = () => {
    const newId = (teamMembers.length + 1).toString();
    setTeamMembers([...teamMembers, { id: newId, name: '', role: '', instructedAt: '', instructedBy: '' }]);
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

  // --- Checklist Logic ---
  const toggleSection = (sectionId: string) => {
      setExpandedSections(prev => {
          const newSet = new Set(prev);
          if (newSet.has(sectionId)) {
              newSet.delete(sectionId);
          } else {
              newSet.add(sectionId);
          }
          return newSet;
      });
  };

  const updateChecklistItem = (sectionId: string, itemId: string, value: '' | 'Да' | 'Нет' | 'НП') => {
      setChecklistSections(prev => prev.map(section => 
          section.id === sectionId 
              ? { ...section, items: section.items.map(item => 
                  item.id === itemId ? { ...item, value } : item
                )}
              : section
      ));
  };

  // --- ЛОГИКА ОТПРАВКИ (CREATE vs UPDATE) ---
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      console.log("🚀 Начало отправки наряда...");

      // Валидация перед отправкой
      if (!roles.producer.id && !roles.producer.name) {
          alert("Не заполнен Производитель работ!"); setIsSubmitting(false); return;
      }

      // Валидация обязательных разделов чек-листа
      const requiredSections = checklistSections.filter(s => s.required);
      for (const section of requiredSections) {
          const unfilledItems = section.items.filter(item => item.value === '');
          if (unfilledItems.length > 0) {
              alert(`Не заполнены все пункты в обязательном разделе чек-листа: "${section.sheetName}"`);
              setIsSubmitting(false);
              return;
          }
      }

      // 1. Собираем ВСЕ данные
      const fullDataPayload = {
        ...formData,
        ...roles, // Отправляем объекты ролей ({id, name, role})
        teamMembers: teamMembers,
        riskTable: formData.riskTable,
        riskGroup: formData.riskGroup,
        isolationMatrix: formData.isolationMatrix,
        extensions: formData.extensions,
        checklistSections: checklistSections, // 👈 Чек-лист
        templateType: 'Наряд повышенной опасности',
        category: category
      };

      // 2. Готовим пакет для API
      const apiPayload = {
        location_name: formData.workPlace || "Не указано",
        valid_from: formData.dateStart || null,
        valid_to: formData.dateEnd || null,
        data: fullDataPayload
      };

      // 👇 ОПРЕДЕЛЯЕМ URL И МЕТОД (РЕДАКТИРОВАНИЕ ИЛИ СОЗДАНИЕ)
      const url = isEditing
          ? `/api/v1/permits/${initialData.id}/`
          : '/api/v1/permits/';

      const method = isEditing ? 'PUT' : 'POST';

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
        alert(isEditing ? '✅ Наряд успешно обновлен!' : `✅ Наряд №${result.permit_id} успешно создан!`);
        onSubmit();
      } else {
        const errorData = await response.json();
        console.error("Ошибка сервера:", errorData);
        alert(`❌ Ошибка: ${JSON.stringify(errorData)}`);
      }

    } catch (error) {
      console.error("Ошибка сети:", error);
      alert("❌ Нет соединения с сервером Django");
    } finally {
      setIsSubmitting(false);
    }
  };

  const commonInputClasses = "w-full bg-[#f7f7f7] border-gray-300 rounded-md px-4 py-3 text-lg text-gray-900 focus:ring-blue-500 focus:border-blue-500 border transition-colors placeholder-gray-400 max-w-full";

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
         <button onClick={onCancel} className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={28} />
         </button>
         <div className="flex-1">
             <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-900 leading-tight">
                    {isEditing ? `Редактирование: ${initialData?.permitId}` : 'Создание Наряда-Допуска'}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wide bg-orange-100 text-orange-700 border-orange-200">
                  <AlertTriangle size={12}/>
                  Повышенная опасность
                </span>
             </div>
             <p className="text-lg text-slate-500 font-mono mt-0.5">Форма согласно Приложения 1 к Приказу № 344</p>
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
              <h3 className="font-bold text-gray-900 mb-4 uppercase text-base tracking-wider border-b pb-2">Место и Характер работ</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="block text-lg font-semibold text-gray-700 mb-2">Организация</label>
                   <input type="text" value={formData.organization} readOnly className="w-full bg-gray-100 border border-gray-300 rounded-md px-4 py-3 text-lg text-gray-500 cursor-not-allowed" />
                 </div>

                 <div>
                   <label className="block text-lg font-semibold text-gray-700 mb-2">Участок / Цех</label>
                   {/* Компонент поиска */}
                   <SearchableSelect
                        value={formData.department}
                        apiEndpoint="/api/v1/departments/"
                        placeholder="Начните вводить (например: Цех...)"
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
                         <Building size={14} /> Введите название подрядчика
                       </label>
                       <input
                         type="text"
                         value={formData.contractor || ''}
                         onChange={(e) => updateForm('contractor', e.target.value)}
                         placeholder="Напр. ТОО «Сервис-Плюс»"
                         className={`${commonInputClasses} border-blue-200 ring-2 ring-blue-50 focus:ring-blue-500 bg-white`}
                         autoFocus
                       />
                     </div>
                   )}
                 </div>

                 <div className="md:col-span-2">
                    <SearchableSelect
                        label="Наименование работ"
                        value={formData.workName}
                        apiEndpoint="/api/v1/work-types/"
                        placeholder="Введите вид работ (например: Огневые...)"
                        onChange={(val) => updateForm('workName', val)}
                    />
                 </div>
                 <div className="md:col-span-2">
                   <label className="block text-lg font-semibold text-gray-700 mb-2">Допускается к выполнению (Место работы)</label>
                   <input
                     type="text"
                     value={formData.workPlace}
                     onChange={(e) => updateForm('workPlace', e.target.value)}
                     placeholder="Укажите точное место..."
                     className={commonInputClasses}
                   />
                 </div>
                 <div className="md:col-span-2">
                   <label className="block text-lg font-semibold text-gray-700 mb-2">Краткое содержание объема работ</label>
                   <textarea
                     rows={3}
                     value={formData.content}
                     onChange={(e) => updateForm('content', e.target.value)}
                     placeholder="Опишите, что именно будет делаться..."
                     className={commonInputClasses}
                   />
                 </div>
              </div>
           </div>

           {/* Section 2: Responsible Persons - ОБНОВЛЕНО НА УМНЫЙ ПОИСК */}
           <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 uppercase text-base tracking-wider border-b pb-2">Лица, ответственные за безопасность</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">

                 {/* 1. Наряд выдал (Авто-заполнение, READONLY) */}
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Наряд выдал (Выдающий)</label>
                   <input
                     type="text"
                     value={roles.issuer.name || 'Загрузка...'}
                     disabled
                     className={`${commonInputClasses} cursor-not-allowed text-gray-500`}
                   />
                 </div>

                 {/* 2. Ответственный руководитель */}
                 <div>
                   <UserSearchSelect
                      label="Ответственный руководитель (если назначается)"
                      value={roles.responsible.name}
                      requiredRole="RESPONSIBLE"
                      onChange={(user) => {
                             // Формируем красивую строку
                             const displayName = user ? `${user.name} (${user.position || 'Должность не указана'})` : '';
                             setRoles(prev => ({
                                 ...prev,
                                 responsible: user
                                    ? { id: user.id, name: displayName, role: user.role }
                                    : { id: null, name: '' }
                             }));
                         }}
                      placeholder="Начните вводить фамилию..."
                   />
                 </div>

                 {/* 3. Допускающий */}
                 <div>
                   <UserSearchSelect
                      label="Допускающий к работе"
                      value={roles.admitting.name}
                      requiredRole="ADMITTING"
                      onChange={(user) => {
                         const displayName = user ? `${user.name} (${user.position || 'Должность не указана'})` : '';
                         const userData = user ? { id: user.id, name: displayName, role: user.role } : { id: null, name: '' };
                         setRoles(prev => ({ ...prev, admitting: userData }));
                         // Дублируем в "Наряд принял" для шага 2
                         if (user) updateForm('completionTakeOverName', displayName);
                     }}
                      placeholder="Начните вводить фамилию..."
                   />
                 </div>

                 {/* 4. Производитель работ */}
                 <div>
                   <UserSearchSelect
                      label="Производитель работ"
                      value={roles.producer.name}
                      requiredRole="WORK_PRODUCER"
                      onChange={(user) => {
                         const displayName = user ? `${user.name} (${user.position || 'Должность не указана'})` : '';
                         const userData = user ? { id: user.id, name: displayName, role: user.role } : { id: null, name: '' };
                         setRoles(prev => ({ ...prev, producer: userData }));
                         // Дублируем в "Наряд сдал" для шага 2
                         if (user) updateForm('completionHandOverName', displayName);
                     }}
                      placeholder="Начните вводить фамилию..."
                   />
                 </div>

                 {/* 5. Согласующий */}
                  <div className="md:col-span-2 border-t pt-4 mt-2">
                   <UserSearchSelect
                      label="Согласовано (Нач. смены / Участка / Инженер ТБ)"
                      value={roles.supervisor.name}
                      requiredRole="COORDINATOR"
                      onChange={(user) => {
                         const displayName = user ? `${user.name} (${user.position || 'Должность не указана'})` : '';
                         setRoles(prev => ({
                             ...prev,
                             supervisor: user ? { id: user.id, name: displayName, role: user.role } : { id: null, name: '' }
                         }));
                     }}
                      placeholder="Начните вводить фамилию..."
                   />
                 </div>

              </div>
           </div>

           {/* Section 3: Safety Measures */}
           <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
             <h3 className="font-bold text-gray-900 mb-6 uppercase text-base tracking-wider border-b pb-2 flex items-center gap-2">
               <ShieldAlert size={24} className="text-blue-600"/>
               5. Мероприятия по обеспечению безопасности работ
             </h3>
             <div className="space-y-5">
               {[
                 { key: 'm5_1_stop', label: '5.1 Остановить', placeholder: 'Место остановки, положение...' },
                 { key: 'm5_2_disconnect', label: '5.2 Отключить', placeholder: 'Рубильник, задвижку, магистраль...' },
                 { key: 'm5_3_install', label: '5.3 Установить', placeholder: 'Тупики, заглушки, сигнальные лампы...' },
                 { key: 'm5_4_analysis', label: '5.4 Взять пробу для анализа возд. среды', placeholder: 'Указать места и результат анализа, группу загазованности...' },
                 { key: 'm5_5_fence', label: '5.5 Оградить', placeholder: 'Зону работ, вывесить плакаты...' },
                 { key: 'm5_6_height', label: '5.6 Меры при работе на высоте/в колодцах', placeholder: 'Леса, пояса, веревки...' },
                 { key: 'm5_7_warn', label: '5.7 Предупредить', placeholder: 'Машинистов кранов и т.д....' },
                 { key: 'm5_8_railway', label: '5.8 Меры у Ж/Д путей', placeholder: 'Знаки, плакаты, ограждения...' },
                 { key: 'm5_9_routes', label: '5.9 Маршруты к месту работы', placeholder: 'Описать безопасный маршрут...' },
                 { key: 'm5_10_additional', label: '5.10 Дополнительные мероприятия', placeholder: 'Прочие меры...' },
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
             </div>
           </div>
         </div>
       )}

       {/* STEP 2: TEAM & DATES */}
       {activeStep === 2 && (
         <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

            {/* Dates */}
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

            {/* Team Table */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-gray-900 uppercase text-base tracking-wider">11. Состав бригады</h3>
                 <button onClick={addTeamMember} className="text-base text-blue-600 font-semibold hover:bg-blue-50 px-3 py-1 rounded transition-colors flex items-center gap-1">
                   <Plus size={20} /> Добавить
                 </button>
               </div>

               <div className="overflow-x-auto">
                  <table className="w-full text-lg text-left border border-gray-200 rounded-lg">
                     <thead className="bg-gray-50 text-gray-500 font-semibold text-base">
                        <tr>
                           <th className="px-3 py-2 w-10">№</th>
                           <th className="px-3 py-2">Ф.И.О. членов бригады</th>
                           <th className="px-3 py-2">Профессия / Должность</th>
                           <th className="px-3 py-2">С условиями работы ознакомлен, инструктаж получил (подпись)</th>
                           <th className="px-3 py-2">Инструктаж провел (допускающий Ф.И.О., подпись)</th>
                           <th className="px-3 py-2">Дата/Время инструктажа</th>
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
                                 placeholder="Фамилия И.О."
                               />
                             </td>
                             <td className="px-3 py-2">
                               <input
                                 type="text"
                                 value={member.role}
                                 onChange={(e) => updateTeamMember(member.id, 'role', e.target.value)}
                                 className="w-full bg-[#f7f7f7] border-gray-300 rounded px-2 py-2 text-lg text-gray-900 border focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
                                 placeholder="Должность"
                               />
                             </td>
                             <td className="px-3 py-2 text-center">
                               <div className="bg-gray-100 border border-gray-200 rounded px-2 py-2 text-base text-gray-400 italic">
                                 Подпись
                               </div>
                             </td>
                             <td className="px-3 py-2">
                               <input
                                 type="text"
                                 value={member.instructedBy || ''}
                                 onChange={(e) => updateTeamMember(member.id, 'instructedBy', e.target.value)}
                                 className="w-full bg-[#f7f7f7] border-gray-300 rounded px-2 py-2 text-lg text-gray-900 border focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
                                 placeholder="Ф.И.О."
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
                 <h3 className="font-bold text-gray-900 uppercase text-base tracking-wider">12. Продление наряда-допуска</h3>
                 <button onClick={addExtension} className="text-base text-blue-600 font-semibold hover:bg-blue-50 px-3 py-1 rounded transition-colors flex items-center gap-1">
                   <Plus size={20} /> Добавить запись
                 </button>
               </div>

               <div className="overflow-x-auto">
                  <table className="w-full text-lg text-left border border-gray-200 rounded-lg">
                     <thead className="bg-gray-50 text-gray-500 font-semibold text-sm">
                        <tr>
                           <th rowSpan={2} className="px-2 py-2 border-r border-gray-200 w-32">Дата, время</th>
                           <th colSpan={2} className="px-2 py-2 border-r border-gray-200 text-center border-b">Условия не изменились, смену сдал - производитель работ</th>
                           <th rowSpan={2} className="px-2 py-2 border-r border-gray-200 w-32">Численный состав заступающей бригады</th>
                           <th colSpan={2} className="px-2 py-2 border-r border-gray-200 text-center border-b">С условиями работ ознакомлен, смену принял - производитель работ</th>
                           <th colSpan={2} className="px-2 py-2 text-center border-b">Допуск разрешаю - допускающий к работе в смене</th>
                           <th rowSpan={2} className="px-2 py-2 w-10"></th>
                        </tr>
                        <tr>
                            <th className="px-2 py-1 border-r border-gray-200 text-xs text-center">Ф.И.О.</th>
                            <th className="px-2 py-1 border-r border-gray-200 text-xs text-center w-24">Подпись</th>
                            <th className="px-2 py-1 border-r border-gray-200 text-xs text-center">Ф.И.О.</th>
                            <th className="px-2 py-1 border-r border-gray-200 text-xs text-center w-24">Подпись</th>
                            <th className="px-2 py-1 border-r border-gray-200 text-xs text-center">Ф.И.О.</th>
                            <th className="px-2 py-1 text-xs text-center w-24">Подпись</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {formData.extensions.map((ext) => (
                           <tr key={ext.id} className="hover:bg-gray-50/50">
                               <td className="p-2 border-r border-gray-100">
                                   <input type="datetime-local" value={ext.dateTime} onChange={e => updateExtension(ext.id, 'dateTime', e.target.value)} className={commonInputClasses + " text-sm"} />
                               </td>
                               <td className="p-2 border-r border-gray-100">
                                   <input type="text" placeholder="ФИО" value={ext.producerHandOverName} onChange={e => updateExtension(ext.id, 'producerHandOverName', e.target.value)} className={commonInputClasses + " text-sm"} />
                               </td>
                               <td className="p-2 border-r border-gray-100 bg-gray-50/30"></td>
                               <td className="p-2 border-r border-gray-100">
                                   <input type="number" min={0} value={ext.incomingTeamCount} onChange={e => updateExtension(ext.id, 'incomingTeamCount', parseInt(e.target.value))} className={commonInputClasses + " text-sm"} />
                               </td>
                               <td className="p-2 border-r border-gray-100">
                                   <input type="text" placeholder="ФИО" value={ext.producerTakeOverName} onChange={e => updateExtension(ext.id, 'producerTakeOverName', e.target.value)} className={commonInputClasses + " text-sm"} />
                               </td>
                               <td className="p-2 border-r border-gray-100 bg-gray-50/30"></td>
                               <td className="p-2 border-r border-gray-100">
                                   <input type="text" placeholder="ФИО" value={ext.admittingName} onChange={e => updateExtension(ext.id, 'admittingName', e.target.value)} className={commonInputClasses + " text-sm"} />
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

            {/* 13. Работа окончена */}
             <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
               <h3 className="font-bold text-gray-900 uppercase text-base tracking-wider border-b pb-2 mb-4">13. Работа окончена</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="md:col-span-2 flex items-end gap-2">
                       <span className="text-lg text-gray-700 font-semibold whitespace-nowrap">Дата, время:</span>
                       <input
                         type="datetime-local"
                         value={formData.completionDateTime}
                         onChange={e => updateForm('completionDateTime', e.target.value)}
                         className={commonInputClasses}
                       />
                       <span className="text-lg text-gray-700 ml-2">убрано, персонал с места производства работ выведен.</span>
                   </div>

                   <div className="md:col-span-2 pt-4 border-t border-gray-100">
                       <label className="block text-lg font-semibold text-gray-700 mb-2">Наряд-допуск сдал (Производитель работ)</label>
                       <input
                          type="text"
                          value={formData.completionHandOverName}
                          onChange={e => updateForm('completionHandOverName', e.target.value)}
                          placeholder="Должность, Ф.И.О."
                          className={commonInputClasses}
                       />
                   </div>

                   <div className="md:col-span-2">
                       <label className="block text-lg font-semibold text-gray-700 mb-2">Рабочее место, наряд-допуск принял (Допускающий)</label>
                       <input
                          type="text"
                          value={formData.completionTakeOverName}
                          onChange={e => updateForm('completionTakeOverName', e.target.value)}
                          placeholder="Должность, Ф.И.О."
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
                <h3 className="font-bold text-gray-900 mb-4 uppercase text-base tracking-wider border-b pb-2">Общая информация</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-lg">
                    <div className="flex flex-col">
                        <span className="text-gray-500 font-semibold text-sm uppercase">Место работ</span>
                        <span className="text-gray-900">{formData.workPlace || 'Не указано'}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-500 font-semibold text-sm uppercase">Компания</span>
                        <span className="text-gray-900">{formData.organization}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-500 font-semibold text-sm uppercase">№ Наряда-допуска</span>
                        <span className="text-gray-400 italic">
                            {isEditing ? initialData?.permitId : 'Черновик (б/н)'}
                        </span>
                    </div>
                     <div className="flex flex-col">
                        <span className="text-gray-500 font-semibold text-sm uppercase">Дата</span>
                        <span className="text-gray-900">{new Date().toLocaleDateString('ru-RU')}</span>
                    </div>
                    <div className="flex flex-col md:col-span-2">
                        <span className="text-gray-500 font-semibold text-sm uppercase">Работа / Задание</span>
                        <span className="text-gray-900">{formData.content || 'Не заполнено'}</span>
                    </div>
                </div>
            </div>



            {/* Participants */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-6 uppercase text-base tracking-wider border-b pb-2">Участники оценки рисков</h3>

                <div className="mb-6">
                    <label className="block text-lg font-semibold text-gray-700 mb-2">Опасности и риски выявил (ФИО, Должность)</label>
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
                        <label className="block text-lg font-semibold text-gray-700">Участники группы выявления опасностей и рисков</label>
                        <button onClick={addRiskGroupMember} className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded text-sm font-medium flex items-center gap-1 transition-colors">
                            <Plus size={16}/> Добавить участника
                        </button>
                    </div>

                    <div className="space-y-3">
                        {formData.riskGroup.map((member, index) => (
                            <div key={member.id} className="flex gap-3 items-start">
                                <div className="w-8 pt-3 text-center text-gray-400 font-bold">{index + 1}.</div>
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        placeholder="ФИО"
                                        className={commonInputClasses}
                                        value={member.name}
                                        onChange={(e) => updateRiskGroupMember(member.id, 'name', e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Должность"
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
                        Таблица анализа рисков
                     </h3>
                     <button onClick={addRiskRow} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm">
                        <Plus size={18}/> Добавить строку
                     </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="p-3 font-bold text-gray-600 text-sm uppercase w-[25%]">Последовательность этапов работы</th>
                                <th className="p-3 font-bold text-gray-600 text-sm uppercase w-[25%]">Опасности и риски / Возможные происшествия</th>
                                <th className="p-3 font-bold text-gray-600 text-sm uppercase w-[30%]">Меры контроля</th>
                                <th className="p-3 font-bold text-gray-600 text-sm uppercase w-[15%] text-center">Меры имеются?</th>
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
                                            placeholder="Опишите этап..."
                                            value={row.step}
                                            onChange={(e) => updateRiskRow(row.id, 'step', e.target.value)}
                                        />
                                    </td>
                                    <td className="p-2 align-top">
                                        <textarea
                                            rows={4}
                                            className={`${commonInputClasses} text-base min-h-[100px]`}
                                            placeholder="Опишите риски..."
                                            value={row.hazards}
                                            onChange={(e) => updateRiskRow(row.id, 'hazards', e.target.value)}
                                        />
                                    </td>
                                    <td className="p-2 align-top">
                                        <textarea
                                            rows={4}
                                            className={`${commonInputClasses} text-base min-h-[100px]`}
                                            placeholder="Опишите меры..."
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
                                            <option value="Да">Да</option>
                                            <option value="Нет">Нет</option>
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

            {/* Чек лист */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-900 uppercase text-base tracking-wider border-b pb-2 mb-4 flex items-center gap-2">
                    <ClipboardCheck size={24} className="text-blue-600"/>
                    Чек лист
                </h3>
                
                <div className="space-y-2">
                    {checklistSections.map((section) => (
                        <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            {/* Accordion Header */}
                            <button
                                type="button"
                                onClick={() => toggleSection(section.id)}
                                className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
                                    expandedSections.has(section.id) ? 'bg-blue-50' : 'bg-gray-50 hover:bg-gray-100'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    {expandedSections.has(section.id) ? (
                                        <ChevronUp size={20} className="text-blue-600" />
                                    ) : (
                                        <ChevronDown size={20} className="text-gray-400" />
                                    )}
                                    <span className="font-semibold text-gray-800">{section.sheetName}</span>
                                    {section.required && (
                                        <span className="px-2 py-0.5 text-xs font-bold uppercase rounded bg-red-100 text-red-700 border border-red-200">
                                            Обязательно
                                        </span>
                                    )}
                                </div>
                                <span className="text-sm text-gray-500">
                                    {section.items.filter(i => i.value !== '').length} / {section.items.length}
                                </span>
                            </button>

                            {/* Accordion Content */}
                            {expandedSections.has(section.id) && (
                                <div className="p-4 border-t border-gray-200 bg-white animate-in fade-in slide-in-from-top-1 duration-200">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-gray-100">
                                                <th className="pb-2 text-sm font-semibold text-gray-500 w-10">№</th>
                                                <th className="pb-2 text-sm font-semibold text-gray-500">Пункт проверки</th>
                                                <th className="pb-2 text-sm font-semibold text-gray-500 w-32 text-center">Результат</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {section.items.map((item, idx) => (
                                                <tr key={item.id} className="hover:bg-gray-50/50">
                                                    <td className="py-3 text-gray-400 text-sm">{idx + 1}</td>
                                                    <td className="py-3 text-gray-800">{item.question}</td>
                                                    <td className="py-3">
                                                        <select
                                                            value={item.value}
                                                            onChange={(e) => updateChecklistItem(section.id, item.id, e.target.value as '' | 'Да' | 'Нет' | 'НП')}
                                                            className={`w-full px-3 py-2 text-sm border rounded-md transition-colors ${
                                                                item.value === 'Да' ? 'bg-green-50 border-green-300 text-green-700' :
                                                                item.value === 'Нет' ? 'bg-red-50 border-red-300 text-red-700' :
                                                                item.value === 'НП' ? 'bg-gray-100 border-gray-300 text-gray-600' :
                                                                'bg-white border-gray-300 text-gray-700'
                                                            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                                        >
                                                            <option value="">—</option>
                                                            <option value="Да">Да</option>
                                                            <option value="Нет">Нет</option>
                                                            <option value="НП">НП</option>
                                                        </select>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
         </div>
       )}

       {/* STEP 4: LOTO with Isolation Matrix */}
       {activeStep === 4 && (
         <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between border-b pb-2 mb-6">
                <h3 className="font-bold text-gray-900 uppercase text-base tracking-wider flex items-center gap-2">
                    <Lock size={24} className={formData.lotoEnabled ? "text-red-600" : "text-gray-400"}/>
                    Процедуры блокировки и маркировки (LOTO)
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
                        {formData.lotoEnabled ? 'Включено' : 'Выключено'}
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
                            <b>Внимание:</b> Заполнение Матрицы ИИ является обязательным при выполнении работ с отключением энергии.
                          </p>
                        </div>
                      </div>
                   </div>

                   {/* Render Isolation Matrix Form Component */}
                   <IsolationMatrixForm
                      data={formData.isolationMatrix}
                      onChange={(newData) => updateForm('isolationMatrix', newData)}
                   />
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <div className="flex justify-center mb-3">
                        <Lock size={48} className="text-gray-300" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Процедура LOTO не применяется</h3>
                    <p className="text-gray-500 mt-1 max-w-md mx-auto">
                        Если для выполнения работ требуется блокировка источников энергии, включите опцию выше.
                    </p>
                </div>
            )}
         </div>
       )}

      {/* Sticky Footer */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-2 md:-mx-4 mt-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10 w-[calc(100%+16px)] md:w-[calc(100%+32px)]">
        <div className="w-full flex justify-between items-center">
           <div className="hidden sm:block text-lg text-gray-400">
             Шаг {activeStep} из 4
           </div>
           <div className="flex gap-3 w-full sm:w-auto">
             {activeStep > 1 && (
               <button onClick={() => setActiveStep(activeStep - 1)} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-lg font-medium">
                 Назад
               </button>
             )}

             {activeStep < 4 ? (
               <button onClick={() => setActiveStep(activeStep + 1)} className="flex-1 sm:flex-none px-8 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 text-lg font-medium ml-auto">
                 Далее
               </button>
             ) : (
               <>
                 <button
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting} // Блокируем, чтобы не нажали дважды
                  className={`flex-1 sm:flex-none px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg font-medium shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all transform active:scale-95 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                     <>⏳ Сохранение...</>
                  ) : (
                     <>
                       {isEditing ? <Edit3 size={20}/> : <CheckCircle2 size={20} />}
                       <span className="ml-2">{isEditing ? 'Сохранить изменения' : 'Отправить на согласование'}</span>
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
