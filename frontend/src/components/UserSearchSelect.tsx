import React, { useState, useEffect, useRef } from 'react';
import { Search, X, User as UserIcon, AlertCircle } from 'lucide-react';

interface UserData {
  id: number;
  name: string; // ФИО из get_full_name
  position: string;
  role: string; // WORK_PRODUCER, COORDINATOR и т.д.
  department_name?: string;
}

interface UserSearchSelectProps {
  label: string;
  value: string; // Для отображения в инпуте (имя)
  onChange: (user: UserData | null) => void; // 👇 Теперь возвращаем объект!
  placeholder?: string;
  disabled?: boolean;
  requiredRole?: string; // 👇 Новая фишка: Требуемая роль
}

// Словарь для красивого отображения ролей (можно вынести в types)
const ROLE_LABELS: Record<string, string> = {
  'ADMIN': 'Администратор',
  'ISSUER': 'Выдающий наряд',
  'WORK_PRODUCER': 'Производитель работ',
  'ADMITTING': 'Допускающий',
  'COORDINATOR': 'Согласующий',
  'RESPONSIBLE': 'Ответственный руководитель',
  'AUDITOR': 'Аудитор',
};

export const UserSearchSelect: React.FC<UserSearchSelectProps> = ({
  label,
  value,
  onChange,
  placeholder = "Введите фамилию...",
  disabled = false,
  requiredRole
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Синхронизация локального инпута с пропсом value
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Закрытие при клике вне компонента
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Поиск пользователей
  useEffect(() => {
    const timer = setTimeout(async () => {
      // Ищем только если открыт список, есть ввод и это не просто отображение выбранного значения
      if (query.length >= 2 && isOpen && query !== value) {
        setLoading(true);
        try {
          const token = localStorage.getItem('auth_token');
          // Ищем по API (предполагаем, что бэкенд ищет по ?search=...)
          const res = await fetch(`http://10.60.2.89:8000/api/v1/users/?search=${query}`, {
            headers: { 'Authorization': `Token ${token}` }
          });

          if (res.ok) {
            const data = await res.json();
            const users = Array.isArray(data) ? data : data.results;
            setResults(users);
          }
        } catch (e) {
          console.error("Ошибка поиска:", e);
        } finally {
          setLoading(false);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, isOpen, value]);

  const handleSelect = (user: UserData) => {
    // 🛡 ВАЛИДАЦИЯ РОЛИ
    if (requiredRole && user.role !== requiredRole) {
       const requiredLabel = ROLE_LABELS[requiredRole] || requiredRole;
       const userLabel = ROLE_LABELS[user.role] || user.role || 'Без роли';

       // Можно сделать жесткий запрет (return) или просто предупреждение
       if (!window.confirm(`Внимание! \nДля поля "${label}" требуется роль: "${requiredLabel}".\nУ сотрудника ${user.name} роль: "${userLabel}".\n\nВсё равно выбрать?`)) {
           return;
       }
    }

    onChange(user); // Передаем весь объект наверх
    setQuery(user.name);
    setIsOpen(false);
    setError(null);
  };

  const handleClear = () => {
    onChange(null);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-sm font-bold text-gray-700 mb-1">
        {label}
        {requiredRole && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        <input
          type="text"
          className={`w-full bg-[#f7f7f7] border border-gray-300 rounded-md pl-10 pr-10 py-3 text-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          placeholder={placeholder}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => { if (!disabled) setIsOpen(true); }}
          disabled={disabled}
        />

        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={20} className="text-gray-400" />
        </div>

        {query && !disabled && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Выпадающий список */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white shadow-xl rounded-md border border-gray-200 max-h-60 overflow-auto animate-in fade-in slide-in-from-top-2 duration-200">
          {loading && <div className="p-4 text-center text-gray-500">Поиск...</div>}

          {!loading && results.length === 0 && (
             <div className="p-4 text-center text-gray-500">Сотрудники не найдены</div>
          )}

          {!loading && results.map((user) => {
             // Подсветка несоответствия роли в списке
             const isRoleMismatch = requiredRole && user.role !== requiredRole;

             return (
              <button
                key={user.id}
                onClick={() => handleSelect(user)}
                className={`w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-50 last:border-0 transition-colors flex items-center gap-3 group ${isRoleMismatch ? 'hover:bg-red-50' : ''}`}
              >
                <div className={`p-2 rounded-full ${isRoleMismatch ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-600'}`}>
                  {isRoleMismatch ? <AlertCircle size={20} /> : <UserIcon size={20} />}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">{user.position || 'Должность не указана'}</span>
                    <span className="text-gray-300">•</span>
                    <span className={`font-medium ${isRoleMismatch ? 'text-red-500' : 'text-blue-600'}`}>
                       {ROLE_LABELS[user.role] || user.role}
                    </span>
                  </div>
                  {user.department_name && (
                    <p className="text-xs text-gray-400 mt-0.5">{user.department_name}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};