
import React, { useState } from 'react';
import { 
  Plus, Trash2, Zap, Clock, Users, ShieldAlert, 
  FileText, Calendar, ChevronDown, CheckCircle2, 
  UserPlus, UserMinus, PenTool, ClipboardCheck, Building
} from 'lucide-react';
import { 
  ElectricalFormData, 
  ElectricalSafetyMeasure, 
  ELECTRICAL_WORK_CATEGORIES,
  ElectricalLifecycle,
  DailyAdmission,
  BrigadeChange
} from '../types';

interface Props {
  mode: 'create' | 'execution';
  initialData?: ElectricalFormData;
  initialLifecycle?: ElectricalLifecycle;
  onSubmit?: (data: ElectricalFormData) => void;
  onUpdateLifecycle?: (lifecycle: ElectricalLifecycle) => void;
  onCancel?: () => void;
}

export const ElectricalPermitForm: React.FC<Props> = ({ 
  mode, 
  initialData, 
  initialLifecycle,
  onSubmit, 
  onUpdateLifecycle,
  onCancel 
}) => {
  const isReadonly = mode === 'execution';

  // --- State: Creation Form (Image 1) ---
  const [formData, setFormData] = useState<ElectricalFormData>(initialData || {
    organization: '«КБМ» АҚ',
    department: 'Электр цехы',
    workManagerId: '',
    admittingAuthorityId: '',
    workProducerId: '',
    observerId: '',
    brigadeMembers: [''],
    workCategory: '',
    assignment: '',
    startDate: '',
    endDate: '',
    emergencyReadinessTime: '',
    safetyMeasures: [{ id: '1', installationName: '', actionRequired: '' }],
    issuerId: '',
    issuerDate: new Date().toISOString().split('T')[0],
    voltageRemainsAt: '',
  });

  // Track if contractor mode is active for org/dept
  const [isContractorOrg, setIsContractorOrg] = useState(false);
  const [isContractorDept, setIsContractorDept] = useState(false);

  // --- State: Lifecycle Data (Image 2) ---
  const [lifecycle, setLifecycle] = useState<ElectricalLifecycle>(initialLifecycle || {
    dailyAdmissions: [],
    brigadeChanges: [],
    briefingLogs: []
  });

  // --- Handlers: Creation Side ---
  const updateField = (field: keyof ElectricalFormData, value: any) => {
    if (isReadonly) return;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSafetyMeasure = () => {
    setFormData(prev => ({
      ...prev,
      safetyMeasures: [...prev.safetyMeasures, { id: Date.now().toString(), installationName: '', actionRequired: '' }]
    }));
  };

  const removeSafetyMeasure = (id: string) => {
    if (formData.safetyMeasures.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      safetyMeasures: prev.safetyMeasures.filter(m => m.id !== id)
    }));
  };

  // --- Handlers: Lifecycle Side (Image 2) ---
  const addDailyAdmission = () => {
    const newEntry: DailyAdmission = {
      id: Date.now().toString(),
      workPlace: '',
      admissionDateTime: new Date().toISOString(),
      admittingSignature: 'DIGITAL_SIGN',
      producerSignature: 'DIGITAL_SIGN',
      finishDateTime: '',
      producerFinishSignature: ''
    };
    const updated = { ...lifecycle, dailyAdmissions: [...lifecycle.dailyAdmissions, newEntry] };
    setLifecycle(updated);
    onUpdateLifecycle?.(updated);
  };

  const addBrigadeChange = () => {
    const newChange: BrigadeChange = {
      id: Date.now().toString(),
      introducedMember: '',
      removedMember: '',
      dateTime: new Date().toISOString(),
      authorizedBy: formData.workManagerId || 'Руководитель работ'
    };
    const updated = { ...lifecycle, brigadeChanges: [...lifecycle.brigadeChanges, newChange] };
    setLifecycle(updated);
    onUpdateLifecycle?.(updated);
  };

  // --- Shared Styles ---
  const inputClasses = `w-full border-b border-gray-300 px-2 py-1 text-base outline-none transition-all ${isReadonly ? 'bg-transparent border-transparent font-semibold' : 'focus:border-blue-500 bg-gray-50/50'}`;
  const selectClasses = `w-full border-b border-gray-300 px-1 py-1 text-base outline-none focus:border-blue-500 bg-gray-50/50 cursor-pointer appearance-none`;
  const labelClasses = "text-sm text-gray-600 flex items-center gap-1";
  const sectionHeader = "text-lg font-bold border-b-2 border-slate-800 pb-1 mb-4 uppercase tracking-tighter flex items-center justify-between";

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24 font-sans text-slate-900">
      
      {/* --------------------------------------------------------- */}
      {/* ЛИЦЕВАЯ СТОРОНА (PAGE 1)                                  */}
      {/* --------------------------------------------------------- */}
      <div className="bg-white shadow-2xl border border-gray-200 p-8 md:p-12 print:shadow-none">
        
        {/* Шапка */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6 border-b pb-6">
          <div className="space-y-4 w-full md:w-1/2">
             {/* Организация */}
             <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase w-32 shrink-0">Ұйым / Организация:</span>
                    {isReadonly ? (
                        <input className={inputClasses} value={formData.organization} readOnly />
                    ) : (
                        <div className="relative flex-1">
                            <select 
                                className={selectClasses}
                                value={isContractorOrg ? 'CONTRACTOR' : formData.organization}
                                onChange={(e) => {
                                    if (e.target.value === 'CONTRACTOR') {
                                        setIsContractorOrg(true);
                                        updateField('organization', '');
                                    } else {
                                        setIsContractorOrg(false);
                                        updateField('organization', e.target.value);
                                    }
                                }}
                            >
                                <option value="«КБМ» АҚ">«КБМ» АҚ (АО «КБМ»)</option>
                                <option value="CONTRACTOR">Мердігер ұйым / Подрядная организация</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-2 text-gray-400 pointer-events-none" size={14} />
                        </div>
                    )}
                </div>
                {!isReadonly && isContractorOrg && (
                    <div className="flex items-center gap-2 mt-1 animate-in slide-in-from-top-1 duration-200 ml-32">
                        <Building size={14} className="text-blue-500" />
                        <input 
                            className={`${inputClasses} border-blue-200`} 
                            placeholder="Атауын енгізіңіз / Введите название..."
                            value={formData.organization}
                            onChange={(e) => updateField('organization', e.target.value)}
                            autoFocus
                        />
                    </div>
                )}
             </div>

             {/* Подразделение */}
             <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase w-32 shrink-0">Бөлімше / Подразделение:</span>
                    {isReadonly ? (
                        <input className={inputClasses} value={formData.department} readOnly />
                    ) : (
                        <div className="relative flex-1">
                            <select 
                                className={selectClasses}
                                value={isContractorDept ? 'CONTRACTOR' : formData.department}
                                onChange={(e) => {
                                    if (e.target.value === 'CONTRACTOR') {
                                        setIsContractorDept(true);
                                        updateField('department', '');
                                    } else {
                                        setIsContractorDept(false);
                                        updateField('department', e.target.value);
                                    }
                                }}
                            >
                                <option value="Электр цехы">Электр цехы (Электроцех)</option>
                                <option value="Мұнай өндіру цехы">Мұнай өндіру цехы (ЦДН)</option>
                                <option value="РМЦ">РМЦ</option>
                                <option value="CONTRACTOR">Мердігер бөлімше / Подрядная организация</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-2 text-gray-400 pointer-events-none" size={14} />
                        </div>
                    )}
                </div>
                {!isReadonly && isContractorDept && (
                    <div className="flex items-center gap-2 mt-1 animate-in slide-in-from-top-1 duration-200 ml-32">
                        <Building size={14} className="text-blue-500" />
                        <input 
                            className={`${inputClasses} border-blue-200`} 
                            placeholder="Бөлімше атауы / Название подразделения..."
                            value={formData.department}
                            onChange={(e) => updateField('department', e.target.value)}
                            autoFocus
                        />
                    </div>
                )}
             </div>
          </div>
          <div className="text-right w-full md:w-1/2">
             <div className="text-3xl font-black italic text-slate-800 flex items-center justify-end gap-3">
                <Zap className="text-yellow-500 fill-yellow-500" size={32} />
                НАРЯД-ДОПУСК
             </div>
             <div className="text-xs font-bold text-gray-500 mt-1 uppercase">
                для работы в электроустановках / электр қондырғыларындағы жұмыс үшін
             </div>
             {isReadonly && <div className="text-xl font-mono font-bold mt-2 text-blue-600">№ 45-2024/Э</div>}
          </div>
        </div>

        {/* Роли */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mb-8">
           <div className="space-y-4">
              <div>
                <label className={labelClasses}>Жұмыс жетекшісі / Руководителю работ:</label>
                <input 
                  className={inputClasses} 
                  placeholder="Ф.И.О. руководителя" 
                  value={formData.workManagerId}
                  onChange={e => updateField('workManagerId', e.target.value)}
                  disabled={isReadonly}
                />
              </div>
              <div>
                <label className={labelClasses}>Жұмыс жүргізуші / Производителю работ:</label>
                <input 
                  className={inputClasses} 
                  placeholder="Ф.И.О. производителя"
                  value={formData.workProducerId}
                  onChange={e => updateField('workProducerId', e.target.value)}
                  disabled={isReadonly}
                />
              </div>
           </div>
           <div className="space-y-4">
              <div>
                <label className={labelClasses}>Рұқсат беруші / Допускающему:</label>
                <input 
                  className={inputClasses} 
                  placeholder="Ф.И.О. допускающего"
                  value={formData.admittingAuthorityId}
                  onChange={e => updateField('admittingAuthorityId', e.target.value)}
                  disabled={isReadonly}
                />
              </div>
              <div>
                <label className={labelClasses}>Бақылаушы / Наблюдающему:</label>
                <input 
                  className={inputClasses} 
                  placeholder="Ф.И.О. (если требуется)"
                  value={formData.observerId}
                  onChange={e => updateField('observerId', e.target.value)}
                  disabled={isReadonly}
                />
              </div>
           </div>
           <div className="md:col-span-2">
              <label className={labelClasses}>Бригада мүшелері / С членами бригады:</label>
              <textarea 
                className={`${inputClasses} h-20 resize-none`} 
                placeholder="Перечислите членов бригады (ФИО, группа по электробезопасности)"
                value={formData.brigadeMembers.join(', ')}
                onChange={e => updateField('brigadeMembers', e.target.value.split(', '))}
                disabled={isReadonly}
              />
           </div>
        </div>

        {/* Задание */}
        <div className="space-y-6 mb-8">
           <div>
              <label className={labelClasses}>Жұмыс санаты / Категория работ:</label>
              {isReadonly ? (
                <div className="p-2 bg-blue-50 rounded font-bold text-blue-800">{formData.workCategory}</div>
              ) : (
                <div className="relative">
                    <select 
                        className={`${selectClasses} cursor-pointer`}
                        value={formData.workCategory}
                        onChange={e => updateField('workCategory', e.target.value)}
                    >
                        <option value="">Выберите категорию...</option>
                        {ELECTRICAL_WORK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-2 text-gray-400 pointer-events-none" size={16} />
                </div>
              )}
           </div>
           <div>
              <label className={labelClasses}>Тапсырма беріледі / Поручается:</label>
              <textarea 
                className={`${inputClasses} h-24 resize-none`}
                placeholder="Описание объема и содержания работ..."
                value={formData.assignment}
                onChange={e => updateField('assignment', e.target.value)}
                disabled={isReadonly}
              />
           </div>
        </div>

        {/* Время */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 bg-slate-50 p-6 rounded-xl border border-slate-100">
           <div className="space-y-4">
              <div className="flex items-center gap-2">
                 <span className="text-xs font-bold uppercase shrink-0">Жұмысты бастау / Начать:</span>
                 <input 
                  type="datetime-local" 
                  className={inputClasses} 
                  value={formData.startDate}
                  onChange={e => updateField('startDate', e.target.value)}
                  disabled={isReadonly}
                 />
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-xs font-bold uppercase shrink-0">Жұмысты аяқтау / Закончить:</span>
                 <input 
                  type="datetime-local" 
                  className={inputClasses} 
                  value={formData.endDate}
                  onChange={e => updateField('endDate', e.target.value)}
                  disabled={isReadonly}
                 />
              </div>
           </div>
           <div>
              <label className="text-xs font-bold uppercase block mb-2">Апат жағдайына дайындық уақыты / Время аварийной готовности:</label>
              <div className="relative">
                <Clock className="absolute left-3 top-3.5 text-slate-400" size={18} />
                <input 
                  type="text" 
                  className={`${inputClasses} pl-10 h-12`} 
                  placeholder="Напр. 30 минут"
                  value={formData.emergencyReadinessTime}
                  onChange={e => updateField('emergencyReadinessTime', e.target.value)}
                  disabled={isReadonly}
                />
              </div>
           </div>
        </div>

        {/* ТАБЛИЦА МЕР БЕЗОПАСНОСТИ */}
        <div className="mb-8">
          <div className={sectionHeader}>
             Жұмыс орындарын дайындау бойынша шаралар / Меры по подготовке рабочих мест
             {!isReadonly && (
               <button 
                onClick={addSafetyMeasure}
                className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-blue-700 transition-colors"
               >
                 <Plus size={14} /> Добавить строку
               </button>
             )}
          </div>
          <div className="overflow-hidden border-2 border-slate-800">
             <table className="w-full text-left border-collapse">
                <thead className="bg-slate-800 text-white text-[10px] uppercase font-black text-center">
                   <tr>
                      <th className="p-3 border-r border-slate-600 w-1/2">
                        Наименования электроустановок, в которых нужно провести отключения и установить заземления
                      </th>
                      <th className="p-3 border-r border-slate-600 w-1/2">
                        Что должно быть отключено и где заземлено
                      </th>
                      {!isReadonly && <th className="p-3 w-10"></th>}
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                   {formData.safetyMeasures.map((measure, idx) => (
                      <tr key={measure.id} className="group">
                         <td className="p-0 border-r border-slate-200">
                            <textarea 
                               className="w-full h-full min-h-[60px] p-3 text-sm outline-none resize-none bg-transparent"
                               value={measure.installationName}
                               onChange={e => {
                                 const updated = formData.safetyMeasures.map(m => m.id === measure.id ? {...m, installationName: e.target.value} : m);
                                 updateField('safetyMeasures', updated);
                               }}
                               disabled={isReadonly}
                               placeholder="..."
                            />
                         </td>
                         <td className="p-0 border-r border-slate-200">
                            <textarea 
                               className="w-full h-full min-h-[60px] p-3 text-sm outline-none resize-none bg-transparent"
                               value={measure.actionRequired}
                               onChange={e => {
                                 const updated = formData.safetyMeasures.map(m => m.id === measure.id ? {...m, actionRequired: e.target.value} : m);
                                 updateField('safetyMeasures', updated);
                               }}
                               disabled={isReadonly}
                               placeholder="..."
                            />
                         </td>
                         {!isReadonly && (
                           <td className="p-2 text-center align-middle">
                             <button 
                              onClick={() => removeSafetyMeasure(measure.id)}
                              className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                             >
                               <Trash2 size={18} />
                             </button>
                           </td>
                         )}
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </div>

        {/* Отдельные указания */}
        <div className="mb-10">
           <label className={labelClasses}>Жеке нұсқаулар / Отдельные указания:</label>
           <textarea 
            className={`${inputClasses} min-h-[80px] mt-2`}
            placeholder="Особые условия производства работ..."
            value={formData.separateInstructions}
            onChange={e => updateField('separateInstructions', e.target.value)}
            disabled={isReadonly}
           />
        </div>

        {/* Блок Выдача, Продление и Допуск */}
        <div className="space-y-6 mb-12 border-t-2 border-slate-800 pt-6">
            
            {/* 1. Наряд выдал */}
            <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-end gap-2 text-sm text-slate-900 font-bold">
                    <span className="uppercase whitespace-nowrap">Нарядты бердім: Күні / Наряд выдал: дата</span>
                    <input type="date" className="border-b border-slate-400 px-2 outline-none w-32 bg-transparent" disabled={isReadonly} />
                    <span className="uppercase whitespace-nowrap">уақыты / время</span>
                    <input type="time" className="border-b border-slate-400 px-2 outline-none w-24 bg-transparent" disabled={isReadonly} />
                </div>
                <div className="flex flex-wrap items-end gap-2 text-sm text-slate-900 font-bold mt-2">
                     <span className="uppercase whitespace-nowrap">Қолы / Подпись</span>
                     <div className="border-b border-slate-400 px-2 w-48 text-gray-400 italic font-normal bg-transparent">{isReadonly ? 'Подписано ЭЦП' : '(ЭЦП)'}</div>
                     <span className="uppercase whitespace-nowrap ml-4">Тегі / Фамилия</span>
                     <input 
                        type="text" 
                        className="border-b border-slate-400 px-2 outline-none flex-1 min-w-[200px] bg-transparent" 
                        value={formData.issuerId}
                        onChange={(e) => updateField('issuerId', e.target.value)}
                        disabled={isReadonly}
                     />
                </div>
            </div>

            {/* 2. Наряд продлил */}
            <div className="flex flex-col gap-2 border-t border-slate-200 pt-4">
                <div className="flex flex-wrap items-end gap-2 text-sm text-slate-900 font-bold">
                    <span className="uppercase whitespace-nowrap">Наряд уақытын создым: Күні / Наряд продлил по: дата</span>
                    <input type="date" className="border-b border-slate-400 px-2 outline-none w-32 bg-transparent" disabled={isReadonly} />
                    <span className="uppercase whitespace-nowrap">уақыты / время</span>
                    <input type="time" className="border-b border-slate-400 px-2 outline-none w-24 bg-transparent" disabled={isReadonly} />
                </div>
                <div className="flex flex-wrap items-end gap-2 text-sm text-slate-900 font-bold mt-2">
                     <span className="uppercase whitespace-nowrap">Қолы / Подпись</span>
                     <div className="border-b border-slate-400 px-2 w-48 text-gray-400 italic font-normal bg-transparent">{isReadonly ? '' : '(ЭЦП)'}</div>
                     <span className="uppercase whitespace-nowrap ml-4">Тегі / Фамилия</span>
                     <input type="text" className="border-b border-slate-400 px-2 outline-none flex-1 min-w-[200px] bg-transparent" disabled={isReadonly} />
                </div>
            </div>

            {/* 3. Таблица разрешения на допуск */}
            <div className="mt-6">
                <div className="text-center font-bold uppercase text-slate-900 mb-2 tracking-wide">
                    Жіберуге рұқсат беру / Разрешение на допуск
                </div>
                <div className="overflow-hidden border border-slate-800">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white text-slate-900 text-[11px] font-bold text-center">
                            <tr>
                                <th className="p-2 border border-slate-800 w-[40%]">
                                    Жұмыс орындарын дайындауға және жұмысқа кірісуге рұқсат алдым <br/>
                                    Разрешение на подготовку рабочих мест и на допуск к работе получил
                                </th>
                                <th className="p-2 border border-slate-800 w-[20%]">
                                    Күні, уақыты <br/> Дата, время
                                </th>
                                <th className="p-2 border border-slate-800 w-[25%]">
                                    Кімнен / От кого <br/> (лауазым, тегі / должность, фамилия)
                                </th>
                                <th className="p-2 border border-slate-800 w-[15%]">
                                    Рұқсат беруші / Допускающий <br/> (қолы / подпись)
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="p-0 border border-slate-800 h-16 bg-gray-50"></td>
                                <td className="p-0 border border-slate-800">
                                    <input type="datetime-local" className="w-full h-full p-2 bg-transparent outline-none text-center text-sm" disabled={isReadonly}/>
                                </td>
                                <td className="p-0 border border-slate-800">
                                    <textarea className="w-full h-full p-2 bg-transparent outline-none resize-none text-sm" disabled={isReadonly}></textarea>
                                </td>
                                <td className="p-0 border border-slate-800 text-center align-middle">
                                     <span className="text-xs text-gray-400 italic">{isReadonly ? 'ЭЦП' : ''}</span>
                                </td>
                            </tr>
                            <tr>
                                <td className="p-0 border border-slate-800 h-16 bg-gray-50"></td>
                                <td className="p-0 border border-slate-800">
                                    <input type="datetime-local" className="w-full h-full p-2 bg-transparent outline-none text-center text-sm" disabled={isReadonly}/>
                                </td>
                                <td className="p-0 border border-slate-800">
                                    <textarea className="w-full h-full p-2 bg-transparent outline-none resize-none text-sm" disabled={isReadonly}></textarea>
                                </td>
                                <td className="p-0 border border-slate-800 text-center align-middle">
                                    <span className="text-xs text-gray-400 italic">{isReadonly ? 'ЭЦП' : ''}</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* --------------------------------------------------------- */}
        {/* ОБОРОТНАЯ СТОРОНА (PAGE 2) - New Request                  */}
        {/* --------------------------------------------------------- */}
        <div className="mt-16 pt-8 border-t-4 border-slate-900 break-before-page">
           <h2 className="text-right text-sm font-bold uppercase mb-6 text-slate-500">Оборотная сторона / 2-бет</h2>

           {/* 1. Preparation Check */}
           <div className="mb-6">
              <label className="font-bold text-slate-900 block mb-2">
                 Жұмыс орындары әзірленді. Кернеу бар жері: / Рабочие места подготовлены. Под напряжением остались:
              </label>
              <textarea 
                 className={`${inputClasses} min-h-[40px] border-b-2`}
                 value={formData.voltageRemainsAt}
                 onChange={(e) => updateField('voltageRemainsAt', e.target.value)}
                 disabled={isReadonly}
              />
           </div>

           {/* 2. Signatures (Pre-work) */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="flex items-end gap-2">
                 <span className="font-bold whitespace-nowrap text-sm uppercase w-48">Рұқсат беруші / Допускающий</span>
                 <div className="border-b border-slate-400 w-full text-center text-xs italic text-gray-400 py-1">
                    {isReadonly ? 'Подписано ЭЦП' : '(қолы / подпись)'}
                 </div>
              </div>
              <div className="flex flex-col">
                 <div className="flex items-end gap-2">
                    <span className="font-bold whitespace-nowrap text-sm uppercase">Жауапты жұмыс жетекшісі / Ответ. руководитель работ</span>
                 </div>
                 <div className="border-b border-slate-400 w-full text-center text-xs italic text-gray-400 py-1 mt-1">
                    {isReadonly ? 'Подписано ЭЦП' : '(қолы / подпись)'}
                 </div>
              </div>
           </div>

           {/* 3. Daily Admission Table */}
           <div className="mb-8">
              <div className="text-center font-bold text-slate-900 mb-1 border-t border-l border-r border-slate-800 p-2 bg-gray-50">
                 Күн сайынғы жұмысқа рұқсаттама және оның аяқталу уақыты / Ежедневный допуск к работе и время ее окончания
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse border border-slate-800">
                    <thead>
                       <tr className="bg-white text-center text-[10px] font-bold">
                          <th rowSpan={2} className="border border-slate-800 p-1 w-1/4">Жұмыс орнының атауы <br/> Наименование рабочего места</th>
                          <th rowSpan={2} className="border border-slate-800 p-1 w-32">Күні, уақыты <br/> Дата, время</th>
                          <th colSpan={2} className="border border-slate-800 p-1">Бригада мақсатты нұсқаулық алды және әзірленген жұмыс орнына баруға рұқсаттама берілді <br/> Бригада получила целевой инструктаж и допущена на подготовленное рабочее место</th>
                          <th colSpan={2} className="border border-slate-800 p-1">Жұмыс аяқталды, бригада шығарылды <br/> Работа закончена, бригада удалена</th>
                       </tr>
                       <tr className="bg-white text-center text-[10px] font-bold">
                          <th className="border border-slate-800 p-1">Қойылатын қолдар / Подписи <br/> (тегі, аты-жөні / фамилия, инициалы) <br/> Рұқсат берушінің / Допускающего</th>
                          <th className="border border-slate-800 p-1">Жұмыс жүргізушінің <br/> (бақылаушының) <br/> Производителя работ (наблюдающего)</th>
                          <th className="border border-slate-800 p-1 w-32">Күні, уақыты <br/> Дата, время</th>
                          <th className="border border-slate-800 p-1">Жұмыс жүргізушінің <br/> (бақылаушының) қолы <br/> Подпись производителя работ (наблюдающего)</th>
                       </tr>
                    </thead>
                    <tbody>
                       {lifecycle.dailyAdmissions.map((da) => (
                         <tr key={da.id} className="text-xs">
                            <td className="border border-slate-800 p-1">
                               <input value={da.workPlace} onChange={e => {
                                  const updated = lifecycle.dailyAdmissions.map(x => x.id === da.id ? {...x, workPlace: e.target.value} : x);
                                  setLifecycle({...lifecycle, dailyAdmissions: updated});
                               }} className="w-full outline-none bg-transparent" placeholder="..." />
                            </td>
                            <td className="border border-slate-800 p-1 text-center font-mono">
                               {new Date(da.admissionDateTime).toLocaleString('ru-RU', {day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit'})}
                            </td>
                            <td className="border border-slate-800 p-1 text-center italic text-gray-400">ЭЦП</td>
                            <td className="border border-slate-800 p-1 text-center italic text-gray-400">ЭЦП</td>
                            <td className="border border-slate-800 p-1 text-center font-mono">
                               {da.finishDateTime ? new Date(da.finishDateTime).toLocaleString('ru-RU', {day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit'}) : ''}
                            </td>
                            <td className="border border-slate-800 p-1 text-center italic text-gray-400">
                               {da.finishDateTime ? 'ЭЦП' : ''}
                            </td>
                         </tr>
                       ))}
                       {/* Empty rows filler */}
                       {[1, 2, 3].map(i => (
                          <tr key={`empty-${i}`} className="h-8">
                             <td className="border border-slate-800"></td>
                             <td className="border border-slate-800"></td>
                             <td className="border border-slate-800"></td>
                             <td className="border border-slate-800"></td>
                             <td className="border border-slate-800"></td>
                             <td className="border border-slate-800"></td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
                 <div className="mt-1 text-right">
                    <button onClick={addDailyAdmission} className="text-xs text-blue-600 hover:underline flex items-center justify-end gap-1 ml-auto">
                       <Plus size={12}/> Добавить запись
                    </button>
                 </div>
              </div>
           </div>

           {/* 4. Brigade Changes Table */}
           <div className="mb-8">
              <div className="text-center font-bold text-slate-900 mb-1 border-t border-l border-r border-slate-800 p-2 bg-gray-50">
                 Бригада құрамындағы өзгерістер / Изменения в составе бригады
              </div>
              <table className="w-full text-left border-collapse border border-slate-800">
                 <thead>
                    <tr className="bg-white text-center text-[10px] font-bold">
                       <th className="border border-slate-800 p-1 w-1/3">Бригада құрамына енгізілді <br/> Введен в состав бригады <br/> (тегі, аты-жөні, тобы / фамилия, инициалы, группа)</th>
                       <th className="border border-slate-800 p-1 w-1/3">Бригада құрамынан шығарылды <br/> Выведен из состава бригады <br/> (тегі, аты-жөні, тобы / фамилия, инициалы, группа)</th>
                       <th className="border border-slate-800 p-1 w-32">Күні, уақыты <br/> Дата, время</th>
                       <th className="border border-slate-800 p-1">Рұқсат бердім / Разрешил <br/> (қолы / подпись) <br/> (тегі, аты-жөні / фамилия, инициалы)</th>
                    </tr>
                 </thead>
                 <tbody>
                    {lifecycle.brigadeChanges.map((change) => (
                       <tr key={change.id} className="text-xs">
                          <td className="border border-slate-800 p-1">
                             <input value={change.introducedMember} onChange={e => {
                                const updated = lifecycle.brigadeChanges.map(x => x.id === change.id ? {...x, introducedMember: e.target.value} : x);
                                setLifecycle({...lifecycle, brigadeChanges: updated});
                             }} className="w-full outline-none bg-transparent" placeholder="..." />
                          </td>
                          <td className="border border-slate-800 p-1">
                             <input value={change.removedMember} onChange={e => {
                                const updated = lifecycle.brigadeChanges.map(x => x.id === change.id ? {...x, removedMember: e.target.value} : x);
                                setLifecycle({...lifecycle, brigadeChanges: updated});
                             }} className="w-full outline-none bg-transparent" placeholder="..." />
                          </td>
                          <td className="border border-slate-800 p-1 text-center font-mono">
                             {new Date(change.dateTime).toLocaleString('ru-RU', {day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit'})}
                          </td>
                          <td className="border border-slate-800 p-1 text-center italic text-gray-400">
                             {change.authorizedBy} (ЭЦП)
                          </td>
                       </tr>
                    ))}
                    {[1, 2].map(i => (
                       <tr key={`empty-brg-${i}`} className="h-8">
                          <td className="border border-slate-800"></td>
                          <td className="border border-slate-800"></td>
                          <td className="border border-slate-800"></td>
                          <td className="border border-slate-800"></td>
                       </tr>
                    ))}
                 </tbody>
              </table>
              <div className="mt-1 text-right">
                 <button onClick={addBrigadeChange} className="text-xs text-blue-600 hover:underline flex items-center justify-end gap-1 ml-auto">
                    <Plus size={12}/> Добавить изменение
                 </button>
              </div>
           </div>

           {/* 5. Target Briefing Registration Table */}
           <div className="mb-8">
              <div className="text-center font-bold text-slate-900 mb-1 border-t border-l border-r border-slate-800 p-2 bg-gray-50">
                 Алғашқы рұқсаттама кезінде мақсатты нұсқаулықты тіркеу / Регистрация целевого инструктажа при первичном допуске
              </div>
              <table className="w-full text-left border-collapse border border-slate-800">
                 <thead>
                    <tr className="bg-white text-center text-[10px] font-bold">
                       <th className="border border-slate-800 p-1 w-1/2">Нұсқаулық өткіздім / Инструктаж провел</th>
                       <th className="border border-slate-800 p-1 w-1/2">Нұсқаулық алдым / Инструктаж получил</th>
                    </tr>
                 </thead>
                 <tbody>
                    {/* Row 1: Issuer -> Responsible Manager */}
                    <tr className="text-xs">
                       <td className="border border-slate-800 p-2 align-top">
                          <div className="font-bold mb-1">Наряд берген тұлға / Лицо, выдавшее наряд</div>
                          <div className="border-b border-gray-300 mb-1 text-center text-gray-600">{formData.issuerId}</div>
                          <div className="text-[9px] text-center text-gray-400">(тегі, аты-жөні / фамилия, инициалы)</div>
                          <div className="border-b border-gray-300 mb-1 mt-2 text-center text-gray-400 italic">ЭЦП</div>
                          <div className="text-[9px] text-center text-gray-400">(қолы / подпись)</div>
                       </td>
                       <td className="border border-slate-800 p-2 align-top">
                          <div className="font-bold mb-1">Жауапты жұмыс жетекшісі (жұмыс жүргізуші, бақылаушы) <br/> Ответ. руководитель работ (производитель работ (наблюдающий))</div>
                          <div className="border-b border-gray-300 mb-1 text-center text-gray-600">{formData.workManagerId}</div>
                          <div className="text-[9px] text-center text-gray-400">(тегі, аты-жөні / фамилия, инициалы)</div>
                          <div className="border-b border-gray-300 mb-1 mt-2 text-center text-gray-400 italic">ЭЦП</div>
                          <div className="text-[9px] text-center text-gray-400">(қолы / подпись)</div>
                       </td>
                    </tr>
                    {/* Row 2: Admitting -> Resp Manager, Members, Producer */}
                    <tr className="text-xs">
                       <td className="border border-slate-800 p-2 align-top">
                          <div className="font-bold mb-1">Рұқсат беруші / Допускающий</div>
                          <div className="border-b border-gray-300 mb-1 text-center text-gray-600">{formData.admittingAuthorityId}</div>
                          <div className="text-[9px] text-center text-gray-400">(тегі, аты-жөні / фамилия, инициалы)</div>
                          <div className="border-b border-gray-300 mb-1 mt-2 text-center text-gray-400 italic">ЭЦП</div>
                          <div className="text-[9px] text-center text-gray-400">(қолы / подпись)</div>
                       </td>
                       <td className="border border-slate-800 p-2 align-top">
                          <div className="font-bold mb-1">Жауапты жұмыс жетекшісі / Ответ. руководитель работ</div>
                          <div className="border-b border-gray-300 h-6 mb-1"></div>
                          <div className="font-bold mb-1 mt-2">Бригада мүшелері / Члены бригады</div>
                           <div className="font-bold mb-1 mt-2">Жұмыс жүргізуші (бақылаушы) / Производитель работ (наблюдающий)</div>
                          <div className="border-b border-gray-300 h-6 mb-1"></div>
                       </td>
                    </tr>
                    {/* Row 3: Signatures for others */}
                    <tr className="text-xs">
                       <td className="border border-slate-800 p-2 align-top">
                          <div className="font-bold mb-1">Жауапты жұмыс жетекшісі <br/> Жұмыс жүргізуші (бақылаушы) <br/> Ответ. руководитель работ производитель работ (наблюдающий)</div>
                          <div className="border-b border-gray-300 mb-1 text-center text-gray-600">{formData.workProducerId}</div>
                          <div className="text-[9px] text-center text-gray-400">(тегі, аты-жөні / фамилия, инициалы)</div>
                          <div className="border-b border-gray-300 mb-1 mt-2 text-center text-gray-400 italic">ЭЦП</div>
                          <div className="text-[9px] text-center text-gray-400">(қолы / подпись)</div>
                       </td>
                       <td className="border border-slate-800 p-2 align-top">
                          <div className="font-bold mb-1">Жұмыс жүргізуші / Производитель работ</div>
                          <div className="border-b border-gray-300 h-6 mb-1"></div>
                          <div className="font-bold mb-1 mt-2">Бригада мүшелері / Члены бригады</div>
                          <ul className="list-disc pl-4 space-y-1">
                             {formData.brigadeMembers.map((m, i) => (
                                <li key={i}>{m} <span className="text-gray-400 italic text-[9px] ml-2">(ЭЦП)</span></li>
                             ))}
                          </ul>
                       </td>
                    </tr>
                 </tbody>
              </table>
           </div>

           {/* 6. Closing Section */}
           <div className="space-y-4 text-sm mb-6">
              <div className="font-bold">
                 Жұмыс толық аяқталды, бригада шығарылды, бригаданың орнатқан жер қосқыштары алынды. <br/>
                 Работа полностью закончена, бригада удалена, заземления, установленные бригадой, сняты.
              </div>
              
              <div className="flex flex-wrap items-end gap-2">
                 <span>Хабарланды / Сообщено (кімге / кому)</span>
                 <input 
                   className="border-b border-black outline-none flex-1 min-w-[200px]"
                   value={lifecycle.notifiedTo || ''}
                   onChange={(e) => {
                      setLifecycle({...lifecycle, notifiedTo: e.target.value});
                      onUpdateLifecycle?.({...lifecycle, notifiedTo: e.target.value});
                   }}
                 />
                 <span>күні / дата</span>
                 <input type="date" className="border-b border-black outline-none" />
                 <span>уақыты / время</span>
                 <input type="time" className="border-b border-black outline-none" />
              </div>

              <div className="mt-6 space-y-4">
                 <div className="flex items-end gap-2">
                    <span className="font-bold w-1/3">Жұмыс жүргізуші (бақылаушы) / Производитель работ (наблюдающий)</span>
                    <div className="border-b border-black flex-1 text-center text-xs italic text-gray-400">ЭЦП</div>
                    <div className="border-b border-black w-1/4 text-center text-xs text-gray-600">{formData.workProducerId}</div>
                 </div>
                 <div className="text-right text-[10px] text-gray-500 -mt-3 pr-[26%]">(қолы / подпись) (тегі, аты-жөні / фамилия, инициалы)</div>

                 <div className="flex items-end gap-2">
                    <span className="font-bold w-1/3">Жауапты жұмыс жетекшісі / Ответственный руководитель работ</span>
                     <div className="border-b border-black flex-1 text-center text-xs italic text-gray-400">ЭЦП</div>
                    <div className="border-b border-black w-1/4 text-center text-xs text-gray-600">{formData.workManagerId}</div>
                 </div>
                 <div className="text-right text-[10px] text-gray-500 -mt-3 pr-[26%]">(қолы / подпись) (тегі, аты-жөні / фамилия, инициалы)</div>

                 <div className="flex items-end gap-2">
                    <span className="font-bold w-1/3">Рұқсат беруші / Допускающий</span>
                     <div className="border-b border-black flex-1 text-center text-xs italic text-gray-400">ЭЦП</div>
                    <div className="border-b border-black w-1/4 text-center text-xs text-gray-600">{formData.admittingAuthorityId}</div>
                 </div>
                 <div className="text-right text-[10px] text-gray-500 -mt-3 pr-[26%]">(қолы / подпись) (тегі, аты-жөні / фамилия, инициалы)</div>
              </div>
           </div>

        </div>

        {/* Футер формы создания (Подписи) */}
        {!isReadonly ? (
          <div className="flex justify-between items-center bg-blue-50 p-6 rounded-2xl border border-blue-100 mt-12">
            <button 
              onClick={onCancel}
              className="px-8 py-3 bg-white border border-slate-300 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-all"
            >
              Отмена
            </button>
            <button 
              onClick={() => onSubmit?.(formData)}
              className="px-10 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-200 flex items-center gap-2 transition-all transform active:scale-95"
            >
              <PenTool size={20} /> Создать наряд и подписать
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-8 border-t pt-8">
             <div className="p-4 bg-green-50 rounded-lg border border-green-100 flex items-center gap-4">
                <CheckCircle2 className="text-green-600" size={32} />
                <div>
                  <div className="text-[10px] uppercase font-bold text-green-600">Наряд выдал (Issuer):</div>
                  <div className="font-bold">{formData.issuerId || 'Александров А.А.'}</div>
                  <div className="text-xs font-mono">{formData.issuerDate} 10:45</div>
                </div>
             </div>
             <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-center italic text-blue-600 text-sm font-medium">
                Наряд-допуск зарегистрирован в реестре
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
