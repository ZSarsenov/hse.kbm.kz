import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Loader2 } from 'lucide-react';

interface Option {
  id: number | string;
  label: string;
  subLabel?: string;
}

interface SearchableSelectProps {
  label?: string;
  value?: string;
  onChange: (val: string) => void;
  apiEndpoint: string;
  placeholder?: string;
  disabled?: boolean;
  additionalOptions?: Option[]; // 👈 Добавили возможность передавать свои опции (например, Подрядчик)
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label, value, onChange, apiEndpoint, placeholder, disabled, additionalOptions = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [options, setOptions] = useState<Option[]>([]);
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
    if (!isOpen) return;

    const fetchOptions = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('auth_token');
        const separator = apiEndpoint.includes('?') ? '&' : '?';
        const url = `${apiEndpoint}${separator}search=${encodeURIComponent(searchTerm)}`;

        const response = await fetch(url, {
          headers: { 'Authorization': `Token ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          const results = Array.isArray(data) ? data : (data.results || []);

          // Маппинг данных с сервера
          const serverOptions: Option[] = results.map((item: any) => ({
            id: item.id,
            label: item.name || item.full_name || item.title || 'Без названия',
            // 👇 ИСПРАВЛЕНИЕ 2: Убрали item.color_code, чтобы не показывать #FF0000
            subLabel: item.position || ''
          }));

          // 👇 ИСПРАВЛЕНИЕ 1: Объединяем наши доп. опции (Подрядчик) с данными сервера
          setOptions([...additionalOptions, ...serverOptions]);
        }
      } catch (e) {
        console.error("Error fetching options", e);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
        fetchOptions();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, isOpen, apiEndpoint, additionalOptions]); // Добавили additionalOptions в зависимости

  const handleSelect = (opt: Option) => {
    setSearchTerm(opt.label);
    onChange(opt.label);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {label && <label className="block text-lg font-semibold text-gray-700 mb-2">{label}</label>}

      <div className="relative">
        <input
          type="text"
          className={`w-full bg-[#f7f7f7] border-gray-300 rounded-md pl-4 pr-10 py-3 text-lg text-gray-900 border focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          placeholder={placeholder || "Выберите..."}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => !disabled && setIsOpen(true)}
          disabled={disabled}
        />

        <div className="absolute right-3 top-3.5 text-gray-400 pointer-events-none">
           {loading ? <Loader2 size={20} className="animate-spin"/> : <ChevronDown size={20} />}
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {options.length > 0 ? (
            options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt)}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 flex flex-col group transition-colors border-b border-gray-50 last:border-0"
              >
                {/* 👇 Выделяем "Подрядную организацию" жирным или цветом, если нужно */}
                <span className={`text-base ${opt.id === 'CONTRACTOR' ? 'font-bold text-blue-600' : 'font-medium text-gray-900'}`}>
                    {opt.label}
                </span>
                {opt.subLabel && <span className="text-xs text-gray-400">{opt.subLabel}</span>}
              </button>
            ))
          ) : (
            <div className="p-3 text-center text-gray-500 text-sm">
               {loading ? 'Загрузка...' : 'Ничего не найдено'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};