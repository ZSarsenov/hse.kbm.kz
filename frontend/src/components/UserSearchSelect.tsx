import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Check, Loader2 } from 'lucide-react';

interface UserOption {
  id: number;
  full_name: string;
  position: string;
  department_name: string;
}

interface UserSearchSelectProps {
  label: string;
  value?: string;
  onChange: (name: string, id?: number) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const UserSearchSelect: React.FC<UserSearchSelectProps> = ({
  label, value, onChange, disabled, placeholder
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [options, setOptions] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen || !searchTerm || searchTerm.length < 2) {
      setOptions([]);
      return;
    }

    // Если мы только что выбрали человека (в строке есть скобка с должностью), не искать заново
    if (searchTerm.includes('(') && searchTerm.includes(')')) {
        return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://10.60.2.89:8000/api/v1/search-users/?q=${searchTerm}`, {
          headers: {
            'Authorization': `Token ${localStorage.getItem('auth_token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setOptions(Array.isArray(data) ? data : data.results || []);
        }
      } catch (e) {
        console.error("Ошибка поиска:", e);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, isOpen]);

  // 👇 ГЛАВНОЕ ИЗМЕНЕНИЕ ЗДЕСЬ 👇
  const handleSelect = (user: UserOption) => {
    // Формируем красивую строку: "Иванов И.И. (Сварщик)"
    const displayName = `${user.full_name} (${user.position || 'Должность не указана'})`;

    setSearchTerm(displayName);     // Показываем в поле
    onChange(displayName, user.id); // Передаем наверх в форму
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type="text"
          className={`w-full border rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
          placeholder={placeholder || "Начните вводить фамилию..."}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            onChange(e.target.value);
          }}
          onFocus={() => !disabled && setIsOpen(true)}
          disabled={disabled}
        />
        <div className="absolute left-3 top-2.5 text-gray-400">
           {loading ? <Loader2 size={18} className="animate-spin"/> : <Search size={18} />}
        </div>
      </div>

      {isOpen && options.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {options.map((user) => (
            <button
              key={user.id}
              onClick={() => handleSelect(user)}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center justify-between group transition-colors border-b border-gray-50 last:border-0"
            >
              <div>
                <div className="font-medium text-gray-900">{user.full_name}</div>
                <div className="text-xs text-gray-500 flex gap-2">
                   <span className="font-semibold text-blue-600">{user.position}</span>
                   {user.department_name && (
                     <>
                       <span>•</span>
                       <span>{user.department_name}</span>
                     </>
                   )}
                </div>
              </div>
              <User size={16} className="text-gray-300 group-hover:text-blue-500" />
            </button>
          ))}
        </div>
      )}

      {isOpen && searchTerm.length > 1 && options.length === 0 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm text-gray-500 text-center">
           Сотрудник не найден
        </div>
      )}
    </div>
  );
};