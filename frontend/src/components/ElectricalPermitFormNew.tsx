
import React, { useState } from 'react';
import {
   Plus, Trash2, Zap, Clock, Users, ShieldAlert,
   FileText, Calendar, ChevronDown, CheckCircle2,
   PenTool, Building, AlertTriangle, Lock, ShieldCheck,
   ArrowLeft, UserPlus, UserMinus, ClipboardList, FileCheck
} from 'lucide-react';
import {
   ElectricalFormData,
   ElectricalSafetyMeasure,
   ElectricalPermitExtension,
   ELECTRICAL_WORK_CATEGORIES,
   ElectricalLifecycle,
   DailyAdmission,
   BrigadeChange,
   RiskTableRow,
   RiskGroupMember
} from '../types';
import { IsolationMatrixForm } from './IsolationMatrixForm';
import { RiskAssessmentWidget } from './RiskAssessmentWidget';


interface Props {
   mode: 'create' | 'execution';
   initialData?: ElectricalFormData;
   initialLifecycle?: ElectricalLifecycle;
   onSubmit?: (data: ElectricalFormData) => void;
   onUpdateLifecycle?: (lifecycle: ElectricalLifecycle) => void;
   onCancel?: () => void;
}

type TabKey = 'main' | 'backside' | 'lifecycle' | 'risks' | 'loto';

