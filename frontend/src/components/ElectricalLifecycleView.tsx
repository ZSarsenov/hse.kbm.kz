
import React from 'react';
/* Added Users to the lucide-react import list below */
import { Calendar, UserPlus, UserMinus, CheckCircle2, ClipboardList, PenTool, Users } from 'lucide-react';
import { ElectricalLifecycle, DailyAdmission, BrigadeChange, TargetBriefingLog } from '../types';

interface Props {
  lifecycle: ElectricalLifecycle;
  onUpdate: (updatedLifecycle: ElectricalLifecycle) => void;
  isAdmitting?: boolean;
}

export const ElectricalLifecycleView: React.FC<Props> = ({ lifecycle, onUpdate, isAdmitting = false }) => {
  
  const addAdmission = () => {
    const newAdmission: DailyAdmission = {
      id: Date.now().toString(),
      workPlace: '',
      admissionDateTime: new Date().toISOString(),
      admittingSignature: 'DIGITAL_SIGN',
      producerSignature: 'DIGITAL_SIGN',
      finishDateTime: '',
      producerFinishSignature: ''
    };
    onUpdate({ ...lifecycle, dailyAdmissions: [...lifecycle.dailyAdmissions, newAdmission] });
  };

  const logBriefing = (role: string, name: string) => {
    const entry: TargetBriefingLog = {
      id: Date.now().toString(),
      personRole: role,
      personName: name,
      signature: 'VALID',
      timestamp: new Date().toISOString()
    };
    onUpdate({ ...lifecycle, briefingLogs: [...lifecycle.briefingLogs, entry] });
  };

  const sectionHeader = (title: string, icon: any) => (
    <div className="flex items-center gap-3 mb-6 pb-2 border-b border-slate-200">
      <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
        {React.createElement(icon, { size: 20 })}
      </div>
      <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide">{title}</h3>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      
      {/* 1. Daily Admission Log */}
      <section>
        <div className="flex items-center justify-between mb-6">
          {sectionHeader("Ежедневный допуск к работе", Calendar)}
          <button onClick={addAdmission} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700">
            <PenTool size={18} /> Новый допуск
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-4 font-bold text-slate-500 uppercase">Наименование рабочего места</th>
                <th className="px-4 py-4 font-bold text-slate-500 uppercase">Допуск (Дата/Время)</th>
                <th className="px-4 py-4 font-bold text-slate-500 uppercase">Подписи (Доп./Произв.)</th>
                <th className="px-4 py-4 font-bold text-slate-500 uppercase">Окончание (Дата/Время)</th>
                <th className="px-4 py-4 font-bold text-slate-500 uppercase">Подпись (Произв.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lifecycle.dailyAdmissions.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-4 font-medium">{log.workPlace || 'Основное место работ'}</td>
                  <td className="px-4 py-4 font-mono">{new Date(log.admissionDateTime).toLocaleString('ru-RU')}</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                       <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold text-[10px]">ЭЦП Доп.</span>
                       <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold text-[10px]">ЭЦП Произв.</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-mono text-slate-400">
                    {log.finishDateTime ? new Date(log.finishDateTime).toLocaleString('ru-RU') : 'В работе...'}
                  </td>
                  <td className="px-4 py-4">
                    <button className="text-blue-600 font-bold hover:underline">Завершить</button>
                  </td>
                </tr>
              ))}
              {lifecycle.dailyAdmissions.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400 italic">Записей о допуске пока нет</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 2. Target Briefing Log */}
      <section>
        {sectionHeader("Регистрация целевого инструктажа", ClipboardList)}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lifecycle.briefingLogs.map((log) => (
            <div key={log.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <CheckCircle2 className="text-emerald-500" size={20} />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{log.personRole}</span>
              <h4 className="text-lg font-bold text-slate-900 mb-2">{log.personName}</h4>
              <div className="flex items-center justify-between text-xs font-mono text-slate-500 border-t pt-2">
                <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                <span className="text-emerald-600 font-bold">ПОДПИСАНО ЭЦП</span>
              </div>
            </div>
          ))}
          {/* Add Entry Card */}
          <div className="border-2 border-dashed border-slate-200 p-5 rounded-2xl flex items-center justify-center bg-slate-50/50">
             <button onClick={() => logBriefing('Член бригады', 'Новый сотрудник')} className="flex flex-col items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors">
                <UserPlus size={32} />
                <span className="font-bold text-sm">Провести инструктаж</span>
             </button>
          </div>
        </div>
      </section>

      {/* 3. Brigade Changes */}
      <section>
        {sectionHeader("Изменения в составе бригады", UserPlus)}
        <div className="bg-slate-900 rounded-3xl p-8 text-slate-300">
           {lifecycle.brigadeChanges.length > 0 ? (
             <div className="space-y-4">
                {lifecycle.brigadeChanges.map(change => (
                  <div key={change.id} className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-4">
                       <div className="flex flex-col items-center">
                          <UserPlus size={16} className="text-emerald-500"/>
                          <span className="text-xs font-bold text-emerald-500">ВВЕДЕН</span>
                       </div>
                       <span className="text-white font-bold">{change.introducedMember}</span>
                    </div>
                    <div className="h-4 w-[1px] bg-slate-700"></div>
                    <div className="flex items-center gap-4">
                       <span className="text-slate-400">{change.removedMember || '-'}</span>
                       <div className="flex flex-col items-center">
                          <UserMinus size={16} className="text-rose-500"/>
                          <span className="text-xs font-bold text-rose-500">ВЫВЕДЕН</span>
                       </div>
                    </div>
                    <div className="text-right text-xs font-mono">
                       <div className="text-slate-500">Разрешил: {change.authorizedBy}</div>
                       <div className="text-blue-400">{new Date(change.dateTime).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
             </div>
           ) : (
             <div className="text-center py-10 opacity-40">
                <Users size={48} className="mx-auto mb-4" />
                <p>Изменений в составе бригады не зафиксировано</p>
             </div>
           )}
        </div>
      </section>

    </div>
  );
};
