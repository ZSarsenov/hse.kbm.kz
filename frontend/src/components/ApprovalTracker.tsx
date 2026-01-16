import React from 'react';
import { CheckCircle2, Clock, XCircle, User, AlertCircle } from 'lucide-react';

interface Step {
  id: number;
  step_order: number;
  role_label: string;
  approver_name: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WAITING' | 'SIGNED';
  signed_at?: string;
  rejection_reason?: string; // 👈 Добавили поле в интерфейс
}

export const ApprovalTracker: React.FC<{ steps: Step[] }> = ({ steps }) => {
  if (!steps || steps.length === 0) return <div className="text-gray-400">Нет данных о согласовании</div>;

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="font-bold text-gray-900 mb-6 uppercase text-base tracking-wider border-b pb-2">
        Ход согласования
      </h3>

      <div className="relative">
        {/* Вертикальная линия */}
        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-100"></div>

        <div className="space-y-6 relative">
          {steps.map((step, index) => {
            let icon = <Clock size={20} className="text-gray-400" />;
            let bgColor = "bg-gray-100";
            let borderColor = "border-gray-200";
            let textColor = "text-gray-500";
            let statusText = "Ожидание";

            if (step.status === 'APPROVED' || step.status === 'SIGNED') {
                icon = <CheckCircle2 size={20} className="text-white" />;
                bgColor = "bg-green-500";
                borderColor = "border-green-500";
                textColor = "text-gray-900";
                statusText = `Подписано: ${step.signed_at ? new Date(step.signed_at).toLocaleString() : ''}`;
            } else if (step.status === 'PENDING') {
                icon = <User size={20} className="text-white" />;
                bgColor = "bg-blue-500";
                borderColor = "border-blue-500";
                textColor = "text-blue-700 font-bold";
                statusText = "Ожидает подписания (Текущий шаг)";
            } else if (step.status === 'REJECTED') {
                icon = <XCircle size={20} className="text-white" />;
                bgColor = "bg-red-500";
                borderColor = "border-red-500";
                textColor = "text-red-700";
                statusText = "Отклонено";
            }

            return (
              <div key={step.id} className="flex gap-4 items-start relative z-10 bg-white">
                {/* Кружок с иконкой */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 ${bgColor} ${borderColor} transition-colors mt-1`}>
                   {icon}
                </div>

                {/* Информация */}
                <div className="flex-1 pt-1">
                   <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">

                       {/* Левая часть: Роль и Имя */}
                       <div>
                           <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                               Шаг {step.step_order}: {step.role_label}
                           </p>
                           <p className={`text-lg font-medium ${step.status === 'PENDING' ? 'text-blue-600' : 'text-gray-900'}`}>
                               {step.approver_name}
                           </p>
                           <p className="text-xs text-gray-400 mt-0.5">{statusText}</p>
                       </div>

                       {/* 👇 ЦЕНТРАЛЬНАЯ ЧАСТЬ: ПРИЧИНА ОТКАЗА (Если есть) */}
                       {step.status === 'REJECTED' && step.rejection_reason && (
                           <div className="flex-1 md:mx-6 bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-3">
                               <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5"/>
                               <div>
                                   <span className="text-xs font-bold text-red-600 uppercase block mb-1">Причина отказа:</span>
                                   <p className="text-sm text-gray-800 italic leading-snug">
                                       "{step.rejection_reason}"
                                   </p>
                               </div>
                           </div>
                       )}

                       {/* Правая часть: Бейдж статуса */}
                       <div className="shrink-0">
                           <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                               step.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                               step.status === 'PENDING' ? 'bg-blue-100 text-blue-700' :
                               step.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                               'bg-gray-100 text-gray-500'
                           }`}>
                               {step.status === 'PENDING' ? 'В работе' :
                                step.status === 'APPROVED' ? 'Согласован' :
                                step.status === 'REJECTED' ? 'Отказ' : 'Ожидание'}
                           </span>
                       </div>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};