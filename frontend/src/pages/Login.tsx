import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, User, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

interface LoginProps {
  // Теперь мы ожидаем, что onLogin примет не просто имя, а весь объект data
  onLogin: (token: string, userData: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Стучимся на твой IP адрес (проверь, что он актуален)
      const response = await fetch('/api/v1/api-token-auth/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        // Если пришел токен, передаем ВСЕ данные (data) наверх
        if (data.token) {
           onLogin(data.token, data);
        } else {
           setError(t('login.errorNoToken'));
        }
      } else {
        if (response.status === 400) {
           setError(t('login.errorInvalidCreds'));
        } else if (response.status === 404) {
           setError(t('login.errorUrl404'));
        } else {
           setError(t('login.errorServer', { status: response.status }));
        }
      }
    } catch (err) {
      console.error(err);
      setError(t('login.errorConnection'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Исправленные стили для картинки на весь экран
    <div className="fixed inset-0 h-screen w-screen overflow-hidden flex items-center justify-center font-sans text-slate-800">

      {/* 1. ФОНОВАЯ КАРТИНКА */}
      <div className="absolute inset-0 z-0">
        <img
          src="/bg-login.png"
          alt="Background"
          className="w-full h-full object-cover"
        />
        {/* Затемнение */}
        <div className="absolute inset-0 bg-blue-900/80 backdrop-blur-sm"></div>
      </div>

      {/* 2. ФОРМА ВХОДА */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden relative z-10 mx-4">
        <div className="bg-gray-50 p-8 text-center border-b border-gray-100 font-['PT_Sans'] relative">
           <div className="absolute top-4 right-4">
             <LanguageSwitcher />
           </div>
           <h1 className="text-4xl font-bold text-blue-900 tracking-tight">ЭНД</h1>
           <p className="text-gray-500 mt-2 text-lg font-medium">{t('login.subtitle')}</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('login.loginLabel')}</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <User size={20} />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-all"
                  placeholder={t('login.loginPlaceholder')}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Lock size={20} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors flex justify-center items-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : t('login.submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};