const TabButton: React.FC<{ id: TabKey, label: string, icon: any, active: boolean, onClick: (id: TabKey) => void }> = ({ id, label, icon: Icon, active, onClick }) => (
   <button
      onClick={() => onClick(id)}
      className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all text-base ${active
         ? 'border-blue-200 bg-blue-50 text-blue-700 font-bold shadow-sm'
         : 'border-transparent bg-transparent text-gray-500 hover:bg-gray-50'
         }`}
   >
      <Icon size={20} className={active ? "text-blue-600" : "text-gray-400"} />
      <span>{label}</span>
   </button>
);

export const ElectricalPermitFormNew: React.FC<Props> = ({
   mode,
   initialData,
   initialLifecycle,
   onSubmit,
   onUpdateLifecycle,
   onCancel
}) => {
   const isReadonly = mode === 'execution';
   const [activeTab, setActiveTab] = useState<TabKey>(mode === 'execution' ? 'lifecycle' : 'main');

   // Step navigation for create mode (4 steps: main, backside, risks, loto)
   const createModeSteps: TabKey[] = ['main', 'backside', 'risks', 'loto'];
   const currentStepIndex = createModeSteps.indexOf(activeTab);
   const totalSteps = 4;
   const currentStep = currentStepIndex >= 0 ? currentStepIndex + 1 : 1;

   const goToNextStep = () => {
      if (currentStepIndex < createModeSteps.length - 1) {
         setActiveTab(createModeSteps[currentStepIndex + 1]);
      } else {
         // Last step - submit
         onSubmit?.(formData);
      }
   };

   const goToPrevStep = () => {
      if (currentStepIndex > 0) {
         setActiveTab(createModeSteps[currentStepIndex - 1]);
      } else {
         onCancel?.();
      }
   };

   // --- State Management ---
   const [formData, setFormData] = useState<ElectricalFormData>(initialData || {
      organization: '«КБМ» АҚ (АО «КБМ»)',
      department: 'Электр цехы (Электроцех)',
      workManagerId: '',
      workManagerGroup: '',
      admittingAuthorityId: '',
      admittingAuthorityGroup: '',
      workProducerId: '',
      workProducerGroup: '',
      observerId: '',
      observerGroup: '',
      brigadeMembers: [{ name: '', group: '' }],
      workCategory: '',
      assignment: '',
      startDate: '',
      endDate: '',
      emergencyReadinessTime: '',
      safetyMeasures: [{ id: '1', installationName: '', actionRequired: '' }],
      separateInstructions: '',
      issuerId: '',
      issuerDate: new Date().toISOString().split('T')[0],
      issuerTime: '',
      issuerLastName: '',
      extensions: [],
      voltageRemainsAt: '',
      riskTable: [],
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
         checkResidualEnergy: false,
         checkLockDevice: false,
         checkPadlock: false,
         checkTag: false
      }
   });

   const [lifecycle, setLifecycle] = useState<ElectricalLifecycle>(initialLifecycle || {
      dailyAdmissions: [],
      brigadeChanges: [],
      briefingLogs: []
   });

   const [isContractorOrg, setIsContractorOrg] = useState(false);
   const [isContractorDept, setIsContractorDept] = useState(false);

   // Risk assessment participants state
   const [riskIdentifiedBy, setRiskIdentifiedBy] = useState('');
   const [riskGroup, setRiskGroup] = useState<RiskGroupMember[]>([]);

   const addRiskGroupMember = () => {
      const newMember: RiskGroupMember = {
         id: Date.now().toString(),
         name: '',
         position: ''
      };
      setRiskGroup(prev => [...prev, newMember]);
   };

   const removeRiskGroupMember = (id: string) => {
      setRiskGroup(prev => prev.filter(m => m.id !== id));
   };

   const updateRiskGroupMember = (id: string, field: keyof RiskGroupMember, value: string) => {
      setRiskGroup(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
   };

   const updateField = (field: keyof ElectricalFormData, value: any) => {
      if (isReadonly) return;
      setFormData(prev => ({ ...prev, [field]: value }));
   };

   const updateLifecycle = (updater: (prev: ElectricalLifecycle) => ElectricalLifecycle) => {
      const next = updater(lifecycle);
      setLifecycle(next);
      onUpdateLifecycle?.(next);
   };

   // Updated Input Classes: Filled Gray Background, White on Focus
   const inputClasses = `w-full bg-[#F1F5F9] border-b-2 border-slate-300 px-3 py-2 text-3xl outline-none transition-all rounded-t-sm ${isReadonly
      ? 'bg-transparent border-transparent font-bold px-0'
      : 'hover:bg-[#E2E8F0] focus:bg-white focus:border-blue-600 focus:shadow-md'
      }`;

   const renderMainTab = () => (
      <div className="space-y-6 animate-in fade-in duration-300">

         {/* Section 1: General Information */}
         <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                     <FileText size={20} className="text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Общая информация</h3>
               </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Организация</label>
                  <div className="relative">
                     <select
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none transition-all"
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
                        disabled={isReadonly}
                     >
                        <option value="«КБМ» АҚ (АО «КБМ»)">АО «Каражанбасмунай»</option>
                        <option value="CONTRACTOR">Подрядная организация</option>
                     </select>
                     <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                  </div>
                  {isContractorOrg && !isReadonly && (
                     <input
                        className="mt-2 w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Введите название организации..."
                        value={formData.organization}
                        onChange={e => updateField('organization', e.target.value)}
                        autoFocus
                     />
                  )}
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Подразделение</label>
                  <div className="relative">
                     <select
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none transition-all"
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
                        disabled={isReadonly}
                     >
                        <option value="Электр цехы (Электроцех)">Электроцех</option>
                        <option value="Мұнай өндіру цехы (ЦДН)">ЦДН</option>
                        <option value="CONTRACTOR">Другое</option>
                     </select>
                     <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                  </div>
                  {isContractorDept && !isReadonly && (
                     <input
                        className="mt-2 w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Введите название подразделения..."
                        value={formData.department}
                        onChange={e => updateField('department', e.target.value)}
                        autoFocus
                     />
                  )}
               </div>
            </div>
         </div>

         {/* Section 2: Responsible Persons */}
         <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                     <Users size={20} className="text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Ответственные лица</h3>
               </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Жұмыс жетекшісі / Руководителю работ</label>
                  <div className="flex gap-2">
                     <input
                        className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Ф.И.О."
                        value={formData.workManagerId}
                        onChange={e => updateField('workManagerId', e.target.value)}
                        disabled={isReadonly}
                     />
                     <select
                        className="w-20 bg-white border border-gray-300 rounded-lg px-2 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        value={formData.workManagerGroup || ''}
                        onChange={e => updateField('workManagerGroup', e.target.value)}
                        disabled={isReadonly}
                     >
                        <option value="">Гр.</option>
                        <option value="1">I</option>
                        <option value="2">II</option>
                        <option value="3">III</option>
                        <option value="4">IV</option>
                        <option value="5">V</option>
                     </select>
                  </div>
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Рұқсат беруші / Допускающему</label>
                  <div className="flex gap-2">
                     <input
                        className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Ф.И.О."
                        value={formData.admittingAuthorityId}
                        onChange={e => updateField('admittingAuthorityId', e.target.value)}
                        disabled={isReadonly}
                     />
                     <select
                        className="w-20 bg-white border border-gray-300 rounded-lg px-2 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        value={formData.admittingAuthorityGroup || ''}
                        onChange={e => updateField('admittingAuthorityGroup', e.target.value)}
                        disabled={isReadonly}
                     >
                        <option value="">Гр.</option>
                        <option value="1">I</option>
                        <option value="2">II</option>
                        <option value="3">III</option>
                        <option value="4">IV</option>
                        <option value="5">V</option>
                     </select>
                  </div>
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Жұмыс жүргізуші / Производителю работ</label>
                  <div className="flex gap-2">
                     <input
                        className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Ф.И.О."
                        value={formData.workProducerId}
                        onChange={e => updateField('workProducerId', e.target.value)}
                        disabled={isReadonly}
                     />
                     <select
                        className="w-20 bg-white border border-gray-300 rounded-lg px-2 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        value={formData.workProducerGroup || ''}
                        onChange={e => updateField('workProducerGroup', e.target.value)}
                        disabled={isReadonly}
                     >
                        <option value="">Гр.</option>
                        <option value="1">I</option>
                        <option value="2">II</option>
                        <option value="3">III</option>
                        <option value="4">IV</option>
                        <option value="5">V</option>
                     </select>
                  </div>
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Бақылаушы / Наблюдающему</label>
                  <div className="flex gap-2">
                     <input
                        className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Ф.И.О. (если требуется)"
                        value={formData.observerId}
                        onChange={e => updateField('observerId', e.target.value)}
                        disabled={isReadonly}
                     />
                     <select
                        className="w-20 bg-white border border-gray-300 rounded-lg px-2 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        value={formData.observerGroup || ''}
                        onChange={e => updateField('observerGroup', e.target.value)}
                        disabled={isReadonly}
                     >
                        <option value="">Гр.</option>
                        <option value="1">I</option>
                        <option value="2">II</option>
                        <option value="3">III</option>
                        <option value="4">IV</option>
                        <option value="5">V</option>
                     </select>
                  </div>
               </div>

               {/* Brigade Members */}
               <div className="md:col-span-2 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-3">
                     <label className="block text-sm font-medium text-gray-600">Бригада мүшелері / С членами бригады</label>
                     {!isReadonly && (
                        <button
                           onClick={() => updateField('brigadeMembers', [...(formData.brigadeMembers || []), { name: '', group: '' }])}
                           className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                           <Plus size={16} /> Добавить члена
                        </button>
                     )}
                  </div>
                  <div className="space-y-2">
                     {(formData.brigadeMembers || []).map((member, index) => {
                        // Support both old string format and new object format
                        const memberObj = typeof member === 'string' ? { name: member, group: '' } : member;
                        return (
                           <div key={index} className="flex gap-2 items-center">
                              <span className="text-xs text-gray-400 w-6">{index + 1}.</span>
                              <input
                                 className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                 placeholder="Ф.И.О."
                                 value={memberObj.name || ''}
                                 onChange={e => {
                                    const updated = [...(formData.brigadeMembers || [])];
                                    updated[index] = { ...memberObj, name: e.target.value };
                                    updateField('brigadeMembers', updated);
                                 }}
                                 disabled={isReadonly}
                              />
                              <input
                                 className="w-72 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                 placeholder="Группа по электробезопасности"
                                 value={memberObj.group || ''}
                                 onChange={e => {
                                    const updated = [...(formData.brigadeMembers || [])];
                                    updated[index] = { ...memberObj, group: e.target.value };
                                    updateField('brigadeMembers', updated);
                                 }}
                                 disabled={isReadonly}
                              />
                              {!isReadonly && (
                                 <button
                                    onClick={() => {
                                       const updated = (formData.brigadeMembers || []).filter((_, i) => i !== index);
                                       updateField('brigadeMembers', updated);
                                    }}
                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                 >
                                    <Trash2 size={16} />
                                 </button>
                              )}
                           </div>
                        );
                     })}
                     {(formData.brigadeMembers || []).length === 0 && (
                        <p className="text-gray-400 text-sm italic">Нажмите "Добавить члена" чтобы добавить членов бригады</p>
                     )}
                  </div>
               </div>
            </div>
         </div>

         {/* Section 3: Work Details */}
         <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                     <Zap size={20} className="text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Содержание работ</h3>
               </div>
            </div>
            <div className="p-6 space-y-6">
               <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Жұмыс санаты / Категория работ</label>
                  <div className="relative">
                     <select
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none transition-all"
                        value={formData.workCategory}
                        onChange={e => updateField('workCategory', e.target.value)}
                        disabled={isReadonly}
                     >
                        <option value="">Выберите категорию...</option>
                        {ELECTRICAL_WORK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                     </select>
                     <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                  </div>
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Тапсырма беріледі / Поручается</label>
                  <textarea
                     className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all min-h-[120px] resize-none"
                     placeholder="Опишите объем и содержание работ..."
                     value={formData.assignment}
                     onChange={e => updateField('assignment', e.target.value)}
                     disabled={isReadonly}
                  />
               </div>
            </div>
         </div>

         {/* Section 4: Schedule */}
         <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                     <Clock size={20} className="text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Сроки выполнения</h3>
               </div>
            </div>
            <div className="p-6 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-600 mb-2">Жұмысты бастау: Күні / Работу начать: дата</label>
                     <input
                        type="date"
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        value={formData.startDate?.split('T')[0] || ''}
                        onChange={e => {
                           const time = formData.startDate?.split('T')[1] || '08:00';
                           updateField('startDate', e.target.value + 'T' + time);
                        }}
                        disabled={isReadonly}
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-600 mb-2">уақыты / время</label>
                     <input
                        type="time"
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        value={formData.startDate?.split('T')[1] || ''}
                        onChange={e => {
                           const date = formData.startDate?.split('T')[0] || new Date().toISOString().split('T')[0];
                           updateField('startDate', date + 'T' + e.target.value);
                        }}
                        disabled={isReadonly}
                     />
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-600 mb-2">Жұмысты аяқтау: Күні / Работу закончить: дата</label>
                     <input
                        type="date"
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        value={formData.endDate?.split('T')[0] || ''}
                        onChange={e => {
                           const time = formData.endDate?.split('T')[1] || '17:00';
                           updateField('endDate', e.target.value + 'T' + time);
                        }}
                        disabled={isReadonly}
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-600 mb-2">уақыты / время</label>
                     <input
                        type="time"
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        value={formData.endDate?.split('T')[1] || ''}
                        onChange={e => {
                           const date = formData.endDate?.split('T')[0] || new Date().toISOString().split('T')[0];
                           updateField('endDate', date + 'T' + e.target.value);
                        }}
                        disabled={isReadonly}
                     />
                  </div>
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Апат жағдайына дайындық уақыты / Время аварийной готовности</label>
                  <input
                     className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                     placeholder="Напр. 30 минут"
                     value={formData.emergencyReadinessTime}
                     onChange={e => updateField('emergencyReadinessTime', e.target.value)}
                     disabled={isReadonly}
                  />
               </div>
            </div>
         </div>

         {/* Section 5: Safety Measures */}
         <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                     <ShieldAlert size={20} className="text-red-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Меры по подготовке рабочих мест</h3>
               </div>
               {!isReadonly && (
                  <button
                     onClick={() => updateField('safetyMeasures', [...(formData.safetyMeasures || []), { id: Date.now().toString(), installationName: '', actionRequired: '' }])}
                     className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                     <Plus size={16} /> Добавить
                  </button>
               )}
            </div>
            <div className="p-6">
               <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full">
                     <thead className="bg-gray-50">
                        <tr>
                           <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b border-gray-200">Наименование электроустановки</th>
                           <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b border-gray-200">Что должно быть отключено/заземлено</th>
                           {!isReadonly && <th className="px-4 py-3 w-12 border-b border-gray-200"></th>}
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {(formData.safetyMeasures || []).map((measure) => (
                           <tr key={measure.id} className="hover:bg-gray-50/50">
                              <td className="p-3">
                                 <textarea
                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all min-h-[80px] resize-none text-sm"
                                    value={measure.installationName}
                                    onChange={e => {
                                       const updated = (formData.safetyMeasures || []).map(m => m.id === measure.id ? { ...m, installationName: e.target.value } : m);
                                       updateField('safetyMeasures', updated);
                                    }}
                                    disabled={isReadonly}
                                    placeholder="Укажите наименование..."
                                 />
                              </td>
                              <td className="p-3">
                                 <textarea
                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all min-h-[80px] resize-none text-sm"
                                    value={measure.actionRequired}
                                    onChange={e => {
                                       const updated = (formData.safetyMeasures || []).map(m => m.id === measure.id ? { ...m, actionRequired: e.target.value } : m);
                                       updateField('safetyMeasures', updated);
                                    }}
                                    disabled={isReadonly}
                                    placeholder="Укажите действия..."
                                 />
                              </td>
                              {!isReadonly && (
                                 <td className="p-3 text-center">
                                    <button
                                       onClick={() => updateField('safetyMeasures', (formData.safetyMeasures || []).filter(m => m.id !== measure.id))}
                                       className="text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                       <Trash2 size={18} />
                                    </button>
                                 </td>
                              )}
                           </tr>
                        ))}
                        {(formData.safetyMeasures || []).length === 0 && (
                           <tr>
                              <td colSpan={3} className="px-4 py-8 text-center text-gray-400 text-sm">
                                 Нажмите "Добавить" чтобы добавить меры безопасности
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
          </div>

          {/* Section: Отдельные указания и средства защиты */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-cyan-100 rounded-lg">
                      <ClipboardList size={20} className="text-cyan-600" />
                   </div>
                   <h3 className="font-semibold text-gray-900">Жеке нұсқаулар / Отдельные указания</h3>
                </div>
             </div>
             <div className="p-6 space-y-4">
                <div>
                   <textarea
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all min-h-[80px] resize-none"
                      placeholder="Введите отдельные указания..."
                      value={formData.separateInstructions || ''}
                      onChange={e => updateField('separateInstructions', e.target.value)}
                      disabled={isReadonly}
                   />
                </div>

             </div>
          </div>

          {/* Section: Наряд выдал */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-teal-100 rounded-lg">
                      <PenTool size={20} className="text-teal-600" />
                   </div>
                   <h3 className="font-semibold text-gray-900">Нарядты бердім / Наряд выдал</h3>
                </div>
             </div>
             <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Күні / Дата</label>
                      <input
                         type="date"
                         className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                         value={formData.issuerDate}
                         onChange={e => updateField('issuerDate', e.target.value)}
                         disabled={isReadonly}
                      />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Уақыты / Время</label>
                      <input
                         type="time"
                         className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                         value={formData.issuerTime || ''}
                         onChange={e => updateField('issuerTime', e.target.value)}
                         disabled={isReadonly}
                      />
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Қолы / Подпись</label>
                      <input
                         className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                         placeholder="Подпись"
                         value={formData.issuerId || ''}
                         onChange={e => updateField('issuerId', e.target.value)}
                         disabled={isReadonly}
                      />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Тегі / Фамилия</label>
                      <input
                         className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                         placeholder="Фамилия"
                         value={formData.issuerLastName || ''}
                         onChange={e => updateField('issuerLastName', e.target.value)}
                         disabled={isReadonly}
                      />
                   </div>
                </div>
             </div>
          </div>

          {/* Section: Наряд продлил / Наряд уақытын создым */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-orange-100 rounded-lg">
                      <Clock size={20} className="text-orange-600" />
                   </div>
                   <h3 className="font-semibold text-gray-900">Наряд уақытын создым / Наряд продлил</h3>
                </div>
                {!isReadonly && (
                   <button
                      onClick={() => updateField('extensions', [...(formData.extensions || []), { id: Date.now().toString(), extensionDate: '', extensionTime: '', extensionSignature: '', extensionLastName: '' }])}
                      className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                   >
                      <Plus size={16} /> Добавить продление
                   </button>
                )}
             </div>
             <div className="p-6">
                {(formData.extensions || []).length === 0 ? (
                   <p className="text-gray-400 text-sm italic text-center py-4">Нет записей о продлении наряда</p>
                ) : (
                   <div className="space-y-4">
                      {(formData.extensions || []).map((ext, index) => (
                         <div key={ext.id} className="border border-gray-200 rounded-xl p-4 relative">
                            {!isReadonly && (
                               <button
                                  onClick={() => {
                                     const updated = (formData.extensions || []).filter((_, i) => i !== index);
                                     updateField('extensions', updated);
                                  }}
                                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
                               >
                                  <Trash2 size={16} />
                               </button>
                            )}
                            <div className="text-xs font-medium text-gray-400 mb-3">Продление {index + 1}</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                               <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Күні / Дата</label>
                                  <input
                                     type="date"
                                     className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                     value={ext.extensionDate}
                                     onChange={e => {
                                        const updated = [...(formData.extensions || [])];
                                        updated[index] = { ...ext, extensionDate: e.target.value };
                                        updateField('extensions', updated);
                                     }}
                                     disabled={isReadonly}
                                  />
                               </div>
                               <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Уақыты / Время</label>
                                  <input
                                     type="time"
                                     className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                     value={ext.extensionTime}
                                     onChange={e => {
                                        const updated = [...(formData.extensions || [])];
                                        updated[index] = { ...ext, extensionTime: e.target.value };
                                        updateField('extensions', updated);
                                     }}
                                     disabled={isReadonly}
                                  />
                               </div>
                               <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Қолы / Подпись</label>
                                  <input
                                     className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                     placeholder="Подпись"
                                     value={ext.extensionSignature}
                                     onChange={e => {
                                        const updated = [...(formData.extensions || [])];
                                        updated[index] = { ...ext, extensionSignature: e.target.value };
                                        updateField('extensions', updated);
                                     }}
                                     disabled={isReadonly}
                                  />
                               </div>
                               <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Тегі / Фамилия</label>
                                  <input
                                     className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                     placeholder="Фамилия"
                                     value={ext.extensionLastName}
                                     onChange={e => {
                                        const updated = [...(formData.extensions || [])];
                                        updated[index] = { ...ext, extensionLastName: e.target.value };
                                        updateField('extensions', updated);
                                     }}
                                     disabled={isReadonly}
                                  />
                               </div>
                            </div>
                         </div>
                      ))}
                   </div>
                )}
             </div>
          </div>

          {/* Section 6: Admission Permission - Жіберуге рұқсат беру / Разрешение на допуск */}
         <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                     <FileCheck size={20} className="text-indigo-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Жіберуге рұқсат беру / Разрешение на допуск</h3>
               </div>
            </div>
            <div className="p-6 space-y-6">
               {/* Permission Table */}
               <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full">
                     <thead className="bg-gray-50">
                        <tr>
                           <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b border-r border-gray-200">
                              <div className="text-xs leading-relaxed">
                                 <strong>Жұмыс орындарын дайындауға және жұмысқа кірісуге рұқсат алдым</strong>
                                 <br />
                                 <span className="text-gray-500">Разрешение на подготовку рабочих мест и на допуск к работе получил</span>
                              </div>
                           </th>
                           <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 border-b border-r border-gray-200 w-40">
                              <div className="text-xs">Күні, уақыты<br /><span className="text-gray-500">Дата, время</span></div>
                           </th>
                           <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 border-b border-r border-gray-200 w-48">
                              <div className="text-xs">Кімнен / От кого<br /><span className="text-gray-500">дауазым, тегі / должность, фамилия</span></div>
                           </th>
                           <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 border-b border-gray-200 w-32">
                              <div className="text-xs">Рұқсат беруші<br /><span className="text-gray-500">/Допускающий</span><br /><span className="text-gray-400">(қолы/подпись)</span></div>
                           </th>
                        </tr>
                     </thead>
                     <tbody>
                        <tr className="hover:bg-gray-50/50">
                           <td className="p-3 border-r border-gray-200"></td>
                           <td className="p-3 border-r border-gray-200">
                              <input
                                 type="datetime-local"
                                 className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                 value={formData.admissionDateTime || ''}
                                 onChange={e => updateField('admissionDateTime', e.target.value)}
                                 disabled={isReadonly}
                              />
                           </td>
                           <td className="p-3 border-r border-gray-200">
                              <input
                                 className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                 placeholder="Должность, Ф.И.О."
                                 value={formData.admissionFromWhom || ''}
                                 onChange={e => updateField('admissionFromWhom', e.target.value)}
                                 disabled={isReadonly}
                              />
                           </td>
                           <td className="p-3 text-center">
                              <input
                                 className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                                 placeholder="Подпись"
                                 value={formData.admissionSignature || ''}
                                 onChange={e => updateField('admissionSignature', e.target.value)}
                                 disabled={isReadonly}
                              />
                           </td>
                        </tr>
                     </tbody>
                  </table>
               </div>


               {/* Signatures */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                  <div>
                     <label className="block text-sm font-medium text-gray-600 mb-2">Рұқсат беруші / Допускающий</label>
                     <div className="flex gap-2 items-center">
                        <input
                           className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                           placeholder="Ф.И.О."
                           value={formData.admissionPermitSigner || ''}
                           onChange={e => updateField('admissionPermitSigner', e.target.value)}
                           disabled={isReadonly}
                        />
                        <span className="text-xs text-gray-400">(қолы)</span>
                     </div>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-600 mb-2">
                        <span className="text-xs">Жауапты жұмыс жетекшісі (жұмыс жүргізуші немесе бақылаушы)</span>
                        <br />
                        <span className="text-xs text-gray-500">Отв. руководитель работ (производитель работ или наблюдающий)</span>
                     </label>
                     <div className="flex gap-2 items-center">
                        <input
                           className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                           placeholder="Ф.И.О."
                           value={formData.responsibleWorkManagerSigner || ''}
                           onChange={e => updateField('responsibleWorkManagerSigner', e.target.value)}
                           disabled={isReadonly}
                        />
                        <span className="text-xs text-gray-400">(қолы)</span>
                     </div>
                  </div>
               </div>
            </div>
         </div>

      </div>
   );


   const renderLifecycleTab = () => (
      <div className="space-y-12 font-['PT_Sans'] animate-in fade-in duration-500 pb-20">

         {/* Voltage/Workplace Ready - first on reverse side */}
         <section className="bg-white p-8 rounded-2xl border-2 border-slate-900 shadow-sm">
            <h3 className="text-sm font-black uppercase text-slate-800 mb-6 flex items-center gap-3">
               <Zap size={20} className="text-blue-600" />
               Жұмыс орындары әзірленді. Кернеу бар жері: / Рабочие места подготовлены. Под напряжением остались:
            </h3>
            <textarea
               className="w-full border-b-2 border-slate-200 py-4 text-lg font-bold outline-none focus:border-blue-600 resize-none min-h-[100px] leading-relaxed"
               placeholder="Укажите токопроводящие части под напряжением..."
               value={formData.voltageRemainsAt}
               onChange={e => updateField('voltageRemainsAt', e.target.value)}
               disabled={!isReadonly && activeTab !== 'lifecycle'}
            />

            <div className="grid grid-cols-2 gap-12 mt-8 pt-8 border-t border-slate-100">
               <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-black uppercase text-slate-400">Рұқсат беруші / Допускающий</span>
                  <div className="flex items-end gap-3">
                     <div className="flex-1 border-b border-slate-900 text-sm font-bold pb-1">{formData.admittingAuthorityId}</div>
                     <div className="text-[10px] italic text-blue-600 font-bold">ПОДПИСАНО ЭЦП</div>
                  </div>
               </div>
               <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-black uppercase text-slate-400">Жауапты жұмыс жетекшісі / Ответ. руководитель работ</span>
                  <div className="flex items-end gap-3">
                     <div className="flex-1 border-b border-slate-900 text-sm font-bold pb-1">{formData.workManagerId}</div>
                     <div className="text-[10px] italic text-blue-600 font-bold">ПОДПИСАНО ЭЦП</div>
                  </div>
               </div>
            </div>
         </section>

         {/* Backside Header */}
         <div className="bg-slate-900 text-white p-10 rounded-3xl shadow-xl flex justify-between items-center mb-12">
            <div className="space-y-2">
               <h2 className="text-3xl font-black italic tracking-tighter">ОБОРОТНАЯ СТОРОНА / 2-БЕТ</h2>
               <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Жұмыс барысын бақылау және допуск журналы</p>
            </div>
            <div className="text-right">
               <div className="text-4xl font-black text-blue-400">№ 45-2024/Э</div>
            </div>
         </div>

         {/* Daily Admission Table (Screenshot 3) */}
         <section className="space-y-4">
            <div className="flex justify-between items-center">
               <h3 className="text-sm font-black uppercase text-slate-800 tracking-tight flex items-center gap-3">
                  <Calendar size={20} className="text-blue-600" />
                  Күн сайынғы жұмысқа рұқсаттама және оның аяқталу уақыты / Ежедневный допуск к работе и время ее окончания
               </h3>
               <button onClick={() => updateLifecycle(prev => ({ ...prev, dailyAdmissions: [...prev.dailyAdmissions, { id: Date.now().toString(), workPlace: '', admissionDateTime: new Date().toISOString(), admittingSignature: 'DIGITAL', producerSignature: 'DIGITAL', finishDateTime: '', producerFinishSignature: '' }] }))} className="bg-emerald-600 text-white text-[10px] px-4 py-2 rounded-full font-black uppercase tracking-widest shadow-lg shadow-emerald-100 hover:scale-105 transition-all">
                  + Добавить запись
               </button>
            </div>
            <div className="border-[2px] border-slate-900 overflow-hidden shadow-sm">
               <table className="w-full text-[10px] text-center border-collapse">
                  <thead className="bg-slate-50 font-black">
                     <tr>
                        <th className="p-4 border border-slate-900 w-[20%]">Жұмыс орнының атауы / Наименование рабочего места</th>
                        <th className="p-4 border border-slate-900 w-[12%]">Күні, уақыты / Дата, время</th>
                        <th className="p-4 border border-slate-900 w-[25%] leading-tight">Бригада мақсатты нұсқаулық алды және әзірленген жұмыс орнына баруға рұқсаттама берілді / Бригада получила целевой инструктаж и допущена на подготовленное рабочее место</th>
                        <th className="p-4 border border-slate-900 w-[18%]">Жұмыс аяқталды, бригада шығарылды / Работа закончена, бригада удалена</th>
                        <th className="p-4 border border-slate-900 w-[12%]">Күні, уақыты / Дата, время</th>
                        <th className="p-4 border border-slate-900 w-[13%]">Жұмыс жүргізушінің қолы / Подпись производителя работ</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                     {(lifecycle.dailyAdmissions || []).map((adm) => (
                        <tr key={adm.id} className="h-16">
                           <td className="border border-slate-900 px-3"><input className="w-full bg-transparent text-center font-bold outline-none" defaultValue={adm.workPlace} /></td>
                           <td className="border border-slate-900 px-3 font-mono font-bold">{new Date(adm.admissionDateTime).toLocaleString()}</td>
                           <td className="border border-slate-900 px-3">
                              <div className="flex flex-col gap-1 text-[9px] text-blue-600 font-bold italic">
                                 <span>ЭЦП Допускающего</span>
                                 <span>ЭЦП Производителя</span>
                              </div>
                           </td>
                           <td className="border border-slate-900 font-bold text-slate-400">В процессе...</td>
                           <td className="border border-slate-900"></td>
                           <td className="border border-slate-900"></td>
                        </tr>
                     ))}
                     {(lifecycle.dailyAdmissions || []).length === 0 && <tr className="h-20"><td colSpan={6} className="text-slate-300 italic font-bold">Записи отсутствуют</td></tr>}
                  </tbody>
               </table>
            </div>
         </section>

         {/* Brigade Changes (Screenshot 3) */}
         <section className="space-y-4">
            <div className="flex justify-between items-center">
               <h3 className="text-sm font-black uppercase text-slate-800 flex items-center gap-3">
                  <Users size={20} className="text-blue-600" />
                  Бригада құрамындағы өзгерістер / Изменения в составе бригады
               </h3>
                <button onClick={() => updateLifecycle(prev => ({ ...prev, brigadeChanges: [...prev.brigadeChanges, { id: Date.now().toString(), introducedMember: '', introducedMemberGroup: '', removedMember: '', removedMemberGroup: '', dateTime: new Date().toISOString(), authorizedBy: '' }] }))} className="bg-slate-800 text-white text-[10px] px-4 py-2 rounded-full font-black uppercase tracking-widest hover:bg-slate-900 transition-all">
                  + Добавить изменение
               </button>
            </div>
            <div className="border-[2px] border-slate-900 overflow-hidden shadow-sm">
               <table className="w-full text-[10px] text-center border-collapse">
                  <thead className="bg-slate-50 font-black">
                     <tr>
                        <th className="p-4 border border-slate-900 w-[30%] leading-tight">Бригада құрамына енгізілді / Введен в состав бригады (тегі, аты-жөні, тобы)</th>
                        <th className="p-4 border border-slate-900 w-[30%] leading-tight">Бригада құрамынан шығарылды / Выведен из состава бригады (тегі, аты-жөні, тобы)</th>
                        <th className="p-4 border border-slate-900 w-[15%]">Күні, уақыты / Дата, время</th>
                        <th className="p-4 border border-slate-900 w-[25%] leading-tight">Рұқсат бердім / Разрешил (қолы / подпись) (тегі, аты-жөні, инициалы)</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                      {(lifecycle.brigadeChanges || []).map(change => (
                         <tr key={change.id} className="h-14">
                            <td className="border border-slate-900 px-3">
                               <div className="flex gap-1 items-center justify-center">
                                  <input className="w-full bg-transparent text-center font-bold outline-none" defaultValue={change.introducedMember} />
                                  {change.introducedMemberGroup && <span className="text-[8px] font-black text-blue-600">({change.introducedMemberGroup} гр.)</span>}
                               </div>
                            </td>
                            <td className="border border-slate-900 px-3">
                               <div className="flex gap-1 items-center justify-center">
                                  <input className="w-full bg-transparent text-center font-bold outline-none" defaultValue={change.removedMember} />
                                  {change.removedMemberGroup && <span className="text-[8px] font-black text-blue-600">({change.removedMemberGroup} гр.)</span>}
                               </div>
                            </td>
                           <td className="border border-slate-900 px-3 font-mono font-bold">{new Date(change.dateTime).toLocaleString()}</td>
                           <td className="border border-slate-900 font-bold italic text-blue-600">ЭЦП Руководителя</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </section>

         {/* Target Briefing Registration (Screenshot 4) */}
         <section className="bg-white p-10 rounded-3xl border-2 border-slate-100 shadow-2xl space-y-8">
            <h3 className="text-xl font-black uppercase text-center border-b-4 border-blue-600 pb-4 w-fit mx-auto">
               Алғашқы рұқсаттама кезінде мақсатты нұсқаулықты тіркеу / Регистрация целевого инструктажа при первичном допуске
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-slate-200 border border-slate-200 overflow-hidden rounded-xl">
               {/* Column 1: Who gave briefing */}
               <div className="bg-white p-8 space-y-8">
                  <h4 className="text-sm font-black uppercase text-slate-400 border-b pb-2">Нұсқаулық өткіздім / Инструктаж провел</h4>

                  <div className="space-y-6">
                     <div className="pb-6 border-b border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Наряд берген тұлға / Лицо, выдавшее наряд</span>
                        <div className="text-lg font-black mt-2">{formData.issuerId}</div>
                        <div className="mt-2 text-[10px] font-black italic text-emerald-600">ПОДПИСАНО ЭЦП</div>
                     </div>
                     <div className="pb-6 border-b border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Рұқсат беруші / Допускающий</span>
                        <div className="text-lg font-black mt-2">{formData.admittingAuthorityId}</div>
                        <div className="mt-2 text-[10px] font-black italic text-emerald-600">ПОДПИСАНО ЭЦП</div>
                     </div>
                  </div>
               </div>

               {/* Column 2: Who received briefing */}
               <div className="bg-white p-8 space-y-8">
                  <h4 className="text-sm font-black uppercase text-slate-400 border-b pb-2">Нұсқаулық алдым / Инструктаж получил</h4>
                  <div className="space-y-6">
                     <div className="pb-6 border-b border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Ответ. руководитель работ (производитель, наблюдающий)</span>
                        <div className="text-lg font-black mt-2">{formData.workManagerId}</div>
                        <div className="mt-2 text-[10px] font-black italic text-emerald-600">ПОДПИСАНО ЭЦП</div>
                     </div>
                     <div className="pb-6 border-b border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Бригада мүшелері / Члены бригады</span>
                        <ul className="mt-2 space-y-2">
                           {(formData.brigadeMembers || []).map((m, i) => m && (
                              <li key={i} className="flex items-center justify-between text-sm font-bold border-l-4 border-blue-500 pl-3 py-1 bg-slate-50">
                                 {m}
                                 <span className="text-[9px] text-emerald-600">ЭЦП OK</span>
                              </li>
                           ))}
                        </ul>
                     </div>
                  </div>
               </div>
            </div>
         </section>
      </div>
   );

   return (
      <div className="w-full space-y-6 pb-32 px-4 sm:px-8">
         {/* FULL WIDTH TABS */}
         {!isReadonly && (
            <div className="sticky top-0 z-50 grid grid-cols-4 gap-2 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm mb-6">
               <TabButton id="main" label="Лицевая сторона" icon={FileText} active={activeTab === 'main'} onClick={setActiveTab} />
               <TabButton id="backside" label="Оборотная сторона" icon={ClipboardList} active={activeTab === 'backside'} onClick={setActiveTab} />
               <TabButton id="risks" label="Оценка риска" icon={AlertTriangle} active={activeTab === 'risks'} onClick={setActiveTab} />
               <TabButton id="loto" label="LOTO" icon={Lock} active={activeTab === 'loto'} onClick={setActiveTab} />
            </div>
         )}

         {isReadonly && (
            <div className="sticky top-0 z-50 grid grid-cols-5 gap-2 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm mb-6">
               <TabButton id="main" label="Лицевая сторона" icon={FileText} active={activeTab === 'main'} onClick={setActiveTab} />
               <TabButton id="backside" label="Оборотная" icon={ClipboardList} active={activeTab === 'backside'} onClick={setActiveTab} />
               <TabButton id="lifecycle" label="Журнал допуска" icon={Calendar} active={activeTab === 'lifecycle'} onClick={setActiveTab} />
               <TabButton id="risks" label="Оценка риска" icon={AlertTriangle} active={activeTab === 'risks'} onClick={setActiveTab} />
               <TabButton id="loto" label="LOTO" icon={Lock} active={activeTab === 'loto'} onClick={setActiveTab} />
            </div>
         )}

         {/* STRETCHED FORM CONTENT */}
         <div className="bg-white shadow-2xl border border-slate-200 p-8 md:p-16 rounded-[2.5rem] min-h-[800px] w-full">
            {activeTab === 'main' && renderMainTab()}

            {activeTab === 'backside' && (
               <div className="space-y-8 animate-in fade-in duration-300">
                  {/* Voltage/Workplace Ready - first on reverse side */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                     <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-yellow-100 rounded-lg">
                              <Zap size={20} className="text-yellow-600" />
                           </div>
                           <h3 className="font-semibold text-gray-900">Жұмыс орындары әзірленді. Кернеу бар жері: / Рабочие места подготовлены. Под напряжением остались:</h3>
                        </div>
                     </div>
                     <div className="p-6">
                        <textarea
                           className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all min-h-[100px] resize-none"
                           placeholder="Укажите места, оставшиеся под напряжением..."
                           value={formData.voltageRemainsAt || ''}
                           onChange={e => updateField('voltageRemainsAt', e.target.value)}
                           disabled={isReadonly}
                        />
                     </div>
                  </div>

                  {/* Daily Admission Section */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                     <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-blue-100 rounded-lg">
                              <Calendar size={20} className="text-blue-600" />
                           </div>
                           <div>
                              <h3 className="font-semibold text-gray-900 text-lg">Күн сайынғы жұмысқа рұқсаттама және оның аяқталу уақыты</h3>
                              <p className="text-sm text-gray-500">Ежедневный допуск к работе и время ее окончания</p>
                           </div>
                        </div>
                        {!isReadonly && (
                           <button
                              onClick={() => updateField('dailyAdmissions', [...(formData.dailyAdmissions || []), { id: Date.now().toString(), workplaceName: '', admissionDateTime: '', admitterSignature: '', producerSignature: '', endDateTime: '', producerEndSignature: '' }])}
                              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                           >
                              <Plus size={16} /> Добавить запись
                           </button>
                        )}
                     </div>

                     <div className="p-6">
                        {/* Column Headers */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                           <div className="bg-blue-50 rounded-lg p-3 text-center">
                              <p className="text-xs font-semibold text-blue-800">Бригада мақсатты нұсқаулық алды және әзірленген жұмыс орнына баруға рұқсаттама берілді</p>
                              <p className="text-[10px] text-blue-600 mt-1">Бригада получила целевой инструктаж и допущена на подготовленное рабочее место</p>
                           </div>
                           <div className="bg-green-50 rounded-lg p-3 text-center">
                              <p className="text-xs font-semibold text-green-800">Жұмыс аяқталды, бригада шығарылды</p>
                              <p className="text-[10px] text-green-600 mt-1">Работа закончена, бригада удалена</p>
                           </div>
                        </div>

                        {/* Table */}
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                           <table className="w-full text-base">
                              <thead className="bg-gray-50">
                                 <tr>
                                    <th rowSpan={2} className="px-3 py-2 text-left font-medium text-gray-600 border-b border-r border-gray-200 w-[15%]">
                                       <div>Жұмыс орнының атауы</div>
                                       <div className="text-[10px] text-gray-400 font-normal">Наименование рабочего места</div>
                                    </th>
                                    <th rowSpan={2} className="px-3 py-2 text-center font-medium text-gray-600 border-b border-r border-gray-200 w-[10%]">
                                       <div>Күні, уақыты</div>
                                       <div className="text-[10px] text-gray-400 font-normal">Дата, время</div>
                                    </th>
                                    <th colSpan={2} className="px-3 py-2 text-center font-medium text-gray-600 border-b border-r border-gray-200">
                                       <div>Қойылатын қолдар</div>
                                       <div className="text-[10px] text-gray-400 font-normal">Подписи (тегі, аты-жөні / фамилия, инициалы)</div>
                                    </th>
                                    <th rowSpan={2} className="px-3 py-2 text-center font-medium text-gray-600 border-b border-r border-gray-200 w-[10%]">
                                       <div>Күні, уақыты</div>
                                       <div className="text-[10px] text-gray-400 font-normal">Дата, время</div>
                                    </th>
                                    <th rowSpan={2} className="px-3 py-2 text-center font-medium text-gray-600 border-b border-gray-200 w-[18%]">
                                       <div>Жұмыс жүргізушінің (бақылаушының) қолы</div>
                                       <div className="text-[10px] text-gray-400 font-normal">Подпись производителя работ (наблюдающего)</div>
                                       <div className="text-[10px] text-gray-400 font-normal">(тегі, аты-жөні / фамилия, инициалы)</div>
                                    </th>
                                    {!isReadonly && <th rowSpan={2} className="w-10 border-b border-gray-200"></th>}
                                 </tr>
                                 <tr>
                                    <th className="px-3 py-2 text-center font-medium text-gray-600 border-b border-r border-gray-200 w-[12%]">
                                       <div>Рұқсат берушінің</div>
                                       <div className="text-[10px] text-gray-400 font-normal">Допускающего</div>
                                    </th>
                                    <th className="px-3 py-2 text-center font-medium text-gray-600 border-b border-r border-gray-200 w-[15%]">
                                       <div>Жұмыс жүргізушінің (бақылаушының)</div>
                                       <div className="text-[10px] text-gray-400 font-normal">Производителя работ (наблюдающего)</div>
                                    </th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                 {(formData.dailyAdmissions || []).map((admission, index) => (
                                    <tr key={admission.id} className="hover:bg-gray-50/50">
                                       <td className="p-2 border-r border-gray-200">
                                          <input
                                             className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-lg focus:ring-2 focus:ring-blue-500"
                                             placeholder="Рабочее место..."
                                             value={admission.workplaceName || ''}
                                             onChange={e => {
                                                const updated = [...(formData.dailyAdmissions || [])];
                                                updated[index] = { ...updated[index], workplaceName: e.target.value };
                                                updateField('dailyAdmissions', updated);
                                             }}
                                             disabled={isReadonly}
                                          />
                                       </td>
                                       <td className="p-2 border-r border-gray-200">
                                          <input
                                             type="datetime-local"
                                             className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-lg focus:ring-2 focus:ring-blue-500"
                                             value={admission.admissionDateTime || ''}
                                             onChange={e => {
                                                const updated = [...(formData.dailyAdmissions || [])];
                                                updated[index] = { ...updated[index], admissionDateTime: e.target.value };
                                                updateField('dailyAdmissions', updated);
                                             }}
                                             disabled={isReadonly}
                                          />
                                       </td>
                                       <td className="p-2 border-r border-gray-200">
                                          <input
                                             className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-lg focus:ring-2 focus:ring-blue-500"
                                             placeholder="Ф.И.О."
                                             value={admission.admitterSignature || ''}
                                             onChange={e => {
                                                const updated = [...(formData.dailyAdmissions || [])];
                                                updated[index] = { ...updated[index], admitterSignature: e.target.value };
                                                updateField('dailyAdmissions', updated);
                                             }}
                                             disabled={isReadonly}
                                          />
                                       </td>
                                       <td className="p-2 border-r border-gray-200">
                                          <input
                                             className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-lg focus:ring-2 focus:ring-blue-500"
                                             placeholder="Ф.И.О."
                                             value={admission.producerSignature || ''}
                                             onChange={e => {
                                                const updated = [...(formData.dailyAdmissions || [])];
                                                updated[index] = { ...updated[index], producerSignature: e.target.value };
                                                updateField('dailyAdmissions', updated);
                                             }}
                                             disabled={isReadonly}
                                          />
                                       </td>
                                       <td className="p-2 border-r border-gray-200">
                                          <input
                                             type="datetime-local"
                                             className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-lg focus:ring-2 focus:ring-blue-500"
                                             value={admission.endDateTime || ''}
                                             onChange={e => {
                                                const updated = [...(formData.dailyAdmissions || [])];
                                                updated[index] = { ...updated[index], endDateTime: e.target.value };
                                                updateField('dailyAdmissions', updated);
                                             }}
                                             disabled={isReadonly}
                                          />
                                       </td>
                                       <td className="p-2">
                                          <input
                                             className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-lg focus:ring-2 focus:ring-blue-500"
                                             placeholder="Ф.И.О."
                                             value={admission.producerEndSignature || ''}
                                             onChange={e => {
                                                const updated = [...(formData.dailyAdmissions || [])];
                                                updated[index] = { ...updated[index], producerEndSignature: e.target.value };
                                                updateField('dailyAdmissions', updated);
                                             }}
                                             disabled={isReadonly}
                                          />
                                       </td>
                                       {!isReadonly && (
                                          <td className="p-2 text-center">
                                             <button
                                                onClick={() => updateField('dailyAdmissions', (formData.dailyAdmissions || []).filter(a => a.id !== admission.id))}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                             >
                                                <Trash2 size={16} />
                                             </button>
                                          </td>
                                       )}
                                    </tr>
                                 ))}
                                 {(formData.dailyAdmissions || []).length === 0 && (
                                    <tr>
                                       <td colSpan={isReadonly ? 6 : 7} className="px-4 py-8 text-center text-gray-400 text-sm">
                                          Нажмите "Добавить запись" чтобы добавить ежедневный допуск
                                       </td>
                                    </tr>
                                 )}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  </div>

                  {/* Brigade Changes Section - Бригада құрамындағы өзгерістер */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                     <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-purple-100 rounded-lg">
                              <Users size={20} className="text-purple-600" />
                           </div>
                           <div>
                              <h3 className="font-semibold text-gray-900 text-sm">Бригада құрамындағы өзгерістер</h3>
                              <p className="text-xs text-gray-500">Изменения в составе бригады</p>
                           </div>
                        </div>
                        {!isReadonly && (
                           <button
                               onClick={() => updateField('brigadeChanges', [...(formData.brigadeChanges || []), { id: Date.now().toString(), introducedMember: '', introducedMemberGroup: '', removedMember: '', removedMemberGroup: '', dateTime: '', authorizedBy: '' }])}
                              className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                           >
                              <Plus size={16} /> Добавить изменение
                           </button>
                        )}
                     </div>

                     <div className="p-6">
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                           <table className="w-full text-xs">
                              <thead className="bg-gray-50">
                                 <tr>
                                    <th className="px-3 py-2 text-left font-medium text-gray-600 border-b border-r border-gray-200 w-[28%]">
                                       <div>Бригада құрамына енгізілді</div>
                                       <div className="text-[10px] text-gray-400 font-normal">Введен в состав бригады</div>
                                       <div className="text-[10px] text-gray-400 font-normal">(тегі, аты-жөні, тобы / фамилия, инициалы, группа)</div>
                                    </th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-600 border-b border-r border-gray-200 w-[28%]">
                                       <div>Бригада құрамынан шығарылды</div>
                                       <div className="text-[10px] text-gray-400 font-normal">Выведен из состава бригады</div>
                                       <div className="text-[10px] text-gray-400 font-normal">(тегі, аты-жөні, тобы / фамилия, инициалы, группа)</div>
                                    </th>
                                    <th className="px-3 py-2 text-center font-medium text-gray-600 border-b border-r border-gray-200 w-[14%]">
                                       <div>Күні, уақыты</div>
                                       <div className="text-[10px] text-gray-400 font-normal">Дата, время</div>
                                    </th>
                                    <th className="px-3 py-2 text-center font-medium text-gray-600 border-b border-gray-200 w-[25%]">
                                       <div>Рұқсат бердім / Разрешил</div>
                                       <div className="text-[10px] text-gray-400 font-normal">(қолы/подпись) (тегі, аты-жөні / фамилия, инициалы)</div>
                                    </th>
                                    {!isReadonly && <th className="w-10 border-b border-gray-200"></th>}
                                 </tr>
                              </thead>
                               <tbody className="divide-y divide-gray-100">
                                  {(formData.brigadeChanges || []).map((change, index) => (
                                     <tr key={change.id} className="hover:bg-gray-50/50">
                                        <td className="p-2 border-r border-gray-200">
                                           <div className="flex gap-1">
                                              <input
                                                 className="flex-1 bg-white border border-gray-200 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-purple-500"
                                                 placeholder="Ф.И.О."
                                                 value={change.introducedMember || ''}
                                                 onChange={e => {
                                                    const updated = [...(formData.brigadeChanges || [])];
                                                    updated[index] = { ...updated[index], introducedMember: e.target.value };
                                                    updateField('brigadeChanges', updated);
                                                 }}
                                                 disabled={isReadonly}
                                              />
                                              <select
                                                 className="w-14 bg-white border border-gray-200 rounded px-1 py-1.5 text-xs focus:ring-2 focus:ring-purple-500"
                                                 value={change.introducedMemberGroup || ''}
                                                 onChange={e => {
                                                    const updated = [...(formData.brigadeChanges || [])];
                                                    updated[index] = { ...updated[index], introducedMemberGroup: e.target.value };
                                                    updateField('brigadeChanges', updated);
                                                 }}
                                                 disabled={isReadonly}
                                              >
                                                 <option value="">Гр.</option>
                                                 <option value="1">I</option>
                                                 <option value="2">II</option>
                                                 <option value="3">III</option>
                                                 <option value="4">IV</option>
                                                 <option value="5">V</option>
                                              </select>
                                           </div>
                                        </td>
                                        <td className="p-2 border-r border-gray-200">
                                           <div className="flex gap-1">
                                              <input
                                                 className="flex-1 bg-white border border-gray-200 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-purple-500"
                                                 placeholder="Ф.И.О."
                                                 value={change.removedMember || ''}
                                                 onChange={e => {
                                                    const updated = [...(formData.brigadeChanges || [])];
                                                    updated[index] = { ...updated[index], removedMember: e.target.value };
                                                    updateField('brigadeChanges', updated);
                                                 }}
                                                 disabled={isReadonly}
                                              />
                                              <select
                                                 className="w-14 bg-white border border-gray-200 rounded px-1 py-1.5 text-xs focus:ring-2 focus:ring-purple-500"
                                                 value={change.removedMemberGroup || ''}
                                                 onChange={e => {
                                                    const updated = [...(formData.brigadeChanges || [])];
                                                    updated[index] = { ...updated[index], removedMemberGroup: e.target.value };
                                                    updateField('brigadeChanges', updated);
                                                 }}
                                                 disabled={isReadonly}
                                              >
                                                 <option value="">Гр.</option>
                                                 <option value="1">I</option>
                                                 <option value="2">II</option>
                                                 <option value="3">III</option>
                                                 <option value="4">IV</option>
                                                 <option value="5">V</option>
                                              </select>
                                           </div>
                                        </td>
                                       <td className="p-2 border-r border-gray-200">
                                          <input
                                             type="datetime-local"
                                             className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-purple-500"
                                             value={change.dateTime || ''}
                                             onChange={e => {
                                                const updated = [...(formData.brigadeChanges || [])];
                                                updated[index] = { ...updated[index], dateTime: e.target.value };
                                                updateField('brigadeChanges', updated);
                                             }}
                                             disabled={isReadonly}
                                          />
                                       </td>
                                       <td className="p-2">
                                          <input
                                             className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-purple-500"
                                             placeholder="Ф.И.О."
                                             value={change.authorizedBy || ''}
                                             onChange={e => {
                                                const updated = [...(formData.brigadeChanges || [])];
                                                updated[index] = { ...updated[index], authorizedBy: e.target.value };
                                                updateField('brigadeChanges', updated);
                                             }}
                                             disabled={isReadonly}
                                          />
                                       </td>
                                       {!isReadonly && (
                                          <td className="p-2 text-center">
                                             <button
                                                onClick={() => updateField('brigadeChanges', (formData.brigadeChanges || []).filter(c => c.id !== change.id))}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                             >
                                                <Trash2 size={16} />
                                             </button>
                                          </td>
                                       )}
                                    </tr>
                                 ))}
                                 {(formData.brigadeChanges || []).length === 0 && (
                                    <tr>
                                       <td colSpan={isReadonly ? 4 : 5} className="px-4 py-8 text-center text-gray-400 text-sm">
                                          Нажмите "Добавить изменение" чтобы добавить изменения в составе бригады
                                       </td>
                                    </tr>
                                 )}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  </div>

                  {/* Target Briefing Registration - Алғашқы рұқсаттама кезінде мақсатты нұсқаулықты тіркеу */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                     <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-orange-100 rounded-lg">
                              <PenTool size={20} className="text-orange-600" />
                           </div>
                           <div>
                              <h3 className="font-semibold text-gray-900 text-sm">Алғашқы рұқсаттама кезінде мақсатты нұсқаулықты тіркеу</h3>
                              <p className="text-xs text-gray-500">Регистрация целевого инструктажа при первичном допуске</p>
                           </div>
                        </div>
                     </div>

                     <div className="p-6">
                        <div className="grid grid-cols-2 gap-6">
                           {/* Left Column - Инструктаж провел */}
                           <div className="space-y-4">
                              <div className="bg-blue-50 rounded-lg p-3 text-center">
                                 <p className="text-xs font-semibold text-blue-800">Нұсқаулық өткіздім</p>
                                 <p className="text-[10px] text-blue-600">Инструктаж провел</p>
                              </div>

                              <div className="space-y-4">
                                 <div className="border border-gray-200 rounded-lg p-4">
                                    <label className="block text-xs font-medium text-gray-600 mb-2">Наряд берген тұлға / Лицо, выдавшее наряд</label>
                                    <input
                                       className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 mb-2"
                                       placeholder="тегі, аты-жөні / фамилия, инициалы"
                                       value={formData.briefingConductedByIssuer || ''}
                                       onChange={e => updateField('briefingConductedByIssuer', e.target.value)}
                                       disabled={isReadonly}
                                    />
                                    <div className="text-[10px] text-gray-400 text-center">(қолы / подпись)</div>
                                 </div>

                                 <div className="border border-gray-200 rounded-lg p-4">
                                    <label className="block text-xs font-medium text-gray-600 mb-2">Рұқсат беруші / Допускающий</label>
                                    <input
                                       className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 mb-2"
                                       placeholder="тегі, аты-жөні / фамилия, инициалы"
                                       value={formData.briefingConductedByAdmitter || ''}
                                       onChange={e => updateField('briefingConductedByAdmitter', e.target.value)}
                                       disabled={isReadonly}
                                    />
                                    <div className="text-[10px] text-gray-400 text-center">(қолы / подпись)</div>
                                 </div>

                                 <div className="border border-gray-200 rounded-lg p-4">
                                    <label className="block text-xs font-medium text-gray-600 mb-2">Жауапты жұмыс жетекшісі / Жұмыс жүргізуші (бақылаушы)</label>
                                    <p className="text-[10px] text-gray-400 mb-2">Ответ. руководитель работ / производитель работ (наблюдающий)</p>
                                    <input
                                       className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 mb-2"
                                       placeholder="тегі, аты-жөні / фамилия, инициалы"
                                       value={formData.briefingConductedByManager || ''}
                                       onChange={e => updateField('briefingConductedByManager', e.target.value)}
                                       disabled={isReadonly}
                                    />
                                    <div className="text-[10px] text-gray-400 text-center">(қолы / подпись)</div>
                                 </div>
                              </div>
                           </div>

                           {/* Right Column - Инструктаж получил */}
                           <div className="space-y-4">
                              <div className="bg-green-50 rounded-lg p-3 text-center">
                                 <p className="text-xs font-semibold text-green-800">Нұсқаулық алдым</p>
                                 <p className="text-[10px] text-green-600">Инструктаж получил</p>
                              </div>

                              <div className="space-y-4">
                                 <div className="border border-gray-200 rounded-lg p-4">
                                    <label className="block text-xs font-medium text-gray-600 mb-2">Жауапты жұмыс жетекшісі (жұмыс жүргізуші, бақылаушы)</label>
                                    <p className="text-[10px] text-gray-400 mb-2">Ответ. руководитель работ / производитель работ (наблюдающий)</p>
                                    <input
                                       className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-xs focus:ring-2 focus:ring-green-500 mb-2"
                                       placeholder="тегі, аты-жөні / фамилия, инициалы"
                                       value={formData.briefingReceivedByManager || ''}
                                       onChange={e => updateField('briefingReceivedByManager', e.target.value)}
                                       disabled={isReadonly}
                                    />
                                    <div className="text-[10px] text-gray-400 text-center">(қолы / подпись)</div>
                                 </div>

                                 <div className="border border-gray-200 rounded-lg p-4">
                                    <label className="block text-xs font-medium text-gray-600 mb-2">Жұмыс жүргізуші (бақылаушы) / Производитель работ (наблюдающий)</label>
                                    <input
                                       className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-xs focus:ring-2 focus:ring-green-500 mb-2"
                                       placeholder="тегі, аты-жөні / фамилия, инициалы"
                                       value={formData.briefingReceivedByProducer || ''}
                                       onChange={e => updateField('briefingReceivedByProducer', e.target.value)}
                                       disabled={isReadonly}
                                    />
                                    <div className="text-[10px] text-gray-400 text-center">(қолы / подпись)</div>
                                 </div>

                                 <div className="border border-gray-200 rounded-lg p-4">
                                    <label className="block text-xs font-medium text-gray-600 mb-2">Бригада мүшелері / Члены бригады</label>
                                    <textarea
                                       className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-xs focus:ring-2 focus:ring-green-500 min-h-[60px] resize-none"
                                       placeholder="Список членов бригады..."
                                       value={formData.briefingReceivedByMembers || ''}
                                       onChange={e => updateField('briefingReceivedByMembers', e.target.value)}
                                       disabled={isReadonly}
                                    />
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Work Completion - Жұмыс толық аяқталды */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                     <div className="px-6 py-4 border-b border-gray-100 bg-green-50/50">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-green-100 rounded-lg">
                              <CheckCircle2 size={20} className="text-green-600" />
                           </div>
                           <div>
                              <h3 className="font-semibold text-gray-900 text-sm">Жұмыс толық аяқталды, бригада шығарылды, бригаданың орнатқан жер қосқыштары алынды</h3>
                              <p className="text-xs text-gray-500">Работа полностью закончена, бригада удалена, заземления, установленные бригадой, сняты</p>
                           </div>
                        </div>
                     </div>

                     <div className="p-6 space-y-6">
                        {/* Notification */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <div className="md:col-span-1">
                              <label className="block text-xs font-medium text-gray-600 mb-2">Хабарланды / Сообщено (кімге / кому)</label>
                              <input
                                 className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-xs focus:ring-2 focus:ring-green-500"
                                 placeholder="тегі, аты-жөні / фамилия, инициалы"
                                 value={formData.completionNotifiedTo || ''}
                                 onChange={e => updateField('completionNotifiedTo', e.target.value)}
                                 disabled={isReadonly}
                              />
                           </div>
                           <div>
                              <label className="block text-xs font-medium text-gray-600 mb-2">күні / дата</label>
                              <input
                                 type="date"
                                 className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-xs focus:ring-2 focus:ring-green-500"
                                 value={formData.completionDate || ''}
                                 onChange={e => updateField('completionDate', e.target.value)}
                                 disabled={isReadonly}
                              />
                           </div>
                           <div>
                              <label className="block text-xs font-medium text-gray-600 mb-2">уақыты / время</label>
                              <input
                                 type="time"
                                 className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-xs focus:ring-2 focus:ring-green-500"
                                 value={formData.completionTime || ''}
                                 onChange={e => updateField('completionTime', e.target.value)}
                                 disabled={isReadonly}
                              />
                           </div>
                        </div>

                        {/* Signatures */}
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                 <label className="block text-xs font-medium text-gray-600 mb-2">Жұмыс жүргізуші (бақылаушы) / Производитель работ (наблюдающий)</label>
                                 <input
                                    className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-xs focus:ring-2 focus:ring-green-500"
                                    placeholder="(қолы / подпись) (тегі, аты-жөні / фамилия, инициалы)"
                                    value={formData.completionProducerSignature || ''}
                                    onChange={e => updateField('completionProducerSignature', e.target.value)}
                                    disabled={isReadonly}
                                 />
                              </div>
                              <div>
                                 <label className="block text-xs font-medium text-gray-600 mb-2">Жауапты жұмыс жетекшісі / Ответственный руководитель работ</label>
                                 <input
                                    className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-xs focus:ring-2 focus:ring-green-500"
                                    placeholder="(қолы / подпись) (тегі, аты-жөні / фамилия, инициалы)"
                                    value={formData.completionManagerSignature || ''}
                                    onChange={e => updateField('completionManagerSignature', e.target.value)}
                                    disabled={isReadonly}
                                 />
                              </div>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                 <label className="block text-xs font-medium text-gray-600 mb-2">Рұқсат беруші / Допускающий</label>
                                 <input
                                    className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-xs focus:ring-2 focus:ring-green-500"
                                    placeholder="(қолы / подпись) (тегі, аты-жөні / фамилия, инициалы)"
                                    value={formData.completionAdmitterSignature || ''}
                                    onChange={e => updateField('completionAdmitterSignature', e.target.value)}
                                    disabled={isReadonly}
                                 />
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'lifecycle' && renderLifecycleTab()}

            {activeTab === 'risks' && (
               <RiskAssessmentWidget
                  riskTable={formData.riskTable || []}
                  onAddRiskRow={() => updateField('riskTable', [...(formData.riskTable || []), { id: Date.now().toString(), step: '', hazards: '', measures: '', isControlled: '' }])}
                  onRemoveRiskRow={(id) => updateField('riskTable', (formData.riskTable || []).filter(r => r.id !== id))}
                  onUpdateRiskRow={(id, field, value) => {
                     const updated = (formData.riskTable || []).map(r => r.id === id ? { ...r, [field]: value } : r);
                     updateField('riskTable', updated);
                  }}
                  // General info
                  workPlace={formData.assignment || 'Не указано'}
                  organization={formData.organization || 'АО "Каражанбасмунай"'}
                  content={formData.assignment || 'Не заполнено'}
                  // Participants
                  riskIdentifiedBy={riskIdentifiedBy}
                  onRiskIdentifiedByChange={setRiskIdentifiedBy}
                  riskGroup={riskGroup}
                  onAddRiskGroupMember={addRiskGroupMember}
                  onRemoveRiskGroupMember={removeRiskGroupMember}
                  onUpdateRiskGroupMember={updateRiskGroupMember}
                  isReadonly={isReadonly}
                  variant="electrical"
               />
            )}

            {activeTab === 'loto' && (
               <div className="space-y-6 animate-in fade-in duration-300">
                  {/* LOTO Card */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                     <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-gray-100 rounded-lg">
                              <Lock size={20} className="text-gray-500" />
                           </div>
                           <h3 className="font-semibold text-gray-900 uppercase text-sm tracking-wide">Процедуры блокировки и маркировки (LOTO)</h3>
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer">
                           <div className="relative">
                              <input type="checkbox" className="sr-only peer" checked={formData.lotoEnabled} onChange={e => updateField('lotoEnabled', e.target.checked)} disabled={isReadonly} />
                              <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-blue-600 transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
                           </div>
                           <span className="text-sm text-gray-500">{formData.lotoEnabled ? 'Включено' : 'Выключено'}</span>
                        </label>
                     </div>
                     <div className="p-6">
                        {formData.lotoEnabled ? (
                           <IsolationMatrixForm data={formData.isolationMatrix!} onChange={val => updateField('isolationMatrix', val)} />
                        ) : (
                           <div className="py-16 text-center bg-gray-50 rounded-xl border border-gray-100">
                              <Lock size={48} className="mx-auto text-gray-300 mb-4" />
                              <p className="text-gray-700 font-semibold mb-2">Процедура LOTO не применяется</p>
                              <p className="text-gray-400 text-sm max-w-md mx-auto">
                                 Если для выполнения работ требуется блокировка источников энергии, включите опцию выше.
                              </p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            )}
         </div>

         {/* Step Navigation Footer */}
         {
            !isReadonly && (
               <div className="fixed bottom-0 left-72 right-0 bg-white border-t border-slate-200 py-4 px-6 z-[60] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                  <div className="max-w-[1600px] mx-auto flex justify-between items-center">
                     <div className="flex items-center gap-4">
                        {currentStep > 1 && (
                           <button
                              onClick={goToPrevStep}
                              className="px-6 py-2.5 text-slate-500 font-semibold hover:bg-slate-100 rounded-lg transition-colors"
                           >
                              ← Назад
                           </button>
                        )}
                        <span className="text-slate-500 font-medium">
                           Шаг {currentStep} из {totalSteps}
                        </span>
                     </div>
                     <button
                        onClick={goToNextStep}
                        className="px-8 py-2.5 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-900 transition-colors"
                     >
                        {currentStep === totalSteps ? 'Создать наряд' : 'Далее'}
                     </button>
                  </div>
               </div>
            )
         }
      </div>
   );
};
