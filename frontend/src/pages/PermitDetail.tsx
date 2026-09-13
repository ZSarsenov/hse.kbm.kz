import React, { useState, useRef } from 'react';
import {
  ArrowLeft, MapPin, User, Clock, FileText, CheckCircle2, AlertTriangle, FileSignature, XCircle, Download, Shield, Users, Edit3, Trash2, Copy, FlaskConical, Zap, Plus
} from 'lucide-react';
import { WorkPermit, PermitCategory } from '../types';
import { confirm as confirmDialog } from '../components/ConfirmDialog';
import { StatusBadge } from '../components/StatusBadge';
import { useNCALayer } from '../hooks/useNCALayer';
import { ApprovalTracker } from '../components/ApprovalTracker';
import { FileCheck, ClipboardList } from 'lucide-react';
import { WellMap } from '../components/WellMap';
import ChecklistSection, { ChecklistData } from '../components/ChecklistSection';
import { SignaturePadModal, getSignatureUrl } from '../components/SignaturePadModal';
import { IsolationMatrixForm } from '../components/IsolationMatrixForm';

interface UserSearchSelection {
  userId: number;
  name: string;
  position: string;
}

const UserSearchInput: React.FC<{ value: UserSearchSelection | null; onChange: (val: UserSearchSelection | null) => void; disabled?: boolean }> = ({ value, onChange, disabled }) => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSearch = async (q: string) => {
    setSearch(q);
    if (q.length < 2) { setResults([]); setShowDropdown(false); return; }
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`/api/v1/users/?search=${encodeURIComponent(q)}`, { headers: { 'Authorization': `Token ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setResults(Array.isArray(data) ? data : (data.results || []));
      setShowDropdown(true);
    }
  };

  const displayValue = value ? `${value.name}${value.position ? ', ' + value.position : ''}` : '';

  return (
    <div className="relative">
      {value ? (
        <div className="flex items-center gap-1 min-h-[40px] px-2">
          <span className="text-xs text-gray-900 leading-snug">{displayValue}</span>
          {!disabled && (
            <button type="button" onClick={() => onChange(null)}
              className="text-gray-400 hover:text-red-500 text-xs ml-auto shrink-0">&times;</button>
          )}
        </div>
      ) : (
        <>
          <input type="text" placeholder="Поиск..."
            value={search} onChange={e => handleSearch(e.target.value)}
            onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
            disabled={disabled}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-blue-500" />
          {showDropdown && results.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto mt-1 min-w-[280px]">
              {results.map((u: any) => (
                <button key={u.id} type="button"
                  onClick={() => {
                    onChange({ userId: u.id, name: u.name || u.username, position: u.position || '' });
                    setSearch('');
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b last:border-0 text-sm">
                  <span className="font-medium">{u.name || u.username}</span>
                  {u.position && <span className="text-gray-400 ml-1">({u.position})</span>}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

interface PermitDetailProps {
  permit: WorkPermit;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRefresh?: () => void;
}

const formatPermitDateTime = (iso?: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return {
    date: d.toLocaleDateString('ru-RU'),
    time: d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
  };
};

const formatPermitCompact = (iso?: string | null) => {
  const fmt = formatPermitDateTime(iso);
  if (!fmt) return null;
  return `${fmt.date}, ${fmt.time}`;
};

const ELEC_GROUPS: Record<string, string> = { '1': 'I', '2': 'II', '3': 'III', '4': 'IV', '5': 'V' };
const groupLabel = (g?: string | null) => {
  if (!g) return null;
  return ELEC_GROUPS[g] || g;
};

export const PermitDetail: React.FC<PermitDetailProps> = ({ permit, onBack, onEdit, onDelete, onRefresh }) => {
  // Распаковка данных (безопасный доступ)
  const data: any = permit.data || (permit as any).formData || {};
  const wellCoords = data?.wellCoords || null;
  const initiator = (permit.initiator as any) || {};

  /** Начало: плановая дата работ (valid_from) или дата создания наряда (открыт в системе). */
  const openedAtIso = permit.validFrom || permit.createdAt || null;
  const openedFmt = formatPermitDateTime(openedAtIso);
  const isClosed = permit.status === 'CLOSED';
  const closedFmt = isClosed ? formatPermitDateTime(permit.validTo || null) : null;

  // 1. ПОЛУЧАЕМ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ
  const currentUser = JSON.parse(localStorage.getItem('user_data') || '{}');
  const currentUserId = String(currentUser.id || currentUser.user_id);
  const isAdmin = currentUser.is_admin || currentUser.role === 'ADMIN';
  const isAuditor = currentUser.is_auditor || currentUser.role === 'AUDITOR';

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

  // Проверяем роли для закрытия наряда
  const admittingStep = steps.find((s: any) => s.role === 'ADMITTING');
  const isAdmittingUser = admittingStep && String(admittingStep.approver_id) === currentUserId;

  const producerStep = steps.find((s: any) => s.role === 'WORK_PRODUCER');
  const isProducerUser = producerStep && producerStep.approver_id && String(producerStep.approver_id) === currentUserId;

  const isIssuerUser = issuerStep && String(issuerStep.approver_id) === currentUserId;
  const responsibleStep = steps.find((s: any) => s.role === 'RESPONSIBLE');
  const isResponsibleUser = responsibleStep && responsibleStep.approver_id && String(responsibleStep.approver_id) === currentUserId;

  // Внешний производитель (без ЭЦП): нет approver_id + флаг external в data
  const externalProducer = producerStep && !producerStep.approver_id &&
    typeof data.producer === 'object' && data.producer?.external;

  const coordStepsOrdered = [...steps]
    .filter((s: any) => s.role === 'COORDINATOR')
    .sort((a: any, b: any) => (a.step_order || 0) - (b.step_order || 0));
  const mainSupervisorStep =
    coordStepsOrdered.length > 0 ? coordStepsOrdered[coordStepsOrdered.length - 1] : null;
  const externalSupervisor =
    !!mainSupervisorStep &&
    !mainSupervisorStep.approver_id &&
    typeof data.supervisor === 'object' &&
    data.supervisor?.external;

  // Дополнительные внешние согласующие и возможность их графической подписи
  const addlCoordSteps = coordStepsOrdered.slice(0, -1);
  const addlCoordStates = (data.additionalCoordinators && Array.isArray(data.additionalCoordinators))
    ? data.additionalCoordinators.map((coord: any, idx: number) => {
        const step = addlCoordSteps[idx] || null;
        const isExternal = coord.external && !coord.id;
        const isPending = isExternal && step?.status === 'PENDING' && permit.status === 'PENDING_APPROVAL';
        const canSign = isPending && (
          isAdmin ||
          steps.some(
            (s: any) =>
              s.status === 'APPROVED' &&
              s.approver_id &&
              String(s.approver_id) === currentUserId &&
              s.step_order < (step?.step_order || Infinity)
          )
        );
        const sigKey = `coordinator_${idx}_signature`;
        const signature = data[sigKey] || null;
        return { coord, step, isExternal, isPending, canSign, signature, idx };
      })
    : [];

  // Выдающий или Допускающий с подписанным шагом — могут действовать за внешнего производителя
  const issuerApprovedStep = steps.find((s: any) => s.role === 'ISSUER' && s.status === 'APPROVED');
  const admitApprovedStep = steps.find((s: any) => s.role === 'ADMITTING' && s.status === 'APPROVED');
  const canActForExternalProducer = !!externalProducer && (
    (issuerApprovedStep && String(issuerApprovedStep.approver_id) === currentUserId) ||
    (admitApprovedStep && String(admitApprovedStep.approver_id) === currentUserId)
  );

  // Кто может управлять лаборантами: Допускающий (до своей подписи, статус PENDING_APPROVAL)
  const isAdmittingCanManageLab = !!(permit.status === 'PENDING_APPROVAL' &&
    steps.some((s: any) => s.role === 'ADMITTING' && String(s.approver_id) === currentUserId && s.status === 'PENDING')
  );

  // Кнопка "Закрыть наряд" — Производитель работ (шаг 1)
  const showProducerClose = !isAuditor && permit.status === 'APPROVED' && !permit.producer_closed &&
    (isProducerUser || canActForExternalProducer);

  // Кнопка "Закрыть наряд" — Допускающий (шаг 2, только после производителя)
  const showAdmittingClose = !isAuditor && permit.status === 'APPROVED' && !!permit.producer_closed && !!isAdmittingUser;

  // 3. ЛОГИКА ВИДИМОСТИ КНОПОК (аудитор — только просмотр и скачивание)
  const hasRequiredFields = !!(
    data.workName &&
    data.workPlace &&
    data.issuer?.id &&
    data.admitting?.id &&
    (data.producer?.id || data.producer?.name) &&
    data.teamMembers?.length > 0
  );
  const showSubmitForApproval = !isAuditor && (permit.status === 'DRAFT' || permit.status === 'REJECTED') && isInitiator && hasRequiredFields;
  const showApprove = !isAuditor && permit.status === 'PENDING_APPROVAL' && myPendingSteps.length > 0;
  const showReject = !isAuditor && permit.status === 'PENDING_APPROVAL' && myPendingSteps.length > 0;

  const isApprover = steps.some((s: any) => String(s.approver_id) === currentUserId);
  const showDuplicate = !isAuditor && (isInitiator || isApprover) && (permit.status === 'REJECTED' || permit.status === 'CLOSED' || permit.status === 'ARCHIVED');

  // Показывать кнопку скачивания: согласован/закрыт, или администратор видит всё
  const showDownload = permit.status === 'APPROVED' || permit.status === 'CLOSED' || permit.status === 'ARCHIVED';


  const [signingMemberIndex, setSigningMemberIndex] = useState<number | null>(null);
  const [producerPadOpen, setProducerPadOpen] = useState(false);
  const [supervisorPadOpen, setSupervisorPadOpen] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', role: '', instructedBy: '' });
  const [addingMember, setAddingMember] = useState(false);

  // --- ЛАБОРАНТ ЦНИПР ---
  const [showAddLabTechnician, setShowAddLabTechnician] = useState(false);
  const [newLabTechnician, setNewLabTechnician] = useState({ name: '', samplingLocation: '', concentration: '' });
  const [addingLabTechnician, setAddingLabTechnician] = useState(false);
  const [signingLabTechnicianIndex, setSigningLabTechnicianIndex] = useState<number | null>(null);

  // --- ЭЛЕКТРОУСТАНОВКИ ---
  const [electricalTab, setElectricalTab] = useState<'main' | 'brigade'>('main');
  const [electricalNewTab, setElectricalNewTab] = useState<'main' | 'team' | 'checklist' | 'measures' | 'loto' | 'admission' | 'daily' | 'brigade_change' | 'target_briefing' | 'work_completion'>('main');

  // ELECTRICAL_NEW signature pad states
  const [admissionPadOpen, setAdmissionPadOpen] = useState(false);
  const [responsiblePadOpen, setResponsiblePadOpen] = useState(false);
  const [agreementPadOpen, setAgreementPadOpen] = useState(false);
  const [agreementPadIndex, setAgreementPadIndex] = useState<number>(0);
  const [agreementSearchResults, setAgreementSearchResults] = useState<any[]>([]);
  const [agreementSearchRow, setAgreementSearchRow] = useState<number>(-1);
  const [dailyAdmitPadOpen, setDailyAdmitPadOpen] = useState(false);
  const [dailyAdmitPadIndex, setDailyAdmitPadIndex] = useState<number>(0);
  const [dailyProdAdmitPadOpen, setDailyProdAdmitPadOpen] = useState(false);
  const [dailyProdAdmitPadIndex, setDailyProdAdmitPadIndex] = useState<number>(0);
  const [dailyProdCompPadOpen, setDailyProdCompPadOpen] = useState(false);
  const [dailyProdCompPadIndex, setDailyProdCompPadIndex] = useState<number>(0);
  const [workCompletionPadOpen, setWorkCompletionPadOpen] = useState(false);
  const [workCompletionField, setWorkCompletionField] = useState<string>('');
  const [targetBriefingPadOpen, setTargetBriefingPadOpen] = useState(false);
  const pendingTBRowRef = useRef<string>('');
  const pendingTBSideRef = useRef<string>('');

  if (permit.category === PermitCategory.ELECTRICAL) {
    const brigadeMembers = Array.isArray(data.brigadeMembers) ? data.brigadeMembers : [];
    const electricalHasRequiredFields = !!(
      data.workManagerId &&
      data.admittingAuthorityId &&
      data.workProducerId &&
      brigadeMembers.some((m: any) => (typeof m === 'string' ? m : m?.name)?.trim())
    );
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
        <button onClick={onBack} className="flex items-center text-gray-500 hover:text-gray-900 transition-colors w-fit text-lg font-medium">
          <ArrowLeft size={24} className="mr-2" /> Назад к списку
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* HEADER */}
          <div className="p-6 md:p-8 border-b border-gray-100 bg-gradient-to-r from-white to-slate-50/50">
            <div className="flex items-center gap-3 mb-2">
              <StatusBadge status={permit.status} />
              <span className="text-sm font-mono text-slate-400">#{permit.permitId}</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900 leading-tight">Наряд на электроустановках</h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wide bg-blue-100 text-blue-700 border-blue-200">
                <Zap size={12}/> Электроустановки
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 mt-2">
              <MapPin size={18} className="text-blue-500" />
              <span className="font-medium">{data.department || 'Электроустановка'}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-100 mt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600"><User size={20} /></div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Инициатор</p>
                  <p className="font-semibold text-slate-700">{initiator?.name || 'Неизвестно'}</p>
                  <p className="text-xs text-slate-500">{initiator?.position || 'Сотрудник'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm text-amber-500 shrink-0"><Clock size={20} /></div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Период работ</p>
                  <p className="font-semibold text-slate-700 leading-snug">
                    {data.startDate ? data.startDate : '—'}{data.endDate ? ` — ${data.endDate}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm text-rose-500"><AlertTriangle size={20} /></div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Категория работ</p>
                  <p className="font-semibold text-slate-700">{data.workCategory || '—'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* TABS */}
          <div className="border-b border-gray-200 px-6 md:px-8">
            <div className="flex gap-6 overflow-x-auto">
              {[
                { id: 'main' as const, label: 'Основное' },
                { id: 'brigade' as const, label: 'Бригада' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setElectricalTab(tab.id)}
                  className={`pb-4 pt-4 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors whitespace-nowrap ${electricalTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* CONTENT */}
          <div className="p-6 md:p-8 min-h-[300px]">
            {electricalTab === 'main' && (
              <div className="space-y-8">
                {/* Описание и условия работ */}
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2"><FileText size={20} className="text-slate-400"/> Описание и условия работ</h3>
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-4">
                    <div><span className="text-xs font-bold text-gray-400 uppercase">Категория работ</span><p className="text-gray-900 font-medium text-lg">{data.workCategory || '—'}</p></div>
                    <div><span className="text-xs font-bold text-gray-400 uppercase">Поручается</span><p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{data.assignment || 'Описание отсутствует'}</p></div>
                    <div><span className="text-xs font-bold text-gray-400 uppercase">Место проведения</span><p className="text-gray-800">{data.department || '—'}</p></div>
                  </div>
                </div>

                {/* Ход согласования */}
                <ApprovalTracker steps={(permit as any).approvalSteps} />

                {/* Ответственные лица */}
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><User size={20} className="text-slate-400"/> Ответственные лица</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg"><span className="text-xs text-gray-400 uppercase font-bold">Выдающий наряд</span><p className="font-medium text-gray-900">{data.issuerId || '—'}</p></div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <span className="text-xs text-gray-400 uppercase font-bold">Руководитель работ</span>
                      <p className="font-medium text-gray-900">{data.workManagerId || '—'}</p>
                      {data.workManagerPosition && <p className="text-sm text-gray-500">{data.workManagerPosition}</p>}
                      {groupLabel(data.workManagerGroup) && <p className="text-xs text-blue-600 mt-1">Группа ЭБ: {groupLabel(data.workManagerGroup)}</p>}
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <span className="text-xs text-gray-400 uppercase font-bold">Допускающий</span>
                      <p className="font-medium text-gray-900">{data.admittingAuthorityId || '—'}</p>
                      {data.admittingPosition && <p className="text-sm text-gray-500">{data.admittingPosition}</p>}
                      {groupLabel(data.admittingAuthorityGroup) && <p className="text-xs text-blue-600 mt-1">Группа ЭБ: {groupLabel(data.admittingAuthorityGroup)}</p>}
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <span className="text-xs text-gray-400 uppercase font-bold">Производитель работ</span>
                      <p className="font-medium text-gray-900">{data.workProducerId || '—'}</p>
                      {data.workProducerPosition && <p className="text-sm text-gray-500">{data.workProducerPosition}</p>}
                      {groupLabel(data.workProducerGroup) && <p className="text-xs text-blue-600 mt-1">Группа ЭБ: {groupLabel(data.workProducerGroup)}</p>}
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <span className="text-xs text-gray-400 uppercase font-bold">Наблюдающий</span>
                      <p className="font-medium text-gray-900">{data.observerId || '—'}</p>
                      {data.observerPosition && <p className="text-sm text-gray-500">{data.observerPosition}</p>}
                      {groupLabel(data.observerGroup) && <p className="text-xs text-blue-600 mt-1">Группа ЭБ: {groupLabel(data.observerGroup)}</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {electricalTab === 'brigade' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Users size={20} className="text-blue-500"/> Состав бригады</h3>
                  <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Всего: {brigadeMembers.length} чел.</span>
                </div>
                {brigadeMembers.length > 0 ? (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase">
                        <tr>
                          <th className="px-4 py-3 w-10">№</th>
                          <th className="px-4 py-3">ФИО</th>
                          <th className="px-4 py-3">Группа по электробезопасности</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {brigadeMembers.map((member: any, idx: number) => {
                          const name = typeof member === 'string' ? member : (member?.name || '—');
                          const group = typeof member === 'string' ? '' : (member?.group || '—');
                          return (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                              <td className="px-4 py-3 font-medium text-gray-900">{name}</td>
                              <td className="px-4 py-3 text-gray-600">{group}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">Состав бригады не указан</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER: КНОПКИ ДЕЙСТВИЙ */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg md:relative md:bg-transparent md:border-0 md:shadow-none md:p-0 z-20">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row gap-3 justify-end">
            {!isAuditor && (((permit.status === 'DRAFT' || permit.status === 'REJECTED') && isInitiator) || canEditAsManager) && (
              <>
                {permit.status === 'DRAFT' && isInitiator && (
                  <button onClick={onDelete} className="px-4 py-2.5 border border-red-200 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-medium flex items-center justify-center gap-2">
                    <Trash2 size={18} /><span className="sm:hidden">Удалить</span>
                  </button>
                )}
                <button onClick={onEdit} className="flex-1 sm:flex-none px-6 py-2.5 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium flex items-center justify-center gap-2">
                  <Edit3 size={18} /> Редактировать
                </button>
              </>
            )}
            {!isAuditor && (permit.status === 'DRAFT' || permit.status === 'REJECTED') && isInitiator && !electricalHasRequiredFields && (
              <div className="flex items-center text-amber-700 text-sm px-4 bg-amber-50 rounded-lg border border-amber-200 py-2.5 gap-2">
                <AlertTriangle size={16} />
                Наряд не заполнен полностью. Откройте редактирование и заполните обязательные поля.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (permit.category === PermitCategory.ELECTRICAL_NEW) {
    const disconnects = Array.isArray(data.electricalDisconnects) ? data.electricalDisconnects : [];
    const electricalNewHasRequiredFields = !!(
      data.workCategory &&
      data.admitting?.id &&
      (data.producer?.id || data.producer?.name)
    );
    const renderRole = (role: any) => {
      if (!role) return '—';
      if (typeof role === 'string') return role;
      return role.name || role.freeText || '—';
    };
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
        <button onClick={onBack} className="flex items-center text-gray-500 hover:text-gray-900 transition-colors w-fit text-lg font-medium">
          <ArrowLeft size={24} className="mr-2" /> Назад к списку
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* HEADER */}
          <div className="p-6 md:p-8 border-b border-gray-100 bg-gradient-to-r from-white to-slate-50/50">
            <div className="flex items-center gap-3 mb-2">
              <StatusBadge status={permit.status} />
              <span className="text-sm font-mono text-slate-400">#{permit.permitId}</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900 leading-tight">Работа на электроустановках</h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-yellow-100 text-yellow-700 border border-yellow-200">
                <Zap size={12}/> Тип наряда
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 mt-2">
              <MapPin size={18} className="text-indigo-500" />
              <span className="font-medium">{data.department || 'Электроустановка'}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-100 mt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600"><User size={20} /></div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Инициатор</p>
                  <p className="font-semibold text-slate-700">{initiator?.name || 'Неизвестно'}</p>
                  <p className="text-xs text-slate-500">{initiator?.position || 'Сотрудник'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm text-amber-500 shrink-0"><Clock size={20} /></div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Период работ</p>
                  <p className="font-semibold text-slate-700 leading-snug">
                    {data.dateStart ? data.dateStart : '—'}{data.dateEnd ? ` — ${data.dateEnd}` : ''}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Срок действия: 7 дней</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm text-rose-500"><AlertTriangle size={20} /></div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Категория работ</p>
                  <p className="font-semibold text-slate-700">{data.workCategory || '—'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* TABS */}
          <div className="border-b border-gray-200 px-6 md:px-8">
            <div className="flex gap-6 overflow-x-auto">
              {[
                { id: 'main' as const, label: 'Основное' },
                { id: 'team' as const, label: 'Бригада' },
                { id: 'checklist' as const, label: 'Чек лист' },
                { id: 'measures' as const, label: 'Меры подготовки' },
                { id: 'loto' as const, label: 'LOTO' },
                { id: 'admission' as const, label: 'Разрешение на допуск' },
                { id: 'daily' as const, label: 'Ежедневный допуск' },
                { id: 'brigade_change' as const, label: 'Изменение бригады' },
                { id: 'target_briefing' as const, label: 'Целевой инструктаж' },
                { id: 'work_completion' as const, label: 'Окончание работы' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setElectricalNewTab(tab.id)}
                  className={`pb-4 pt-4 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors whitespace-nowrap ${electricalNewTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* CONTENT */}
          <div className="p-6 md:p-8 min-h-[300px]">
            {electricalNewTab === 'main' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2"><FileText size={20} className="text-slate-400"/> Описание и условия работ</h3>
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-4">
                    <div><span className="text-xs font-bold text-gray-400 uppercase">Категория работ</span><p className="text-gray-900 font-medium text-lg">{data.workCategory || '—'}</p></div>
                    <div><span className="text-xs font-bold text-gray-400 uppercase">Поручается</span><p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{data.content || data.assignment || 'Описание отсутствует'}</p></div>
                    <div><span className="text-xs font-bold text-gray-400 uppercase">Место проведения</span><p className="text-gray-800">{data.workPlace || '—'}{data.department ? ` / ${data.department}` : ''}</p></div>
                  </div>
                </div>

                <ApprovalTracker steps={(permit as any).approvalSteps} />

                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><User size={20} className="text-slate-400"/> Ответственные лица</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg"><span className="text-xs text-gray-400 uppercase font-bold">Выдающий наряд</span><p className="font-medium text-gray-900">{renderRole(data.issuer)}</p></div>
                    <div className="p-4 border border-gray-200 rounded-lg"><span className="text-xs text-gray-400 uppercase font-bold">Ответственный руководитель работ</span><p className="font-medium text-gray-900">{renderRole(data.responsible)}</p></div>
                    <div className="p-4 border border-gray-200 rounded-lg"><span className="text-xs text-gray-400 uppercase font-bold">Допускающий</span><p className="font-medium text-gray-900">{renderRole(data.admitting)}</p></div>
                    <div className="p-4 border border-gray-200 rounded-lg"><span className="text-xs text-gray-400 uppercase font-bold">Производитель работ</span><p className="font-medium text-gray-900">{renderRole(data.producer)}</p></div>
                  </div>
                </div>
              </div>
            )}

            {electricalNewTab === 'measures' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Shield size={20} className="text-red-500"/> Меры по подготовке рабочих мест</h3>
                  <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Всего: {disconnects.length} п.</span>
                </div>
                {disconnects.length > 0 ? (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase">
                        <tr>
                          <th className="px-4 py-3 w-10">№</th>
                          <th className="px-4 py-3">Наименование электроустановки</th>
                          <th className="px-4 py-3">Что должно быть отключено и где заземлено</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {disconnects.map((row: any, idx: number) => (
                          <tr key={row.id || idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                            <td className="px-4 py-3 text-gray-900">{row.installationName || '—'}</td>
                            <td className="px-4 py-3 text-gray-600">{row.actionRequired || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">Меры подготовки не указаны</div>
                )}
                {(data as any).m5_10_additional && (
                  <div className="mt-5 p-4 border-l-4 border-red-500 bg-red-50/30 rounded-r-lg">
                    <h4 className="font-bold text-gray-700 text-sm mb-1">Дополнительные мероприятия</h4>
                    <p className="text-gray-900">{data.m5_10_additional}</p>
                  </div>
                )}
              </div>
            )}

            {electricalNewTab === 'team' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Users size={20} className="text-blue-500"/> Состав бригады</h3>
                  <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Всего: {(data.teamMembers || []).length} чел.</span>
                </div>
                {(data.teamMembers || []).length > 0 ? (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase">
                        <tr>
                          <th className="px-4 py-3 w-10">№</th>
                          <th className="px-4 py-3">ФИО</th>
                          <th className="px-4 py-3">Должность</th>
                          <th className="px-4 py-3">Инструктаж провел</th>
                          <th className="px-4 py-3">Дата</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(data.teamMembers || []).map((member: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{member.name}</td>
                            <td className="px-4 py-3 text-gray-600">{member.role}</td>
                            <td className="px-4 py-3 text-gray-600">{member.instructedBy || '—'}</td>
                            <td className="px-4 py-3 text-gray-500">{member.instructedAt ? new Date(member.instructedAt).toLocaleString() : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">Состав бригады не указан</div>
                )}
              </div>
            )}

            {electricalNewTab === 'checklist' && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardList size={20} className="text-orange-500"/>
                  <h3 className="text-lg font-bold text-slate-800">Чек-лист оценки риска</h3>
                </div>
                {data.checklist && Object.keys(data.checklist).length > 0 ? (
                  <ChecklistSection checklist={data.checklist as ChecklistData} onChange={() => {}} readOnly={true} />
                ) : (
                  <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">Чек-лист не заполнен</div>
                )}
              </div>
            )}

            {electricalNewTab === 'loto' && (
              <div>
                <IsolationMatrixForm
                  data={data.isolationMatrix || {}}
                  onChange={() => {}}
                  readOnly={true}
                  lotoPhotoUrl={permit.loto_photo || null}
                />
              </div>
            )}

            {electricalNewTab === 'admission' && (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={20} className="text-violet-600"/>
                  <h3 className="text-lg font-bold text-slate-800">Разрешение на допуск</h3>
                  <span className="text-sm text-gray-400 ml-auto">Таблица 2</span>
                  <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded border border-violet-200 font-medium">Заполняет: Допускающий</span>
                </div>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr>
                        <th rowSpan={2} className="px-2 py-2 text-left font-medium text-gray-700 border border-gray-300 bg-violet-50 w-1/5 text-xs">
                          Разрешение на подготовку рабочих мест и на допуск к работе получил
                        </th>
                        <th rowSpan={2} className="px-2 py-2 text-left font-medium text-gray-700 border border-gray-300 bg-gray-50 w-24 text-xs">
                          Дата, время
                        </th>
                        <th rowSpan={2} className="px-2 py-2 text-left font-medium text-gray-700 border border-gray-300 bg-gray-50 w-1/6 text-xs">
                          От кого (должность, фамилия)
                        </th>
                        <th rowSpan={2} className="px-2 py-2 text-left font-medium text-gray-700 border border-gray-300 bg-violet-50 w-24 text-xs">
                          Допускающий (подпись)
                        </th>
                        <th colSpan={2} className="px-2 py-2 text-center font-medium text-gray-700 border border-gray-300 bg-blue-50 text-xs">
                          Согласования на выполнения работ в зоне действия другого наряда
                        </th>
                      </tr>
                      <tr>
                        <th className="px-2 py-2 text-left font-medium text-gray-700 border border-gray-300 bg-gray-50 w-24 text-xs">
                          Дата, время
                        </th>
                        <th className="px-2 py-2 text-left font-medium text-gray-700 border border-gray-300 bg-gray-50 text-xs">
                          Согласовано
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.admissionRows || [{}]).map((row: any, idx: number) => (
                        <tr key={idx}>
                          <td className="px-2 py-2 border border-gray-300 text-gray-900 text-xs">{data.admitting?.name || '—'}</td>
                          <td className="px-2 py-2 border border-gray-300 text-gray-600 text-xs">
                            {(row.admissionDateTime || data.admissionDateTime)
                              ? new Date(row.admissionDateTime || data.admissionDateTime).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
                              : '—'}
                          </td>
                          <td className="px-2 py-2 border border-gray-300">
                            {isAdmittingUser && (permit.status === 'PENDING_APPROVAL' || permit.status === 'APPROVED') ? (
                              <input type="text" placeholder="Должность, ФИО"
                                defaultValue={row.fromWhom || ''}
                                onBlur={async (e) => {
                                  const val = e.target.value;
                                  const token = localStorage.getItem('auth_token');
                                  await fetch(`/api/v1/permits/${permit.id}/admission_row_update/`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
                                    body: JSON.stringify({ index: idx, fromWhom: val }),
                                  });
                                  onRefresh?.();
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-gray-900 focus:ring-1 focus:ring-violet-500"
                              />
                            ) : (
                              <span className="text-gray-600 text-xs">{row.fromWhom || '—'}</span>
                            )}
                          </td>
                          <td className="px-2 py-2 border border-gray-300">
                            {(row.admittingSignature || data.admissionSignature) ? (
                              <img src={getSignatureUrl(row.admittingSignature || data.admissionSignature)} alt="Подпись допускающего" className="h-8 object-contain"/>
                            ) : (
                              <span className="text-gray-400 italic text-xs">—</span>
                            )}
                          </td>
                          <td className="px-2 py-2 border border-gray-300 text-gray-600 text-xs">
                            {row.agreementDateTime
                              ? new Date(row.agreementDateTime).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
                              : '—'}
                          </td>
                          <td className="px-2 py-2 border border-gray-300">
                            {row.agreementUser ? (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1">
                                  <span className="text-xs font-medium text-gray-900">{row.agreementUser.name || row.agreementUser.username}</span>
                                  {isAdmittingUser && !row.agreementSignature && (
                                    <div
                                      onClick={() => {
                                        const token = localStorage.getItem('auth_token');
                                        fetch(`/api/v1/permits/${permit.id}/admission_row_update/`, {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
                                          body: JSON.stringify({ index: idx, agreementUser: null }),
                                        }).then(() => onRefresh?.());
                                      }}
                                      className="text-gray-400 hover:text-red-500 text-sm font-bold px-1 cursor-pointer inline-block border border-transparent hover:border-red-200 rounded">&times;</div>
                                  )}
                                </div>
                                {row.agreementSignature ? (
                                  <img src={getSignatureUrl(row.agreementSignature)} alt="Подпись" className="h-8 object-contain"/>
                                ) : (isAdmittingUser || (row.agreementUser?.id && String(row.agreementUser.id) === currentUserId)) && (permit.status === 'PENDING_APPROVAL' || permit.status === 'APPROVED') ? (
                                  <button onClick={() => {
                                    setAgreementPadIndex(idx);
                                    setAgreementPadOpen(true);
                                  }}
                                    className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-medium rounded hover:bg-blue-700 transition-colors">
                                    Подписать
                                  </button>
                                ) : (
                                  <span className="text-xs text-amber-600 italic">Ожидает подписи</span>
                                )}
                              </div>
                            ) : isAdmittingUser && (permit.status === 'PENDING_APPROVAL' || permit.status === 'APPROVED') ? (
                              <input type="text" placeholder="Поиск..."
                                onChange={async (e) => {
                                  const q = e.target.value;
                                  if (q.length < 2) return;
                                  const token = localStorage.getItem('auth_token');
                                  const res = await fetch(`/api/v1/users/?search=${encodeURIComponent(q)}`, { headers: { 'Authorization': `Token ${token}` } });
                                  if (res.ok) {
                                    const users = await res.json();
                                    setAgreementSearchResults(Array.isArray(users) ? users : (users.results || []));
                                    setAgreementSearchRow(idx);
                                  }
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-gray-900 focus:ring-1 focus:ring-violet-500"
                              />
                            ) : (
                              <span className="text-gray-400 italic text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {(data.admissionRows || []).length === 0 && (
                  <p className="text-sm text-gray-400 italic mt-3">Таблица не заполнена</p>
                )}
                <div className="mt-6 text-sm text-gray-700 space-y-4">
                  <div>
                    <label className="font-medium block mb-1">Рабочие места подготовлены. Под напряжением остались:</label>
                    {isAdmittingUser && (permit.status === 'PENDING_APPROVAL' || permit.status === 'APPROVED') ? (
                      <textarea rows={3} placeholder="Укажите рабочие места..."
                        defaultValue={data.admissionVoltageNote || ''}
                        onBlur={async (e) => {
                          const token = localStorage.getItem('auth_token');
                          await fetch(`/api/v1/permits/${permit.id}/admission_row_update/`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
                            body: JSON.stringify({ admissionVoltageNote: e.target.value }),
                          });
                          onRefresh?.();
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-violet-500 resize-none"
                      />
                    ) : (
                      <p className="whitespace-pre-wrap">{data.admissionVoltageNote || 'Не заполнено'}</p>
                    )}
                  </div>
                  <div className="flex justify-between items-end pt-4">
                    <div className="text-center">
                      <p className="font-medium">Допускающий</p>
                      {data.admissionSignature ? (
                        <img src={getSignatureUrl(data.admissionSignature)} alt="Подпись допускающего" className="h-12 mt-2 object-contain"/>
                      ) : (isAdmittingUser && (permit.status === 'PENDING_APPROVAL' || permit.status === 'APPROVED')) ? (
                        <button onClick={() => setAdmissionPadOpen(true)} className="mt-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors">
                          Подписать
                        </button>
                      ) : (
                        <div className="w-48 border-b border-gray-400 mt-6"></div>
                      )}
                      <p className="text-xs text-gray-400 mt-1">(подпись)</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">Ответственный руководитель работ</p>
                      {data.responsibleSignature ? (
                        <img src={getSignatureUrl(data.responsibleSignature)} alt="Подпись ответственного руководителя" className="h-12 mt-2 object-contain"/>
                      ) : (isResponsibleUser && (permit.status === 'PENDING_APPROVAL' || permit.status === 'APPROVED')) ? (
                        <button onClick={() => setResponsiblePadOpen(true)} className="mt-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
                          Подписать
                        </button>
                      ) : data.responsible ? (
                        <div className="w-48 border-b border-gray-400 mt-6"></div>
                      ) : (
                        <p className="text-xs text-gray-400 mt-2 italic">Не назначен</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">(подпись)</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {electricalNewTab === 'daily' && (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardList size={20} className="text-blue-600"/>
                  <h3 className="text-lg font-bold text-slate-800">Ежедневный допуск к работе и время ее окончания</h3>
                  <span className="text-sm text-gray-400 ml-auto">Таблица 3</span>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 font-medium leading-tight">Заполняет: Допускающий /<br/>Производитель работ</span>
                  {(isAdmittingUser || isProducerUser) && (permit.status === 'PENDING_APPROVAL' || permit.status === 'APPROVED') && (
                    (data.dailyAdmissions || []).length < 10 && (
                      <button onClick={async () => {
                        const token = localStorage.getItem('auth_token');
                        await fetch(`/api/v1/permits/${permit.id}/daily_admission_add_row/`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
                          body: JSON.stringify({}),
                        });
                        onRefresh?.();
                      }} className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 flex items-center gap-1">
                        <Plus size={14} /> Добавить строку
                      </button>
                    )
                  )}
                </div>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr>
                        <th colSpan={4} className="px-2 py-2 text-center font-medium text-gray-700 border border-gray-300 bg-blue-50 text-xs">
                          Бригада получила целевой инструктаж и допущена на подготовленное рабочее место
                        </th>
                        <th colSpan={2} className="px-2 py-2 text-center font-medium text-gray-700 border border-gray-300 bg-emerald-50 text-xs">
                          Работа закончена, бригада удалена
                        </th>
                      </tr>
                      <tr>
                        <th className="px-2 py-2 text-left font-medium text-gray-700 border border-gray-300 bg-gray-50 w-1/5 text-xs">Наименование рабочего места</th>
                        <th className="px-2 py-2 text-left font-medium text-gray-700 border border-gray-300 bg-gray-50 w-28 text-xs">Дата, время</th>
                        <th className="px-2 py-2 text-left font-medium text-gray-700 border border-gray-300 bg-gray-50 text-xs">Подпись допускающего</th>
                        <th className="px-2 py-2 text-left font-medium text-gray-700 border border-gray-300 bg-gray-50 text-xs">Подпись производителя (наблюдающего)</th>
                        <th className="px-2 py-2 text-left font-medium text-gray-700 border border-gray-300 bg-gray-50 w-28 text-xs">Дата, время</th>
                        <th className="px-2 py-2 text-left font-medium text-gray-700 border border-gray-300 bg-gray-50 text-xs">Подпись производителя (наблюдающего)</th>
                        {(isAdmittingUser || isProducerUser) && <th className="px-2 py-2 w-8 border border-gray-300 bg-gray-50"></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {(data.dailyAdmissions || [{}]).map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="px-2 py-2 border border-gray-300">
                            {(isAdmittingUser || isProducerUser) && (permit.status === 'PENDING_APPROVAL' || permit.status === 'APPROVED') ? (
                              <input type="text" placeholder="Наименование..."
                                defaultValue={row.workplace || ''}
                                onBlur={async (e) => {
                                  const token = localStorage.getItem('auth_token');
                                  await fetch(`/api/v1/permits/${permit.id}/daily_admission_update/`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
                                    body: JSON.stringify({ index: idx, workplace: e.target.value }),
                                  });
                                  onRefresh?.();
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-gray-900 focus:ring-1 focus:ring-blue-500"
                              />
                            ) : (
                              <span className="text-gray-900 text-xs">{row.workplace || '—'}</span>
                            )}
                          </td>
                          <td className="px-2 py-2 border border-gray-300 text-gray-600 text-xs">
                            {row.admissionDateTime
                              ? new Date(row.admissionDateTime).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
                              : '—'}
                          </td>
                          <td className="px-2 py-2 border border-gray-300">
                            {row.admittingSignature ? (
                              <img src={getSignatureUrl(row.admittingSignature)} alt="Подпись допускающего" className="h-8 object-contain"/>
                            ) : (isAdmittingUser && (permit.status === 'PENDING_APPROVAL' || permit.status === 'APPROVED')) ? (
                              <button onClick={() => { setDailyAdmitPadIndex(idx); setDailyAdmitPadOpen(true); }}
                                className="px-2 py-0.5 bg-violet-600 text-white text-[10px] font-medium rounded hover:bg-violet-700">Подписать</button>
                            ) : <span className="text-gray-400 italic text-xs">—</span>}
                          </td>
                          <td className="px-2 py-2 border border-gray-300">
                            {row.producerAdmissionSignature ? (
                              <img src={getSignatureUrl(row.producerAdmissionSignature)} alt="Подпись производителя" className="h-8 object-contain"/>
                            ) : (isProducerUser && (permit.status === 'PENDING_APPROVAL' || permit.status === 'APPROVED')) ? (
                              <button onClick={() => { setDailyProdAdmitPadIndex(idx); setDailyProdAdmitPadOpen(true); }}
                                className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-medium rounded hover:bg-emerald-700">Подписать</button>
                            ) : <span className="text-gray-400 italic text-xs">—</span>}
                          </td>
                          <td className="px-2 py-2 border border-gray-300 text-gray-600 text-xs">
                            {row.completionDateTime
                              ? new Date(row.completionDateTime).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
                              : '—'}
                          </td>
                          <td className="px-2 py-2 border border-gray-300">
                            {row.producerCompletionSignature ? (
                              <img src={getSignatureUrl(row.producerCompletionSignature)} alt="Подпись производителя" className="h-8 object-contain"/>
                            ) : (isProducerUser && (permit.status === 'PENDING_APPROVAL' || permit.status === 'APPROVED')) ? (
                              <button onClick={() => { setDailyProdCompPadIndex(idx); setDailyProdCompPadOpen(true); }}
                                className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-medium rounded hover:bg-emerald-700">Подписать</button>
                            ) : <span className="text-gray-400 italic text-xs">—</span>}
                          </td>
                          {(isAdmittingUser || isProducerUser) && (
                            <td className="px-2 py-2 border border-gray-300 text-center">
                              {!row.admittingSignature && !row.producerAdmissionSignature && !row.producerCompletionSignature && (
                                <button onClick={async () => {
                                  if (!confirm('Удалить строку?')) return;
                                  const token = localStorage.getItem('auth_token');
                                  await fetch(`/api/v1/permits/${permit.id}/daily_admission_delete_row/`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
                                    body: JSON.stringify({ index: idx }),
                                  });
                                  onRefresh?.();
                                }}
                                  className="text-gray-400 hover:text-red-500 text-xs">✕</button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {(!data.dailyAdmissions || data.dailyAdmissions.length === 0) && (
                  <p className="text-sm text-gray-400 italic mt-3">Таблица не заполнена. Нажмите «Добавить строку».</p>
                )}
              </div>
            )}

            {electricalNewTab === 'brigade_change' && (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <Users size={20} className="text-blue-600"/>
                  <h3 className="text-lg font-bold text-slate-800">Изменения в составе бригады</h3>
                  <span className="text-sm text-gray-400 ml-auto">Таблица 4</span>
                  {isIssuerUser && (data.brigadeChanges || []).length < 10 && (permit.status === 'PENDING_APPROVAL' || permit.status === 'APPROVED') && (
                    <button onClick={async () => {
                      const token = localStorage.getItem('auth_token');
                      await fetch(`/api/v1/permits/${permit.id}/add_brigade_change/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
                        body: JSON.stringify({}),
                      });
                      onRefresh?.();
                    }} className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 flex items-center gap-1">
                      <Plus size={14} /> Добавить строку
                    </button>
                  )}
                </div>
                <div className="border border-gray-200 rounded-lg overflow-visible">
                  <table className="w-full text-sm border-collapse table-fixed">
                    <thead>
                      <tr>
                        <th className="px-3 py-3 text-left font-medium text-gray-700 border border-gray-300 bg-gray-50 text-xs w-[30%]">
                          Введен в состав бригады (ФИО, должность)
                        </th>
                        <th className="px-3 py-3 text-left font-medium text-gray-700 border border-gray-300 bg-gray-50 text-xs w-[30%]">
                          Выведен из состава бригады (ФИО, должность)
                        </th>
                        <th className="px-3 py-3 text-left font-medium text-gray-700 border border-gray-300 bg-gray-50 text-xs w-[15%]">
                          Дата, время
                        </th>
                        <th className="px-3 py-3 text-left font-medium text-gray-700 border border-gray-300 bg-gray-50 text-xs w-[17%]">
                          Разрешил (подпись)
                        </th>
                        <th className="px-3 py-2 border border-gray-300 bg-gray-50 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.brigadeChanges || []).map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="px-3 py-3 border border-gray-300 min-h-[48px]">
                            {isIssuerUser && !row.signature ? (
                              <UserSearchInput
                                value={row.addedUser ? { userId: row.addedUser.userId, name: row.addedUser.name, position: row.addedUser.position } : null}
                                onChange={async (sel) => {
                                  const token = localStorage.getItem('auth_token');
                                  await fetch(`/api/v1/permits/${permit.id}/update_brigade_change/`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
                                    body: JSON.stringify({
                                      index: idx,
                                      added: sel ? { userId: sel.userId, name: sel.name, position: sel.position } : null,
                                    }),
                                  });
                                  onRefresh?.();
                                }}
                              />
                            ) : (
                              <span className="text-xs text-gray-900">
                                {row.addedUser ? `${row.addedUser.name}${row.addedUser.position ? ', ' + row.addedUser.position : ''}` : '—'}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 border border-gray-300 min-h-[48px]">
                            {isIssuerUser && !row.signature ? (
                              <UserSearchInput
                                value={row.removedUser ? { userId: row.removedUser.userId, name: row.removedUser.name, position: row.removedUser.position } : null}
                                onChange={async (sel) => {
                                  const token = localStorage.getItem('auth_token');
                                  await fetch(`/api/v1/permits/${permit.id}/update_brigade_change/`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
                                    body: JSON.stringify({
                                      index: idx,
                                      removed: sel ? { userId: sel.userId, name: sel.name, position: sel.position } : null,
                                    }),
                                  });
                                  onRefresh?.();
                                }}
                              />
                            ) : (
                              <span className="text-xs text-gray-900">
                                {row.removedUser ? `${row.removedUser.name}${row.removedUser.position ? ', ' + row.removedUser.position : ''}` : '—'}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 border border-gray-300 text-gray-600 text-xs">
                            {row.dateTime
                              ? new Date(row.dateTime).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                              : '—'}
                          </td>
                          <td className="px-3 py-2 border border-gray-300">
                            {row.signature ? (
                              <div>
                                <span className="text-[10px] text-blue-600 font-medium block">✓ Подписано (ЭЦП)</span>
                                <span className="text-[10px] text-gray-500 block">{row.signedBy || data.issuer?.name || '—'}</span>
                              </div>
                            ) : isIssuerUser && (permit.status === 'PENDING_APPROVAL' || permit.status === 'APPROVED') ? (
                              <button onClick={() => handleBrigadeChangeSign(idx)}
                                className="px-2 py-1 bg-blue-600 text-white text-[10px] font-medium rounded hover:bg-blue-700">
                                Подписать (ЭЦП)
                              </button>
                            ) : (
                              <span className="text-gray-400 italic text-xs">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 border border-gray-300 text-center">
                            {isIssuerUser && !row.signature && (
                              <button onClick={async () => {
                                if (!confirm('Удалить строку?')) return;
                                const token = localStorage.getItem('auth_token');
                                await fetch(`/api/v1/permits/${permit.id}/delete_brigade_change/`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
                                  body: JSON.stringify({ index: idx }),
                                });
                                onRefresh?.();
                              }}
                                className="text-gray-400 hover:text-red-500 text-xs">&times;</button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {(!data.brigadeChanges || data.brigadeChanges.length === 0) && (
                        <tr>
                          <td colSpan={5} className="px-3 py-6 text-center text-gray-400 text-xs border border-gray-300">
                            Изменений в составе бригады не было
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {electricalNewTab === 'target_briefing' && (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardList size={20} className="text-blue-600"/>
                  <h3 className="text-lg font-bold text-slate-800">Регистрация целевого инструктажа при первичном допуске</h3>
                  <span className="text-sm text-gray-400 ml-auto">Таблица 5</span>
                </div>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr>
                        <th className="px-3 py-2 text-center font-medium text-gray-700 border border-gray-300 bg-blue-50 text-xs">
                          Инструктаж провел
                        </th>
                        <th className="px-3 py-2 text-center font-medium text-gray-700 border border-gray-300 bg-emerald-50 text-xs">
                          Инструктаж получил
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Строка 1: Выдающий наряд (ЭЦП) / Инструктаж получил */}
                      <tr className="hover:bg-gray-50/50">
                        <td className="px-3 py-3 border border-gray-300">
                          <div className="text-xs font-medium text-gray-900 mb-1">Выдающий наряд</div>
                          <div className="text-[11px] text-gray-700">{data.issuer?.name || '—'} {data.issuer?.position || ''}</div>
                          {data.targetBriefing?.row1?.instructedBySignature ? (
                            data.targetBriefing.row1.instructedBySignature.endsWith('.xml') ? (
                              <span className="text-[10px] text-blue-600 font-medium mt-1 block">✓ Подписано (ЭЦП)</span>
                            ) : (
                              <img src={getSignatureUrl(data.targetBriefing.row1.instructedBySignature)} alt="Подпись" className="h-8 object-contain mt-1"/>
                            )
                          ) : issuerStep?.status === 'APPROVED' ? (
                            <span className="text-[10px] text-blue-600 font-medium mt-1 block">✓ Подписано (ЭЦП)</span>
                          ) : isIssuerUser && (permit.status === 'PENDING_APPROVAL' || permit.status === 'APPROVED') ? (
                            <button onClick={() => handleSign('ISSUER')}
                              className="mt-1 px-3 py-1 bg-blue-600 text-white text-[10px] font-medium rounded hover:bg-blue-700">
                              Подписать (ЭЦП)
                            </button>
                          ) : <div className="w-32 border-b border-gray-400 mt-2"></div>}
                        </td>
                        <td className="px-3 py-3 border border-gray-300">
                          <div className="text-xs font-medium text-gray-900 mb-1">
                            {data.responsible?.name ? 'Ответственный руководитель работ' : 'Производитель работ (наблюдающий)'}
                          </div>
                          <div className="text-[11px] text-gray-700">
                            {data.responsible?.name || data.producer?.name || '—'} {data.responsible?.position || data.producer?.position || ''}
                          </div>
                          {data.targetBriefing?.row1?.receivedBySignature ? (
                            data.targetBriefing.row1.receivedBySignature.endsWith('.xml') ? (
                              <span className="text-[10px] text-blue-600 font-medium mt-1 block">✓ Подписано (ЭЦП)</span>
                            ) : (
                              <img src={getSignatureUrl(data.targetBriefing.row1.receivedBySignature)} alt="Подпись" className="h-8 object-contain mt-1"/>
                            )
                          ) : (permit.status === 'PENDING_APPROVAL' || permit.status === 'APPROVED') ? (
                            data.responsible?.name ? (
                              isResponsibleUser ? (
                                <button onClick={() => handleTargetBriefingEcpp('row1', 'receivedBy')}
                                  className="mt-1 px-3 py-1 bg-blue-600 text-white text-[10px] font-medium rounded hover:bg-blue-700">
                                  Подписать (ЭЦП)
                                </button>
                              ) : <div className="w-32 border-b border-gray-400 mt-2"></div>
                            ) : (
                              isProducerUser ? (
                                <button onClick={() => {
                                  pendingTBRowRef.current = 'row1';
                                  pendingTBSideRef.current = 'receivedBy';
                                  setTargetBriefingPadOpen(true);
                                }}
                                  className="mt-1 px-3 py-1 bg-emerald-600 text-white text-[10px] font-medium rounded hover:bg-emerald-700">
                                  Подписать (графически)
                                </button>
                              ) : <div className="w-32 border-b border-gray-400 mt-2"></div>
                            )
                          ) : <div className="w-32 border-b border-gray-400 mt-2"></div>}
                        </td>
                      </tr>
                      {/* Строка 2: Допускающий (графическая) / Инструктаж получил */}
                      <tr className="hover:bg-gray-50/50">
                        <td className="px-3 py-3 border border-gray-300">
                          <div className="text-xs font-medium text-gray-900 mb-1">Допускающий</div>
                          <div className="text-[11px] text-gray-700">{data.admitting?.name || '—'} {data.admitting?.position || ''}</div>
                          {data.targetBriefing?.row2?.instructedBySignature ? (
                            <img src={getSignatureUrl(data.targetBriefing.row2.instructedBySignature)} alt="Подпись" className="h-8 object-contain mt-1"/>
                          ) : isAdmittingUser && (permit.status === 'PENDING_APPROVAL' || permit.status === 'APPROVED') ? (
                            <button onClick={() => {
                              pendingTBRowRef.current = ('row2');
                              pendingTBSideRef.current = ('instructedBy');
                              setTargetBriefingPadOpen(true);
                            }}
                              className="mt-1 px-3 py-1 bg-violet-600 text-white text-[10px] font-medium rounded hover:bg-violet-700">
                              Подписать (графически)
                            </button>
                          ) : <div className="w-32 border-b border-gray-400 mt-2"></div>}
                          <div className="text-[10px] text-gray-400 mt-1">(подпись)</div>
                        </td>
                        <td className="px-3 py-3 border border-gray-300">
                          {data.responsible?.name && (
                            <>
                              <div className="text-xs font-medium text-gray-900 mb-1">Ответственный руководитель работ</div>
                              <div className="text-[11px] text-gray-700">{data.responsible.name} {data.responsible.position || ''}</div>
                              {data.targetBriefing?.row2?.receivedBySignature ? (
                                data.targetBriefing.row2.receivedBySignature.endsWith('.xml') ? (
                                  <span className="text-[10px] text-blue-600 font-medium mt-1 block">✓ Подписано (ЭЦП)</span>
                                ) : (
                                  <img src={getSignatureUrl(data.targetBriefing.row2.receivedBySignature)} alt="Подпись" className="h-8 object-contain mt-1"/>
                                )
                              ) : (permit.status === 'PENDING_APPROVAL' || permit.status === 'APPROVED') && isResponsibleUser ? (
                                <button onClick={() => handleTargetBriefingEcpp('row2', 'receivedBy')}
                                  className="mt-1 px-3 py-1 bg-blue-600 text-white text-[10px] font-medium rounded hover:bg-blue-700">
                                  Подписать (ЭЦП)
                                </button>
                              ) : <div className="w-32 border-b border-gray-400 mt-2"></div>}
                            </>
                          )}
                          <div className={`text-xs font-medium text-gray-900 ${data.responsible?.name ? 'mt-2' : ''} mb-1`}>
                            Производитель работ (наблюдающий)
                          </div>
                          <div className="text-[11px] text-gray-700">
                            {data.producer?.name || '—'} {data.producer?.position || ''}
                          </div>
                          {data.targetBriefing?.row2?.receivedBySignature ? (
                            data.targetBriefing.row2.receivedBySignature.endsWith('.xml') ? (
                              <span className="text-[10px] text-blue-600 font-medium mt-1 block">✓ Подписано (ЭЦП)</span>
                            ) : (
                              <img src={getSignatureUrl(data.targetBriefing.row2.receivedBySignature)} alt="Подпись" className="h-8 object-contain mt-1"/>
                            )
                          ) : (permit.status === 'PENDING_APPROVAL' || permit.status === 'APPROVED') ? (
                            data.responsible?.name ? (
                              isResponsibleUser ? (
                                <button onClick={() => handleTargetBriefingEcpp('row2', 'receivedBy')}
                                  className="mt-1 px-3 py-1 bg-blue-600 text-white text-[10px] font-medium rounded hover:bg-blue-700">
                                  Подписать (ЭЦП)
                                </button>
                              ) : <div className="w-32 border-b border-gray-400 mt-2"></div>
                            ) : (
                              isProducerUser ? (
                                <button onClick={() => {
                                  pendingTBRowRef.current = 'row2';
                                  pendingTBSideRef.current = 'receivedBy';
                                  setTargetBriefingPadOpen(true);
                                }}
                                  className="mt-1 px-3 py-1 bg-emerald-600 text-white text-[10px] font-medium rounded hover:bg-emerald-700">
                                  Подписать (графически)
                                </button>
                              ) : <div className="w-32 border-b border-gray-400 mt-2"></div>
                            )
                          ) : <div className="w-32 border-b border-gray-400 mt-2"></div>}
                          <div className="text-xs font-medium text-gray-900 mt-2 mb-1">Члены бригады</div>
                          <div className="space-y-1">
                            {(data.teamMembers || []).map((member: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-1">
                                <div className="flex-1">
                                  <span className="text-[11px] text-gray-700">{member.name || '—'}</span>
                                  {member.role && <span className="text-[10px] text-gray-500">({member.role})</span>}
                                </div>
                                {data.targetBriefing?.[`received_${idx}`] ? (
                                  <img src={getSignatureUrl(data.targetBriefing[`received_${idx}`])} alt="Подпись" className="h-5 object-contain"/>
                                ) : (member.userId && String(member.userId) === currentUserId) && (permit.status === 'PENDING_APPROVAL' || permit.status === 'APPROVED') ? (
                                  <button onClick={() => {
                                    pendingTBRowRef.current = 'row2';
                                    pendingTBSideRef.current = `received_${idx}`;
                                    setTargetBriefingPadOpen(true);
                                  }}
                                    className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded hover:bg-emerald-700">
                                    Подписать
                                  </button>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                      {/* Строка 3: Ответственный руководитель/Производитель (Инструктаж провел) / Члены бригады */}
                      <tr className="hover:bg-gray-50/50">
                        <td className="px-3 py-3 border border-gray-300">
                          <div className="text-xs font-medium text-gray-900 mb-1">
                            {data.responsible?.name ? 'Ответственный руководитель работ' : 'Производитель работ (наблюдающий)'}
                          </div>
                          <div className="text-[11px] text-gray-700">
                            {data.responsible?.name || data.producer?.name || '—'} {data.responsible?.position || data.producer?.position || ''}
                          </div>
                          {data.targetBriefing?.row3?.instructedBySignature ? (
                            <img src={getSignatureUrl(data.targetBriefing.row3.instructedBySignature)} alt="Подпись" className="h-8 object-contain mt-1"/>
                          ) : (permit.status === 'PENDING_APPROVAL' || permit.status === 'APPROVED') ? (
                            data.responsible?.name ? (
                              isResponsibleUser ? (
                                <button onClick={() => handleTargetBriefingEcpp('row3', 'instructedBy')}
                                  className="mt-1 px-3 py-1 bg-blue-600 text-white text-[10px] font-medium rounded hover:bg-blue-700">
                                  Подписать (ЭЦП)
                                </button>
                              ) : <div className="w-32 border-b border-gray-400 mt-2"></div>
                            ) : (
                              isProducerUser ? (
                                <button onClick={() => {
                                  pendingTBRowRef.current = 'row3';
                                  pendingTBSideRef.current = 'instructedBy';
                                  setTargetBriefingPadOpen(true);
                                }}
                                  className="mt-1 px-3 py-1 bg-emerald-600 text-white text-[10px] font-medium rounded hover:bg-emerald-700">
                                  Подписать (графически)
                                </button>
                              ) : <div className="w-32 border-b border-gray-400 mt-2"></div>
                            )
                          ) : <div className="w-32 border-b border-gray-400 mt-2"></div>}
                        </td>
                        <td className="px-3 py-3 border border-gray-300">
                          <div className="text-xs font-medium text-gray-900 mb-1">Члены бригады</div>
                          <div className="space-y-1 mt-1">
                            {(data.teamMembers || []).map((member: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-1">
                                <div className="flex-1">
                                  <span className="text-[11px] text-gray-700">{member.name || '—'}</span>
                                  {member.role && <span className="text-[10px] text-gray-500 ml-1">({member.role})</span>}
                                  {data.targetBriefing?.[`received_${idx}_date`] && (
                                    <span className="text-[10px] text-gray-400 ml-1">{new Date(data.targetBriefing[`received_${idx}_date`]).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                  )}
                                </div>
                                {data.targetBriefing?.[`received_${idx}`] ? (
                                  <img src={getSignatureUrl(data.targetBriefing[`received_${idx}`])} alt="Подпись" className="h-5 object-contain"/>
                                ) : (member.userId && String(member.userId) === currentUserId) && (permit.status === 'PENDING_APPROVAL' || permit.status === 'APPROVED') ? (
                                  <button onClick={() => {
                                    pendingTBRowRef.current = 'row3';
                                    pendingTBSideRef.current = `received_${idx}`;
                                    setTargetBriefingPadOpen(true);
                                  }}
                                    className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded hover:bg-emerald-700">
                                    Подписать
                                  </button>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {electricalNewTab === 'work_completion' && (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={20} className="text-blue-600"/>
                  <h3 className="text-lg font-bold text-slate-800">Окончание работы</h3>
                  <span className="text-sm text-gray-400 ml-auto">Таблица 6</span>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700 font-medium">Работа полностью закончена, бригада удалена, заземления, установленные бригадой, сняты.</p>
                </div>
                <div className="overflow-visible border border-gray-200 rounded-lg">
                  <table className="w-full text-sm border-collapse table-fixed">
                    <thead>
                      <tr>
                        <th className="px-3 py-3 text-left font-medium text-gray-700 border border-gray-300 bg-gray-50 text-xs w-1/4">
                          ФИО
                        </th>
                        <th className="px-3 py-3 text-left font-medium text-gray-700 border border-gray-300 bg-gray-50 text-xs w-1/4">
                          Подпись
                        </th>
                        <th className="px-3 py-3 text-left font-medium text-gray-700 border border-gray-300 bg-gray-50 text-xs w-1/5">
                          Дата, время
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Строка 1: Сообщено (кому) — заполняет Производитель работ */}
                      <tr>
                        <td className="px-3 py-3 border border-gray-300">
                          <div className="text-xs font-medium text-gray-900 mb-1">Сообщено (кому)</div>
                          {isProducerUser && !data.workCompletion?.producerSignature && (permit.status === 'PENDING_APPROVAL' || permit.status === 'APPROVED') ? (
                            <UserSearchInput
                              value={data.workCompletion?.notifiedUser ? { userId: data.workCompletion.notifiedUser.userId, name: data.workCompletion.notifiedUser.name, position: data.workCompletion.notifiedUser.position } : null}
                              onChange={async (sel) => {
                                const token = localStorage.getItem('auth_token');
                                await fetch(`/api/v1/permits/${permit.id}/work_completion_update/`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
                                  body: JSON.stringify({ notifiedUser: sel }),
                                });
                                onRefresh?.();
                              }}
                            />
                          ) : data.workCompletion?.notifiedUser ? (
                            <div>
                              <span className="text-[11px] text-gray-700">{data.workCompletion.notifiedUser.name}</span>
                              {data.workCompletion.notifiedUser.position && (
                                <span className="text-[10px] text-gray-500 ml-1">({data.workCompletion.notifiedUser.position})</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-xs">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 border border-gray-300">
                          {data.workCompletion?.producerSignature ? (
                            <img src={getSignatureUrl(data.workCompletion.producerSignature)} alt="Подпись" className="h-8 object-contain"/>
                          ) : isProducerUser && (permit.status === 'PENDING_APPROVAL' || permit.status === 'APPROVED') ? (
                            <button onClick={() => {
                              setWorkCompletionField('producerSignature');
                              setWorkCompletionPadOpen(true);
                            }}
                              className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded hover:bg-emerald-700">
                              Подписать (графически)
                            </button>
                          ) : <span className="text-gray-400 italic text-xs">—</span>}
                        </td>
                        <td className="px-3 py-2 border border-gray-300 text-gray-600 text-xs">
                          {data.workCompletion?.producerSignedAt
                            ? new Date(data.workCompletion.producerSignedAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </td>
                      </tr>
                      {/* Строка 2: Ответственный руководитель работ — только если назначен */}
                      {data.responsible?.name && (
                        <tr>
                          <td className="px-3 py-3 border border-gray-300">
                            <div className="text-xs font-medium text-gray-900 mb-1">Ответственный руководитель работ</div>
                            <div className="text-[11px] text-gray-700">{data.responsible.name} {data.responsible.position || ''}</div>
                          </td>
                          <td className="px-3 py-3 border border-gray-300">
                            {data.workCompletion?.responsibleSignature ? (
                              <img src={getSignatureUrl(data.workCompletion.responsibleSignature)} alt="Подпись" className="h-8 object-contain"/>
                            ) : (permit.status === 'PENDING_APPROVAL' || permit.status === 'APPROVED') && isResponsibleUser ? (
                              <button onClick={() => {
                                setWorkCompletionField('responsibleSignature');
                                setWorkCompletionPadOpen(true);
                              }}
                                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700">
                                Подписать (ЭЦП)
                              </button>
                            ) : <span className="text-gray-400 italic text-xs">—</span>}
                          </td>
                          <td className="px-3 py-2 border border-gray-300 text-gray-600 text-xs">
                            {data.workCompletion?.responsibleSignedAt
                              ? new Date(data.workCompletion.responsibleSignedAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                              : '—'}
                          </td>
                        </tr>
                      )}
                      {/* Строка 3: Допускающий */}
                      <tr>
                        <td className="px-3 py-3 border border-gray-300">
                          <div className="text-xs font-medium text-gray-900 mb-1">Допускающий</div>
                          <div className="text-[11px] text-gray-700">{data.admitting?.name || '—'} {data.admitting?.position || ''}</div>
                        </td>
                        <td className="px-3 py-3 border border-gray-300">
                          {data.workCompletion?.admittingSignature ? (
                            <img src={getSignatureUrl(data.workCompletion.admittingSignature)} alt="Подпись" className="h-8 object-contain"/>
                          ) : (permit.status === 'PENDING_APPROVAL' || permit.status === 'APPROVED') && isAdmittingUser ? (
                            <button onClick={() => {
                              setWorkCompletionField('admittingSignature');
                              setWorkCompletionPadOpen(true);
                            }}
                              className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded hover:bg-emerald-700">
                              Подписать (графически)
                            </button>
                          ) : <span className="text-gray-400 italic text-xs">—</span>}
                        </td>
                        <td className="px-3 py-2 border border-gray-300 text-gray-600 text-xs">
                          {data.workCompletion?.admittingSignedAt
                            ? new Date(data.workCompletion.admittingSignedAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg md:relative md:bg-transparent md:border-0 md:shadow-none md:p-0 z-20">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row gap-3 justify-end">
            {!isAuditor && (((permit.status === 'DRAFT' || permit.status === 'REJECTED') && isInitiator) || canEditAsManager) && (
              <>
                {permit.status === 'DRAFT' && isInitiator && (
                  <button onClick={onDelete} className="px-4 py-2.5 border border-red-200 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-medium flex items-center justify-center gap-2">
                    <Trash2 size={18} /><span className="sm:hidden">Удалить</span>
                  </button>
                )}
                <button onClick={onEdit} className="flex-1 sm:flex-none px-6 py-2.5 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium flex items-center justify-center gap-2">
                  <Edit3 size={18} /> Редактировать
                </button>
              </>
            )}
            {!isAuditor && (permit.status === 'DRAFT' || permit.status === 'REJECTED') && isInitiator && !electricalNewHasRequiredFields && (
              <div className="flex items-center text-amber-700 text-sm px-4 bg-amber-50 rounded-lg border border-amber-200 py-2.5 gap-2">
                <AlertTriangle size={16} />
                Наряд не заполнен полностью. Откройте редактирование и заполните обязательные поля.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }


  // --- ОБЫЧНЫЕ НАРЯДЫ ---
  const [activeTab, setActiveTab] = useState<'info' | 'safety' | 'team' | 'checklist' | 'loto'>('info');
  const { signXml, loading, error: ncaError } = useNCALayer();
  const [producerClosePadOpen, setProducerClosePadOpen] = useState(false);

  // --- HANDLERS ---

  // 👇 ФУНКЦИЯ КОПИРОВАНИЯ
  const handleDuplicate = async () => {
      const ok = await confirmDialog({
        title: 'Новый черновик',
        message: 'Создать новый черновик на основе этого наряда?',
        confirmText: 'Создать черновик',
      });
      if (!ok) return;

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

      const signedXml = await signXml(xmlToSign, signerIIN, currentUser.bin);
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

  const handleTargetBriefingEcpp = async (row: string, side: string) => {
    try {
      const signerIIN = currentUser.iin;
      if (!signerIIN) {
        alert("Ошибка: Не найден ИИН пользователя. Проверьте профиль.");
        return;
      }
      const xmlToSign = `<WorkPermit><ID>${permit.permitId}</ID><Date>${new Date().toISOString()}</Date><Type>target_briefing</Type><Row>${row}</Row><Side>${side}</Side></WorkPermit>`;
      const signedXml = await signXml(xmlToSign, signerIIN, currentUser.bin);
      if (!signedXml) throw new Error("Получен пустой ответ от NCALayer");

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/v1/permits/${permit.id}/target_briefing_ecpp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ signed_xml: signedXml, row, side }),
      });

      const resData = await response.json();
      if (response.ok && resData.ok) {
        alert(`✅ УСПЕХ! Подписано.`);
        onRefresh?.();
      } else {
        alert(`❌ ОШИБКА: ${resData.error || 'Не удалось подписать'}`);
      }
    } catch (e: any) {
      console.error(e);
      alert(`Ошибка: ${e.message || JSON.stringify(e)}`);
    }
  };

  const handleBrigadeChangeSign = async (index: number) => {
    try {
      const signerIIN = currentUser.iin;
      if (!signerIIN) {
        alert("Ошибка: Не найден ИИН пользователя.");
        return;
      }
      const xmlToSign = `<WorkPermit><ID>${permit.permitId}</ID><Date>${new Date().toISOString()}</Date><Type>brigade_change</Type><Index>${index}</Index></WorkPermit>`;
      const signedXml = await signXml(xmlToSign, signerIIN, currentUser.bin);
      if (!signedXml) throw new Error("Получен пустой ответ от NCALayer");

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/v1/permits/${permit.id}/sign_brigade_change/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
        body: JSON.stringify({ signed_xml: signedXml, index }),
      });

      const resData = await response.json();
      if (response.ok && resData.ok) {
        alert(`✅ УСПЕХ! Подписано.`);
        onRefresh?.();
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

  // Список членов бригады, не поставивших подпись (для блокировки закрытия)
  const getUnsignedBrigadeMembers = (): string[] => {
      const team = data.teamMembers || [];
      if (!team.length) return [];
      const sigList: any = data.brigade_signatures;
      const unsigned: string[] = [];
      team.forEach((m: any, idx: number) => {
          const sig = Array.isArray(sigList)
              ? sigList[idx]
              : (sigList && (sigList[idx] ?? sigList[String(idx)]));
          if (!sig) unsigned.push(`№${idx + 1} ${m?.name || '—'}`);
      });
      return unsigned;
  };

  const ensureBrigadeSigned = (): boolean => {
      const unsigned = getUnsignedBrigadeMembers();
      if (unsigned.length === 0) return true;
      alert(
          'Вы не можете закрыть наряд, пока не подпишут «Состав бригады».\n\n' +
          'Не подписали:\n• ' + unsigned.join('\n• ')
      );
      return false;
  };

  // Для обычного производителя (с учётной записью) — простое подтверждение
  const handleProducerClose = async () => {
      if (!ensureBrigadeSigned()) return;
      const ok = await confirmDialog({
        title: 'Завершение работ',
        message: 'Вы подтверждаете завершение работ?\nПосле этого Допускающий должен будет закрыть наряд.',
        confirmText: 'Завершить работы',
      });
      if (!ok) return;
      try {
          const response = await fetch(`/api/v1/permits/${permit.id}/producer_close/`, {
              method: 'POST',
              headers: { 'Authorization': `Token ${localStorage.getItem('auth_token')}` }
          });
          if (response.ok) {
              alert("Завершение работ подтверждено. Ожидайте закрытия Допускающим.");
              if (onRefresh) onRefresh();
          } else {
              const err = await response.json();
              alert("Ошибка: " + (err.error || JSON.stringify(err)));
          }
      } catch (e) {
          console.error(e);
          alert("Ошибка сети");
      }
  };

  // Для внешнего производителя — отправляем подпись с изображением
  const handleProducerCloseWithSignature = async (blob: Blob) => {
      const formData = new FormData();
      formData.append('signature', blob, 'producer_close.png');
      const response = await fetch(`/api/v1/permits/${permit.id}/producer_close/`, {
          method: 'POST',
          headers: { 'Authorization': `Token ${localStorage.getItem('auth_token')}` },
          body: formData,
      });
      if (response.ok) {
          alert("Подпись сохранена. Ожидайте закрытия Допускающим.");
          if (onRefresh) onRefresh();
      } else {
          const err = await response.json();
          throw new Error(err.error || JSON.stringify(err));
      }
  };

  const handleAdmittingClose = async () => {
      const ok = await confirmDialog({
        title: 'Закрытие наряда',
        message: 'Вы уверены, что хотите закрыть наряд?\nЭто действие необратимо.',
        confirmText: 'Закрыть наряд',
        danger: true,
      });
      if (!ok) return;
      try {
          const response = await fetch(`/api/v1/permits/${permit.id}/close/`, {
              method: 'POST',
              headers: { 'Authorization': `Token ${localStorage.getItem('auth_token')}` }
          });
          if (response.ok) {
              alert("Наряд успешно закрыт.");
              onBack();
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
    { id: 'lab', label: 'Лаборант' },
    { id: 'checklist', label: 'Чек лист' },
    ...(data.lotoEnabled ? [{ id: 'loto', label: 'LOTO' }] : []),
  ];

  const renderUserName = (userObj: any, fallback: string = '—') => {
      if (userObj && typeof userObj === 'object' && userObj.name) return userObj.name;
      if (typeof userObj === 'string' && userObj.trim() !== '') return userObj;
      return fallback;
  };
  // В блоке «Ответственные лица» Выдающий наряд = подписант шага 1 (Ход согласования)
  const issuerDisplayName = issuerStep?.approver_name || renderUserName(data.issuer, '—');

  const pendingExternalProducerSig =
    permit.status === 'PENDING_APPROVAL' &&
    producerStep?.status === 'PENDING' &&
    externalProducer &&
    !producerStep?.approver_id;
  const canRecordProducerGraphicSig =
    !!pendingExternalProducerSig &&
    (
      (issuerApprovedStep && String(issuerApprovedStep.approver_id) === currentUserId) ||
      (admitApprovedStep && String(admitApprovedStep.approver_id) === currentUserId)
    );

  const pendingExternalSupervisorSig =
    permit.status === 'PENDING_APPROVAL' &&
    externalSupervisor &&
    mainSupervisorStep?.status === 'PENDING';

  const canRecordSupervisorGraphicSig =
    !!pendingExternalSupervisorSig &&
    mainSupervisorStep &&
    (isAdmin ||
      steps.some(
        (s: any) =>
          s.status === 'APPROVED' &&
          s.approver_id &&
          String(s.approver_id) === currentUserId &&
          s.step_order < mainSupervisorStep.step_order
      ));

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
    <>
    <div className="max-w-5xl mx-auto space-y-6  pb-24">

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
              {permit.location?.name && (
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin size={18} className="text-blue-500" />
                  <span className="font-medium">{permit.location.name}</span>
                </div>
              )}
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

          {wellCoords && (
            <div className="mt-5">
              <WellMap
                readOnly={true}
                pinnedCoords={wellCoords}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-100">
             <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600"><User size={20} /></div>
                <div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Инициатор</p>
                   <p className="font-semibold text-slate-700">{initiator?.name || 'Неизвестно'}</p>
                   <p className="text-xs text-slate-500">{initiator?.position || 'Сотрудник'}</p>
                </div>
             </div>
             <div className="flex items-start gap-3 min-w-0">
                <div className="p-2 bg-white rounded-lg shadow-sm text-amber-500 shrink-0"><Clock size={20} /></div>
                <div className="min-w-0">
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Период работ</p>
                   {openedFmt ? (
                     isClosed && closedFmt ? (
                       <div className="font-semibold text-slate-700 leading-snug space-y-0.5">
                         <p className="break-words">{formatPermitCompact(openedAtIso)}</p>
                         <p className="break-words">{formatPermitCompact(permit.validTo)}</p>
                       </div>
                     ) : (
                       <p className="font-semibold text-slate-700 leading-snug">{formatPermitCompact(openedAtIso)}</p>
                     )
                   ) : (
                     <p className="font-semibold text-slate-700">—</p>
                   )}
                   {isClosed && !closedFmt && openedFmt && (
                     <p className="text-xs text-amber-700 mt-1">Дата закрытия не зафиксирована</p>
                   )}
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

        {/* БАННЕР: Вызов пожарного поста (только для dispatcher_semser) */}
        {data.callFirePost && currentUser.username === 'dispatcher_semser' && (
          <div className="mx-6 md:mx-8 mt-4 p-4 bg-red-50 border-2 border-red-400 rounded-xl animate-pulse">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 p-3 bg-red-600 rounded-full text-white">
                <AlertTriangle size={28} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-800 uppercase">Требуется вызов пожарной бригады!</h3>
                <p className="text-red-700 mt-1">
                  По данному наряду-допуску №{permit.permitId} необходимо обеспечить присутствие пожарного поста на месте проведения работ.
                </p>
                <p className="text-red-600 text-sm mt-1 font-medium">
                  Место: {data.workPlace || 'Не указано'} &bull; Инициатор: {initiator?.name || '—'}
                </p>
              </div>
            </div>
          </div>
        )}

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
             <div className="space-y-8 ">
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

                {pendingExternalProducerSig && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-semibold text-amber-950">Графическая подпись производителя работ</p>
                      <p className="text-sm text-amber-900/90 mt-1 leading-snug">
                        Исполнитель — без ЭЦП. Выдающий или Допускающий (уже подписавшие наряд ЭЦП) могут открыть окно подписи и передать устройство производителю для росписи на экране.
                      </p>
                    </div>
                    {canRecordProducerGraphicSig ? (
                      <button
                        type="button"
                        onClick={() => setProducerPadOpen(true)}
                        className="shrink-0 px-4 py-2.5 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700"
                      >
                        Внести подпись
                      </button>
                    ) : (
                      <p className="text-xs text-amber-800/80 shrink-0 max-w-xs">
                        Кнопка доступна только Выдающему и Допускающему после их подписи.
                      </p>
                    )}
                  </div>
                )}

                {pendingExternalSupervisorSig && (
                  <div className="rounded-xl border border-sky-200 bg-sky-50/90 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-semibold text-sky-950">Графическая подпись согласующего (без ЭЦП)</p>
                      <p className="text-sm text-sky-900/90 mt-1 leading-snug">
                        Указан согласующий без учётной записи. Любой участник, уже подписавший свой шаг до этого согласующего, может открыть окно подписи и передать устройство для росписи на экране.
                      </p>
                    </div>
                    {canRecordSupervisorGraphicSig ? (
                      <button
                        type="button"
                        onClick={() => setSupervisorPadOpen(true)}
                        className="shrink-0 px-4 py-2.5 rounded-lg bg-sky-600 text-white font-medium hover:bg-sky-700"
                      >
                        Внести подпись
                      </button>
                    ) : (
                      <p className="text-xs text-sky-800/80 shrink-0 max-w-xs">
                        Кнопка доступна только тем, кто уже подписал шаги до этого согласующего (или администратору).
                      </p>
                    )}
                  </div>
                )}

                {/* БЛОК ОТВЕТСТВЕННЫХ ЛИЦ (Сохранен оригинал с 5 блоками) */}
                <div>
                   <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><User size={20} className="text-slate-400"/> Ответственные лица</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border border-gray-200 rounded-lg"><span className="text-xs text-gray-400 uppercase font-bold">Выдающий наряд</span><p className="font-medium text-gray-900">{issuerDisplayName}</p></div>
                      <div className="p-4 border border-gray-200 rounded-lg"><span className="text-xs text-gray-400 uppercase font-bold">Ответственный руководитель</span><p className="font-medium text-gray-900">{renderUserName(data.responsible, 'Не назначался')}</p></div>
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <span className="text-xs text-gray-400 uppercase font-bold">Производитель работ</span>
                        <p className="font-medium text-gray-900">{renderUserName(data.producer, '—')}</p>
                        {data.producer_signature && (
                          <div className="mt-2">
                            <span className="text-xs text-gray-400 uppercase font-bold block mb-1">Графическая подпись</span>
                            <img
                              src={getSignatureUrl(data.producer_signature)}
                              alt="Подпись производителя"
                              className="h-12 object-contain bg-gray-50 border border-gray-200 rounded"
                            />
                          </div>
                        )}
                      </div>
                      <div className="p-4 border border-gray-200 rounded-lg"><span className="text-xs text-gray-400 uppercase font-bold">Допускающий</span><p className="font-medium text-gray-900">{renderUserName(data.admitting, '—')}</p></div>
                      <div className="p-4 border border-gray-200 rounded-lg "><span className="text-xs text-gray-400 uppercase font-bold">Согласовано (Нач. смены / Участка / Инженер ТБ)</span><p className="font-medium text-gray-900">{renderUserName(data.supervisor, '—')}</p>
                        {data.supervisor_signature && (
                          <div className="mt-2">
                            <span className="text-xs text-gray-400 uppercase font-bold block mb-1">Графическая подпись</span>
                            <img
                              src={getSignatureUrl(data.supervisor_signature)}
                              alt="Подпись согласующего"
                              className="h-12 object-contain bg-gray-50 border border-gray-200 rounded"
                            />
                          </div>
                        )}
                      </div>
                      {addlCoordStates.length > 0 && addlCoordStates.map((state) => (
                        <div key={state.idx} className="p-4 border border-blue-200 rounded-lg bg-blue-50/30">
                          <span className="text-xs text-blue-400 uppercase font-bold">Дополнительный согласующий {state.idx + 1}</span>
                          <p className="font-medium text-gray-900">{renderUserName(state.coord, '—')}</p>
                          {state.signature && (
                            <div className="mt-2">
                              <span className="text-xs text-gray-400 uppercase font-bold block mb-1">Графическая подпись</span>
                              <img
                                src={getSignatureUrl(state.signature)}
                                alt="Подпись согласующего"
                                className="h-12 object-contain bg-gray-50 border border-gray-200 rounded"
                              />
                            </div>
                          )}
                          {state.isPending && (
                            <div className="mt-3 rounded-lg border border-sky-200 bg-sky-100/80 p-3">
                              <p className="text-xs text-sky-800 font-medium mb-2">
                                Согласующий без ЭЦП — можно внести графическую подпись
                              </p>
                              {state.canSign ? (
                                <button
                                  type="button"
                                  onClick={() => setSupervisorPadOpen(true)}
                                  className="shrink-0 px-3 py-1.5 rounded-md bg-sky-600 text-white text-sm font-medium hover:bg-sky-700"
                                >
                                  Внести подпись
                                </button>
                              ) : (
                                <p className="text-xs text-sky-700/80">
                                  Доступно тем, кто уже подписал предыдущие шаги
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'safety' && (
               <div className="space-y-6 ">
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
               <div className="">
                   <div className="flex justify-between items-center mb-4">
                     <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Users size={20} className="text-blue-500"/> Состав бригады</h3>
                     <div className="flex items-center gap-2">
                       <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Всего: {data.teamMembers?.length || 0} чел.</span>
                       {permit.status === 'APPROVED' && !isAuditor && (
                         <button onClick={() => setShowAddMember(!showAddMember)} className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-full transition-colors">
                           + Добавить
                         </button>
                       )}
                     </div>
                   </div>
                   {showAddMember && permit.status === 'APPROVED' && (
                     <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                         <input type="text" placeholder="ФИО" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
                         <input type="text" placeholder="Должность" value={newMember.role} onChange={e => setNewMember({...newMember, role: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
                       </div>
                       <p className="text-xs text-gray-500 mb-3">Инструктаж провел: <span className="font-medium text-gray-700">{data.admitting?.name || 'Допускающий к работе'}</span> (заполняется автоматически)</p>
                       <div className="flex gap-2">
                         <button disabled={addingMember || !newMember.name.trim()} onClick={async () => {
                           setAddingMember(true);
                           try {
                             const token = localStorage.getItem('auth_token');
                             const res = await fetch(`/api/v1/permits/${permit.id}/add_brigade_member/`, {
                               method: 'POST',
                               headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Token ${token}` } : {}) },
                               body: JSON.stringify(newMember),
                             });
                             if (res.ok) {
                               setNewMember({ name: '', role: '', instructedBy: '' });
                               setShowAddMember(false);
                               onRefresh?.();
                             } else {
                               const err = await res.json().catch(() => ({}));
                               alert(err.error || 'Ошибка');
                             }
                           } finally { setAddingMember(false); }
                         }} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                           {addingMember ? 'Сохранение...' : 'Сохранить'}
                         </button>
                         <button onClick={() => { setShowAddMember(false); setNewMember({ name: '', role: '', instructedBy: '' }); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300">
                           Отмена
                         </button>
                       </div>
                     </div>
                   )}
                   {data.teamMembers && data.teamMembers.length > 0 ? (
                       <div className="overflow-x-auto border border-gray-200 rounded-lg">
                           <table className="w-full text-left text-sm">
                             <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase">
                               <tr>
                                 <th className="px-4 py-3 w-10">№</th>
                                 <th className="px-4 py-3">ФИО</th>
                                 <th className="px-4 py-3">Должность</th>
                                 <th className="px-4 py-3">Инструктаж провел</th>
                                 <th className="px-4 py-3">Дата</th>
                                 {permit.status === 'APPROVED' && <th className="px-4 py-3 w-32">Подпись</th>}
                               </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-100">
                               {data.teamMembers.map((member: any, idx: number) => {
                                 const sigList = data.brigade_signatures;
                                 const sigPath = Array.isArray(sigList) ? sigList[idx] : (sigList && (sigList as any)[idx]) ?? (sigList && (sigList as any)[String(idx)]);
                                 const hasSig = !!sigPath;
                                 return (
                                   <tr key={idx} className="hover:bg-gray-50">
                                     <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                                     <td className="px-4 py-3 font-medium text-gray-900">{member.name}</td>
                                     <td className="px-4 py-3 text-gray-600">{member.role}</td>
                                     <td className="px-4 py-3 text-gray-600">{member.instructedBy}</td>
                                     <td className="px-4 py-3 text-gray-500">{member.instructedAt ? new Date(member.instructedAt).toLocaleString() : '-'}</td>
                                     {permit.status === 'APPROVED' && (
                                       <td className="px-4 py-3">
                                         {hasSig ? (
                                           <img src={getSignatureUrl(sigPath)} alt="Подпись" className="h-10 object-contain bg-gray-50 border border-gray-200 rounded" />
                                         ) : !isAuditor ? (
                                           <button
                                             type="button"
                                             onClick={() => setSigningMemberIndex(idx)}
                                             className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                           >
                                             Подписать
                                           </button>
                                         ) : (
                                           <span className="text-gray-400 text-sm">—</span>
                                         )}
                                       </td>
                                     )}
                                   </tr>
                                 );
                               })}
                             </tbody>
                           </table>
                       </div>
                   ) : (<div className="text-center py-10 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">Состав бригады не указан</div>)}
                   {permit.status === 'APPROVED' && data.teamMembers?.length && signingMemberIndex !== null && (
                     <SignaturePadModal
                       open={true}
                       memberLabel={`${data.teamMembers[signingMemberIndex]?.name || ''} (№ ${signingMemberIndex + 1})`}
                       onClose={() => setSigningMemberIndex(null)}
                       onConfirm={async (blob) => {
                         const token = localStorage.getItem('auth_token');
                         const form = new FormData();
                         form.append('member_index', String(signingMemberIndex));
                         form.append('signature', blob, 'signature.png');
                         const res = await fetch(`/api/v1/permits/${permit.id}/brigade_signature/`, {
                           method: 'POST',
                           headers: token ? { 'Authorization': `Token ${token}` } : {},
                           body: form,
                         });
                         if (!res.ok) {
                           const err = await res.json().catch(() => ({}));
                           const msg = err.error || err.detail || `Ошибка ${res.status}`;
                           throw new Error(msg);
                         }
                         onRefresh?.();
                       }}
                     />
                   )}
               </div>
           )}

           {activeTab === 'lab' && (
                <div className="">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><FlaskConical size={20} className="text-purple-500"/> Лаборант ЦНИПР</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Всего: {data.labTechnicians?.length || 0} чел.</span>
                        {isAdmittingCanManageLab && (
                          <button onClick={() => setShowAddLabTechnician(!showAddLabTechnician)} className="text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded-full transition-colors">
                            + Добавить Лаборанта
                          </button>
                        )}
                      </div>
                    </div>
                    {showAddLabTechnician && isAdmittingCanManageLab && (
                      <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                          <input type="text" placeholder="ФИО лаборанта" value={newLabTechnician.name} onChange={e => setNewLabTechnician({...newLabTechnician, name: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
                          <input type="text" placeholder="Место отбора проб" value={newLabTechnician.samplingLocation} onChange={e => setNewLabTechnician({...newLabTechnician, samplingLocation: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
                          <input type="text" placeholder="Концентрация" value={newLabTechnician.concentration} onChange={e => setNewLabTechnician({...newLabTechnician, concentration: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
                        </div>
                        <div className="flex gap-2">
                          <button disabled={addingLabTechnician || !newLabTechnician.name.trim()} onClick={async () => {
                            setAddingLabTechnician(true);
                            try {
                              const token = localStorage.getItem('auth_token');
                              const res = await fetch(`/api/v1/permits/${permit.id}/add_lab_technician/`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Token ${token}` } : {}) },
                                body: JSON.stringify({ name: newLabTechnician.name, sampling_location: newLabTechnician.samplingLocation, concentration: newLabTechnician.concentration }),
                              });
                              if (res.ok) {
                                setNewLabTechnician({ name: '', samplingLocation: '', concentration: '' });
                                setShowAddLabTechnician(false);
                                onRefresh?.();
                              } else {
                                const err = await res.json().catch(() => ({}));
                                alert(err.error || 'Ошибка');
                              }
                            } finally { setAddingLabTechnician(false); }
                          }} className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                            {addingLabTechnician ? 'Сохранение...' : 'Сохранить'}
                          </button>
                          <button onClick={() => { setShowAddLabTechnician(false); setNewLabTechnician({ name: '', samplingLocation: '', concentration: '' }); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300">
                            Отмена
                          </button>
                        </div>
                      </div>
                    )}
                    {data.labTechnicians && data.labTechnicians.length > 0 ? (
                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                            <table className="w-full text-left text-sm">
                              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase">
                                <tr>
                                  <th className="px-4 py-3 w-10">№</th>
                                  <th className="px-4 py-3">ФИО</th>
                                  <th className="px-4 py-3">Место отбора проб</th>
                                  <th className="px-4 py-3">Концентрация</th>
                                  <th className="px-4 py-3 w-40">Подпись</th>
                                  <th className="px-4 py-3 w-40">Дата подписи</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {data.labTechnicians.map((tech: any, idx: number) => {
                                  const hasSig = !!tech.signature;
                                  return (
                                    <tr key={idx} className="hover:bg-gray-50">
                                      <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                                      <td className="px-4 py-3 font-medium text-gray-900">{tech.name}</td>
                                      <td className="px-4 py-3 text-gray-600">{tech.samplingLocation || '—'}</td>
                                      <td className="px-4 py-3 text-gray-600">{tech.concentration || '—'}</td>
                                      <td className="px-4 py-3">
                                        {hasSig ? (
                                          <img src={getSignatureUrl(tech.signature)} alt="Подпись лаборанта" className="h-10 object-contain bg-gray-50 border border-gray-200 rounded" />
                                        ) : isAdmittingCanManageLab ? (
                                          <button
                                            type="button"
                                            onClick={() => setSigningLabTechnicianIndex(idx)}
                                            className="text-purple-600 hover:text-purple-800 font-medium text-sm"
                                          >
                                            Подписать
                                          </button>
                                        ) : (
                                          <span className="text-gray-400 text-sm">—</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3 text-gray-500">{tech.signedAt ? new Date(tech.signedAt).toLocaleString('ru-RU') : '—'}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                        </div>
                    ) : (
                      <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        Лаборанты не добавлены
                        {isAdmittingCanManageLab && (
                          <p className="mt-2 text-sm">Нажмите «+ Добавить Лаборанта» для внесения данных</p>
                        )}
                      </div>
                    )}
                    {isAdmittingCanManageLab && signingLabTechnicianIndex !== null && (
                      <SignaturePadModal
                        open={true}
                        memberLabel={`${data.labTechnicians[signingLabTechnicianIndex]?.name || ''} (Лаборант № ${signingLabTechnicianIndex + 1})`}
                        onClose={() => setSigningLabTechnicianIndex(null)}
                        onConfirm={async (blob) => {
                          const token = localStorage.getItem('auth_token');
                          const form = new FormData();
                          form.append('index', String(signingLabTechnicianIndex));
                          form.append('signature', blob, 'signature.png');
                          const res = await fetch(`/api/v1/permits/${permit.id}/lab_technician_sign/`, {
                            method: 'POST',
                            headers: token ? { 'Authorization': `Token ${token}` } : {},
                            body: form,
                          });
                          if (!res.ok) {
                            const err = await res.json().catch(() => ({}));
                            const msg = err.error || err.detail || `Ошибка ${res.status}`;
                            throw new Error(msg);
                          }
                          onRefresh?.();
                        }}
                      />
                    )}
                </div>
            )}

            {activeTab === 'checklist' && (
               <div className="">
                   {/* Таблица анализа рисков */}
                   <div className="flex items-center gap-2 mb-4">
                       <AlertTriangle size={20} className="text-orange-500"/>
                       <h3 className="text-lg font-bold text-slate-800">Таблица анализа рисков</h3>
                   </div>
                   {data.riskTable && data.riskTable.length > 0 ? (
                       <div className="overflow-x-auto mb-8">
                           <table className="w-full text-sm border border-gray-200 rounded-lg">
                               <thead className="bg-gray-50 text-gray-600 font-semibold">
                                   <tr>
                                       <th className="px-3 py-2 text-left border-b">№</th>
                                       <th className="px-3 py-2 text-left border-b">Этап работы</th>
                                       <th className="px-3 py-2 text-left border-b">Опасности / Риски</th>
                                       <th className="px-3 py-2 text-left border-b">Меры управления</th>
                                       <th className="px-3 py-2 text-left border-b">Контроль</th>
                                   </tr>
                               </thead>
                               <tbody className="divide-y divide-gray-100">
                                   {data.riskTable.map((row: any, idx: number) => (
                                       <tr key={row.id || idx} className="hover:bg-gray-50/50">
                                           <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                                           <td className="px-3 py-2">{row.step || '—'}</td>
                                           <td className="px-3 py-2">{row.hazards || '—'}</td>
                                           <td className="px-3 py-2">{row.measures || '—'}</td>
                                           <td className="px-3 py-2">{row.isControlled || '—'}</td>
                                       </tr>
                                   ))}
                               </tbody>
                           </table>
                       </div>
                   ) : (
                       <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200 mb-8">
                           Таблица анализа рисков не заполнена
                       </div>
                   )}

                   {/* Чек-лист оценки риска */}
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

           {activeTab === 'loto' && data.lotoEnabled && (
               <div className="">
                   <IsolationMatrixForm
                     data={data.isolationMatrix || {}}
                     onChange={() => {}}
                     readOnly={true}
                     lotoPhotoUrl={permit.loto_photo || null}
                   />
               </div>
           )}

           {producerPadOpen && (
             <SignaturePadModal
               open={true}
               memberLabel={renderUserName(data.producer, 'Производитель работ')}
               onClose={() => setProducerPadOpen(false)}
               onConfirm={async (blob) => {
                 const token = localStorage.getItem('auth_token');
                 const form = new FormData();
                 form.append('signature', blob, 'signature.png');
                 const res = await fetch(`/api/v1/permits/${permit.id}/producer_signature/`, {
                   method: 'POST',
                   headers: token ? { 'Authorization': `Token ${token}` } : {},
                   body: form,
                 });
                 if (!res.ok) {
                   const err = await res.json().catch(() => ({}));
                   const msg = err.error || err.detail || `Ошибка ${res.status}`;
                   throw new Error(msg);
                 }
                 setProducerPadOpen(false);
                 onRefresh?.();
               }}
             />
           )}
           {supervisorPadOpen && (
             <SignaturePadModal
               open={true}
               memberLabel={renderUserName(data.supervisor, 'Согласующий')}
               onClose={() => setSupervisorPadOpen(false)}
               onConfirm={async (blob) => {
                 const token = localStorage.getItem('auth_token');
                 const form = new FormData();
                 form.append('signature', blob, 'signature.png');
                 const res = await fetch(`/api/v1/permits/${permit.id}/supervisor_signature/`, {
                   method: 'POST',
                   headers: token ? { 'Authorization': `Token ${token}` } : {},
                   body: form,
                 });
                 if (!res.ok) {
                   const err = await res.json().catch(() => ({}));
                   const msg = err.error || err.detail || `Ошибка ${res.status}`;
                   throw new Error(msg);
                 }
                 setSupervisorPadOpen(false);
                 onRefresh?.();
               }}
             />
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

            {/* 2. РЕДАКТИРОВАТЬ / УДАЛИТЬ (аудитор не видит) */}
            {!isAuditor && (((permit.status === 'DRAFT' || permit.status === 'REJECTED') && isInitiator) || canEditAsManager) && (
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
            {!isAuditor && (permit.status === 'DRAFT' || permit.status === 'REJECTED') && isInitiator && !hasRequiredFields && (
                <div className="flex items-center text-amber-700 text-sm px-4 bg-amber-50 rounded-lg border border-amber-200 py-2.5 gap-2">
                   <AlertTriangle size={16} />
                   Наряд не заполнен полностью. Откройте редактирование и заполните обязательные поля.
                </div>
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

            {/* Шаг 1: Закрыть наряд как Производитель работ */}
            {showProducerClose && (
                <button
                    onClick={canActForExternalProducer
                        ? () => { if (ensureBrigadeSigned()) setProducerClosePadOpen(true); }
                        : handleProducerClose}
                    className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 shadow-sm"
                >
                    <CheckCircle2 size={18} />
                    Закрыть наряд как Производитель работ
                </button>
            )}

            {/* Ожидание: Производитель подтвердил, ждём Допускающего */}
            {permit.status === 'APPROVED' && !!permit.producer_closed && !isAdmittingUser && (
                <div className="flex items-center text-sm text-amber-600 italic px-4 bg-amber-50 rounded-lg border border-amber-200 py-2 gap-2">
                    <Clock size={16} /> Ожидается закрытие Допускающим
                </div>
            )}

            {/* Шаг 2: Допускающий окончательно закрывает наряд */}
            {showAdmittingClose && (
                <button
                    onClick={handleAdmittingClose}
                    className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-2 shadow-sm"
                >
                    <CheckCircle2 size={18} />
                    Закрыть наряд как Допускающий
                </button>
            )}

         </div>
      </div>
    </div>

    {/* Модал графической подписи производителя при закрытии */}
    <SignaturePadModal
      open={producerClosePadOpen}
      memberLabel={
        (data.producer?.name || data.producer?.freeText || 'Производитель работ') + ' (закрытие наряда)'
      }
      onClose={() => setProducerClosePadOpen(false)}
      onConfirm={handleProducerCloseWithSignature}
    />

    {/* ELECTRICAL_NEW: Графическая подпись Допускающего (Разрешение на допуск) */}
    {admissionPadOpen && (
      <SignaturePadModal
        open={true}
        memberLabel={data.admitting?.name || 'Допускающий'}
        onClose={() => setAdmissionPadOpen(false)}
        onConfirm={async (blob) => {
          const token = localStorage.getItem('auth_token');
          const form = new FormData();
          form.append('signature', blob, 'signature.png');
          const res = await fetch(`/api/v1/permits/${permit.id}/admission_signature/`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Token ${token}` } : {},
            body: form,
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || err.detail || `Ошибка ${res.status}`);
          }
          setAdmissionPadOpen(false);
          onRefresh?.();
        }}
      />
    )}

    {/* ELECTRICAL_NEW: Графическая подпись Ответственного руководителя работ */}
    {responsiblePadOpen && (
      <SignaturePadModal
        open={true}
        memberLabel={data.responsible?.name || 'Ответственный руководитель работ'}
        onClose={() => setResponsiblePadOpen(false)}
        onConfirm={async (blob) => {
          const token = localStorage.getItem('auth_token');
          const form = new FormData();
          form.append('signature', blob, 'signature.png');
          const res = await fetch(`/api/v1/permits/${permit.id}/responsible_admission_signature/`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Token ${token}` } : {},
            body: form,
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || err.detail || `Ошибка ${res.status}`);
          }
          setResponsiblePadOpen(false);
          onRefresh?.();
        }}
      />
    )}

    {/* ELECTRICAL_NEW: Графическая подпись согласования (согласующий) */}
    {agreementPadOpen && (
      <SignaturePadModal
        open={true}
        memberLabel={data.admissionRows?.[agreementPadIndex]?.agreementUser?.name || 'Согласующий'}
        onClose={() => setAgreementPadOpen(false)}
        onConfirm={async (blob) => {
          const token = localStorage.getItem('auth_token');
          const form = new FormData();
          form.append('signature', blob, 'signature.png');
          form.append('index', String(agreementPadIndex));
          const res = await fetch(`/api/v1/permits/${permit.id}/admission_agreement_signature/`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Token ${token}` } : {},
            body: form,
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || err.detail || `Ошибка ${res.status}`);
          }
          setAgreementPadOpen(false);
          onRefresh?.();
        }}
      />
    )}

    {/* ELECTRICAL_NEW: Ежедневный допуск — Подпись допускающего */}
    {dailyAdmitPadOpen && (
      <SignaturePadModal
        open={true}
        memberLabel={data.admitting?.name || 'Допускающий'}
        onClose={() => setDailyAdmitPadOpen(false)}
        onConfirm={async (blob) => {
          const token = localStorage.getItem('auth_token');
          const form = new FormData();
          form.append('signature', blob, 'signature.png');
          form.append('index', String(dailyAdmitPadIndex));
          form.append('signature_type', 'admitting');
          const res = await fetch(`/api/v1/permits/${permit.id}/daily_admission_signature/`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Token ${token}` } : {},
            body: form,
          });
          if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || err.detail || `Ошибка ${res.status}`); }
          setDailyAdmitPadOpen(false);
          onRefresh?.();
        }}
      />
    )}

    {/* ELECTRICAL_NEW: Ежедневный допуск — Подпись производителя (допуск) */}
    {dailyProdAdmitPadOpen && (
      <SignaturePadModal
        open={true}
        memberLabel={data.producer?.name || 'Производитель работ'}
        onClose={() => setDailyProdAdmitPadOpen(false)}
        onConfirm={async (blob) => {
          const token = localStorage.getItem('auth_token');
          const form = new FormData();
          form.append('signature', blob, 'signature.png');
          form.append('index', String(dailyProdAdmitPadIndex));
          form.append('signature_type', 'producer_admission');
          const res = await fetch(`/api/v1/permits/${permit.id}/daily_admission_signature/`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Token ${token}` } : {},
            body: form,
          });
          if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || err.detail || `Ошибка ${res.status}`); }
          setDailyProdAdmitPadOpen(false);
          onRefresh?.();
        }}
      />
    )}

    {/* ELECTRICAL_NEW: Ежедневный допуск — Подпись производителя (окончание) */}
    {dailyProdCompPadOpen && (
      <SignaturePadModal
        open={true}
        memberLabel={data.producer?.name || 'Производитель работ'}
        onClose={() => setDailyProdCompPadOpen(false)}
        onConfirm={async (blob) => {
          const token = localStorage.getItem('auth_token');
          const form = new FormData();
          form.append('signature', blob, 'signature.png');
          form.append('index', String(dailyProdCompPadIndex));
          form.append('signature_type', 'producer_completion');
          const res = await fetch(`/api/v1/permits/${permit.id}/daily_admission_signature/`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Token ${token}` } : {},
            body: form,
          });
          if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || err.detail || `Ошибка ${res.status}`); }
          setDailyProdCompPadOpen(false);
          onRefresh?.();
        }}
      />
    )}

    {/* ELECTRICAL_NEW: Окончание работы — Подпись */}
    {workCompletionPadOpen && (
      <SignaturePadModal
        open={true}
        memberLabel={currentUser.name || currentUser.username || 'Подпись'}
        onClose={() => { setWorkCompletionPadOpen(false); setWorkCompletionField(''); }}
        onConfirm={async (blob) => {
          const field = workCompletionField;
          const token = localStorage.getItem('auth_token');
          const form = new FormData();
          form.append('signature', blob, 'signature.png');
          form.append('field', field);
          const res = await fetch(`/api/v1/permits/${permit.id}/work_completion_signature/`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Token ${token}` } : {},
            body: form,
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || err.detail || `Ошибка ${res.status}`);
          }
          setWorkCompletionPadOpen(false);
          setWorkCompletionField('');
          onRefresh?.();
        }}
      />
    )}

    {/* ELECTRICAL_NEW: Целевой инструктаж — Графическая подпись */}
    {targetBriefingPadOpen && (
      <SignaturePadModal
        open={true}
        memberLabel={currentUser.name || currentUser.username || 'Подпись'}
        onClose={() => { setTargetBriefingPadOpen(false); pendingTBRowRef.current = ''; pendingTBSideRef.current = ''; }}
        onConfirm={async (blob) => {
          const row = pendingTBRowRef.current;
          const side = pendingTBSideRef.current;
          const token = localStorage.getItem('auth_token');
          const form = new FormData();
          form.append('signature', blob, 'signature.png');
          form.append('row', row);
          form.append('side', side);
          const res = await fetch(`/api/v1/permits/${permit.id}/target_briefing_signature/`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Token ${token}` } : {},
            body: form,
          });
          if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || err.detail || `Ошибка ${res.status}`); }
          setTargetBriefingPadOpen(false);
          pendingTBRowRef.current = '';
          pendingTBSideRef.current = '';
          onRefresh?.();
        }}
      />
    )}

    {/* ELECTRICAL_NEW: Выпадающий список результатов поиска согласований */}
    {agreementSearchResults.length > 0 && agreementSearchRow >= 0 && (
      <div className="fixed z-[130] bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '300px' }}>
        {agreementSearchResults.map((u: any) => (
          <button key={u.id} onClick={async () => {
            const token = localStorage.getItem('auth_token');
            await fetch(`/api/v1/permits/${permit.id}/admission_row_update/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
              body: JSON.stringify({ index: agreementSearchRow, agreementUser: { id: u.id, name: u.name || u.username, position: u.position || '' } }),
            });
            setAgreementSearchResults([]);
            setAgreementSearchRow(-1);
            onRefresh?.();
          }}
            className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b last:border-0 text-sm">
            <span className="font-medium">{u.name || u.username}</span>
            <span className="text-gray-400 ml-2 text-xs">{u.position}</span>
          </button>
        ))}
      </div>
    )}
    </>
  );
};