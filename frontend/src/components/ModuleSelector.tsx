import { ClipboardCheck, BookOpen, Truck, Shield } from 'lucide-react';

interface ModuleSelectorProps {
  onSelectModule: (module: string) => void;
  userName?: string;
}

export const ModuleSelector = ({ onSelectModule, userName }: ModuleSelectorProps) => {
  const modules = [
    {
      id: 'permits',
      title: 'Электронный наряд-допуск',
      description: 'Создание, согласование и контроль нарядов-допусков на работы повышенной опасности',
      icon: ClipboardCheck,
      color: 'from-blue-600 to-indigo-700',
      hoverColor: 'hover:shadow-blue-200',
      iconBg: 'bg-blue-100 text-blue-600',
      active: true,
      badge: null,
    },
    {
      id: 'journal',
      title: 'Электронный журнал',
      description: 'Ведение электронных журналов учёта и регистрации',
      icon: BookOpen,
      color: 'from-emerald-600 to-teal-700',
      hoverColor: 'hover:shadow-emerald-200',
      iconBg: 'bg-emerald-100 text-emerald-600',
      active: false,
      badge: 'BETA',
    },
    {
      id: 'bdd',
      title: 'БДД и транспорт',
      description: 'Безопасность дорожного движения и управление транспортом',
      icon: Truck,
      color: 'from-amber-500 to-orange-600',
      hoverColor: 'hover:shadow-amber-200',
      iconBg: 'bg-amber-100 text-amber-600',
      active: false,
      badge: 'BETA',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
      {/* Header */}
      <div className="w-full bg-white/80 backdrop-blur-sm border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
              <Shield size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">HSE Portal</h1>
              <p className="text-xs text-slate-500">Система управления охраной труда</p>
            </div>
          </div>
          {userName && (
            <p className="text-sm text-slate-600">
              Добро пожаловать, <span className="font-semibold text-slate-800">{userName}</span>
            </p>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-5xl w-full">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-3">Выберите модуль</h2>
            <p className="text-slate-500 text-lg">Выберите раздел для начала работы</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {modules.map((mod) => {
              const Icon = mod.icon;
              return (
                <button
                  key={mod.id}
                  onClick={() => mod.active && onSelectModule(mod.id)}
                  disabled={!mod.active}
                  className={`
                    relative group text-left p-8 rounded-2xl border-2 transition-all duration-300
                    ${mod.active
                      ? `bg-white border-transparent shadow-lg ${mod.hoverColor} hover:shadow-xl hover:-translate-y-1 cursor-pointer`
                      : 'bg-white/60 border-slate-200 cursor-not-allowed opacity-70'
                    }
                  `}
                >
                  {mod.badge && (
                    <span className="absolute top-4 right-4 px-3 py-1 text-xs font-bold bg-slate-200 text-slate-500 rounded-full tracking-wider">
                      {mod.badge}
                    </span>
                  )}

                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 ${mod.iconBg} ${!mod.active ? 'opacity-50' : ''}`}>
                    <Icon size={28} />
                  </div>

                  <h3 className={`text-xl font-bold mb-2 ${mod.active ? 'text-slate-800' : 'text-slate-400'}`}>
                    {mod.title}
                  </h3>

                  <p className={`text-sm leading-relaxed ${mod.active ? 'text-slate-500' : 'text-slate-400'}`}>
                    {mod.description}
                  </p>

                  {mod.active && (
                    <div className={`mt-6 inline-flex items-center gap-2 text-sm font-semibold bg-gradient-to-r ${mod.color} bg-clip-text text-transparent group-hover:gap-3 transition-all`}>
                      Открыть
                      <span className="text-blue-600 group-hover:translate-x-1 transition-transform">&rarr;</span>
                    </div>
                  )}

                  {!mod.active && (
                    <div className="mt-6 text-sm font-medium text-slate-400">
                      Скоро будет доступно
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full border-t border-slate-200 bg-white/60 px-6 py-4">
        <div className="max-w-6xl mx-auto text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} АО &laquo;Каражанбасмунай&raquo; &mdash; HSE Portal
        </div>
      </div>
    </div>
  );
};
