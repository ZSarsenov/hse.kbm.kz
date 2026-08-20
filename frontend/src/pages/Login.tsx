import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

interface LoginProps {
  // Мы ожидаем, что onLogin примет не просто имя, а весь объект data
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
      const response = await fetch('/api/v1/api-token-auth/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
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
    <div className="min-h-screen grid lg:grid-cols-[1.08fr_1fr] bg-white font-sans">
      {/* Локальные анимации: появление (stagger), «дыхание» точки, блик по знаку ЭНД */}
      <style>{`
        @keyframes lgx-fade-up { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes lgx-pulse { 0%, 100% { opacity: .9; } 50% { opacity: .35; } }
        .lgx-fade { animation: lgx-fade-up .7s cubic-bezier(.22, 1, .36, 1) both; }
        .lgx-pulse { animation: lgx-pulse 3.2s ease-in-out infinite; }

        /* Блик света, изредка пробегающий по словесному знаку */
        .lgx-shimmer {
          background: linear-gradient(105deg, #ffffff 38%, #cfe8fa 50%, #ffffff 62%);
          background-size: 250% 100%;
          background-position: 130% 0;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: lgx-sweep 5s cubic-bezier(.77, 0, .175, 1) 1.4s infinite;
        }
        @keyframes lgx-sweep {
          0%   { background-position: 130% 0; }
          45%  { background-position: -130% 0; }
          100% { background-position: -130% 0; } /* пауза до следующего пробега */
        }
        @media (prefers-reduced-motion: reduce) {
          .lgx-shimmer {
            animation: none;
            background: none;
            background-clip: border-box;
            -webkit-background-clip: border-box;
            color: #ffffff;
          }
        }
      `}</style>

      {/* ═══ ЛЕВАЯ ПАНЕЛЬ — «Каспийский горизонт» ═══ */}
      <div className="relative overflow-hidden bg-[#06203A] min-h-[300px] lg:min-h-screen">
        {/* Фотография производства */}
        <img
          src="/main.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Корпоративный навy-оверлей — читаемость текста поверх фото */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#04101F]/95 via-[#06203A]/65 to-[#06203A]/40" />

        {/* Изолинии — структурная карта дна Каспия, мотив нефтедобычи */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 800 600"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <g transform="rotate(-10 500 400)" fill="none" stroke="rgba(140,180,210,0.10)" strokeWidth="1">
            <ellipse cx="500" cy="400" rx="70"  ry="50" />
            <ellipse cx="500" cy="400" rx="130" ry="95" />
            <ellipse cx="500" cy="400" rx="195" ry="140" />
            <ellipse cx="500" cy="400" rx="265" ry="190" />
            <ellipse cx="500" cy="400" rx="340" ry="245" />
            <ellipse cx="500" cy="400" rx="420" ry="300" />
            <ellipse cx="500" cy="400" rx="505" ry="360" />
          </g>
          {/* Реперный крест и точка — «платформа» на месторождении */}
          <line x1="0" y1="400" x2="800" y2="400" stroke="rgba(140,180,210,0.07)" strokeWidth="1" strokeDasharray="2 6" />
          <line x1="500" y1="0" x2="500" y2="600" stroke="rgba(140,180,210,0.07)" strokeWidth="1" strokeDasharray="2 6" />
          <circle cx="500" cy="400" r="12" fill="none" stroke="rgba(251,191,36,0.35)" strokeWidth="1" />
          <circle cx="500" cy="400" r="4" fill="#fbbf24" className="lgx-pulse" />
        </svg>

        {/* Мягкие глубинные свечения */}
        <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-[#0E4C7E]/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-24 w-[460px] h-[460px] rounded-full bg-[#063455]/30 blur-3xl pointer-events-none" />

        <div className="relative h-full flex flex-col p-8 sm:p-12 lg:p-14 gap-8">
          {/* Словесный знак системы */}
          <div>
            <h1 className="lgx-fade lgx-shimmer font-['PT_Sans'] text-6xl sm:text-7xl font-bold tracking-tight leading-none">
              ЭНД
            </h1>
            <div className="lgx-fade mt-5 h-[3px] w-14 bg-amber-400 rounded-full" style={{ animationDelay: '.1s' }} />
            <p className="lgx-fade mt-5 text-sky-200/55 text-lg font-['PT_Sans'] max-w-[280px] leading-snug" style={{ animationDelay: '.2s' }}>
              {t('login.tagline')}
            </p>
          </div>
        </div>
      </div>

      {/* ═══ ПРАВАЯ ПАНЕЛЬ — ФОРМА ═══ */}
      <div className="relative flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12 lg:py-16 bg-white">
        <div className="absolute top-5 right-6">
          <LanguageSwitcher />
        </div>

        <div className="w-full max-w-sm mx-auto lg:mx-0">
          {/* Организация с логотипом */}
          <div className="lgx-fade flex items-center gap-3 mb-8">
            <img
              src="/logo-kbm.jpg"
              alt={t('login.subtitle')}
              className="h-12 w-auto object-contain shrink-0"
            />
            <div className="font-['PT_Sans'] text-slate-700 text-sm font-bold tracking-[0.14em] uppercase leading-relaxed">
              {t('login.subtitle')}
            </div>
          </div>

          <h2 className="lgx-fade text-3xl font-bold text-slate-900 tracking-tight" style={{ animationDelay: '.05s' }}>
            {t('login.title')}
          </h2>
          <div className="lgx-fade mt-3 h-[2px] w-8 bg-amber-400 rounded-full" style={{ animationDelay: '.1s' }} />

          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            {error && (
              <div className="lgx-fade bg-red-50 border border-red-100 text-red-700 p-3.5 rounded-lg text-sm flex items-start gap-2.5">
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <div className="lgx-fade" style={{ animationDelay: '.1s' }}>
              <label htmlFor="login-username" className="block text-sm font-semibold text-slate-700 mb-2">
                {t('login.loginLabel')}
              </label>
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#f4f6f8] border border-slate-200 rounded-lg px-4 py-3 text-lg text-slate-900 placeholder-slate-400 outline-none transition-all focus:bg-white focus:border-[#0A3D62] focus:ring-4 focus:ring-[#0A3D62]/10"
                placeholder={t('login.loginPlaceholder')}
                required
              />
            </div>

            <div className="lgx-fade" style={{ animationDelay: '.18s' }}>
              <label htmlFor="login-password" className="block text-sm font-semibold text-slate-700 mb-2">
                {t('login.passwordLabel')}
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#f4f6f8] border border-slate-200 rounded-lg px-4 py-3 pr-12 text-lg text-slate-900 placeholder-slate-400 outline-none transition-all focus:bg-white focus:border-[#0A3D62] focus:ring-4 focus:ring-[#0A3D62]/10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-[#0A3D62] transition-colors cursor-pointer"
                  aria-label={showPassword ? t('login.passwordLabel') : t('login.passwordLabel')}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="lgx-fade w-full bg-[#0A3D62] hover:bg-[#0C4A77] disabled:opacity-60 text-white text-lg font-semibold py-3.5 rounded-lg transition-all flex items-center justify-center gap-2 active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-[#0A3D62]/20"
              style={{ animationDelay: '.26s' }}
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : t('login.submit')}
            </button>
          </form>

          <p className="lgx-fade mt-12 text-xs text-slate-400" style={{ animationDelay: '.35s' }}>
            © 2026 · {t('login.subtitle')}
          </p>
        </div>
      </div>
    </div>
  );
};
