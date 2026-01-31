import React, { useEffect, useState } from 'react';
import { FileText, Clock, ArrowRight, AlertCircle } from 'lucide-react';
import { WorkPermit } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface MyTasksProps {
  onSelectPermit: (id: string) => void;
}

export const MyTasks: React.FC<MyTasksProps> = ({ onSelectPermit }) => {
  const [tasks, setTasks] = useState<WorkPermit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('api/v1/permits/my_tasks/', {
      headers: { 'Authorization': `Token ${localStorage.getItem('auth_token')}` }
    })
    .then(res => res.json())
    .then(data => {
        const items = Array.isArray(data) ? data : [];

        // 👇 ВАЖНО: Преобразуем данные с сервера (snake_case) в наш формат (camelCase)
        // Чтобы починить "Invalid Date"
        const formattedTasks = items.map((p: any) => ({
            id: p.id,
            permitId: p.permit_id,
            templateType: p.templateType || 'Наряд-допуск',
            status: p.status,
            initiator: {
                name: p.initiator?.name || 'Неизвестно',
                position: p.initiator?.position,
                iin: p.initiator?.iin
            },
            location: {
                name: p.location_name || 'Место не указано'
            },
            // Берем created_at, так как сервер шлет именно его
            createdAt: p.created_at,
            validFrom: p.valid_from,
            validTo: p.valid_to,
            data: p.data,
            approvalSteps: p.approval_steps
        }));

        setTasks(formattedTasks);
        setLoading(false);
    })
    .catch(err => {
        console.error(err);
        setLoading(false);
    });
  }, []);

  if (loading) return (
      <div className="flex justify-center items-center h-64 text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-2"></div>
          Загрузка задач...
      </div>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6 px-4">
      <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Мои задачи</h1>
          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
            {tasks.length}
          </span>
      </div>

      {tasks.length === 0 ? (
        <div className="p-12 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                <AlertCircle size={24} />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Задач нет</h3>
            <p className="text-gray-500 mt-1">В данный момент вашего согласования не требуется.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tasks.map(permit => (
            // 👇 ДЕЛАЕМ ВСЮ КАРТОЧКУ КЛИКАБЕЛЬНОЙ
            // Добавили onClick сюда и cursor-pointer
            <div
                key={permit.id}
                onClick={() => onSelectPermit(String(permit.id))}
                className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer transition-all duration-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group"
            >
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">#{permit.permitId}</span>
                        <StatusBadge status={permit.status} />
                    </div>

                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                        {permit.templateType || 'Наряд-допуск'}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1.5">
                            <FileText size={16} className="text-gray-400"/>
                            <span className="font-medium text-gray-700">Инициатор:</span>
                            {(permit.initiator as any).name}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Clock size={16} className="text-gray-400"/>
                            <span className="font-medium text-gray-700">Создан:</span>
                            {/* Теперь дата должна отображаться корректно */}
                            {permit.createdAt ? new Date(permit.createdAt).toLocaleDateString() : '—'}
                        </div>
                    </div>
                </div>

                <button
                    className="w-full md:w-auto px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-blue-200 pointer-events-none"
                    // pointer-events-none добавил, чтобы клик проходил сквозь кнопку к родительскому div,
                    // или можно оставить кнопку рабочей, эффект будет тот же.
                >
                    Перейти к подписанию <ArrowRight size={18}/>
                </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
