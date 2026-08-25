import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Menu, Bell, User, FilePlus, CheckSquare,
  FileText, LogOut, ChevronDown, LayoutDashboard, ClipboardList, Grid3X3, ChartColumn, Check
} from 'lucide-react';
import { Permission } from '../types';
import { LanguageSwitcher } from './LanguageSwitcher';
import { toast } from './Toasts';

// Время уведомления: сегодня — только время, иначе дата + время
const formatNotifTime = (iso: string): string => {
  const d = new Date(iso);
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === new Date().toDateString()) return time;
  return `${d.toLocaleDateString('ru-RU')} ${time}`;
};

interface LayoutProps {
  children: React.ReactNode;
  onNavigate: () => void;
  onNavigateLoto?: () => void;
  onNavigateMyTasks?: () => void;
  onNavigateArchive?: () => void;
  onNavigateAuditStats?: () => void;
  onNavigateModules?: () => void;
  onCreate?: () => void;
  onLogout: () => void;
  onSelectPermit?: (id: string) => void;
  user?: {
    name: string;
    avatar?: string;
    position: string;
    department: string;
    organization: string;
    role?: string;
    permissions: Permission[];
  };
  currentView?: string;
}

export const Layout: React.FC<LayoutProps> = ({
  children, onNavigate, onNavigateLoto, onNavigateMyTasks, onNavigateArchive, onNavigateAuditStats, onNavigateModules, onCreate, onLogout, onSelectPermit, user, currentView
}) => {
  const { t } = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Закрытие по клику вне элемента (click-outside)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (profileRef.current && !profileRef.current.contains(target)) setIsProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(target)) setIsNotifOpen(false);
      if (isSidebarOpen && sidebarRef.current && !sidebarRef.current.contains(target) && menuButtonRef.current && !menuButtonRef.current.contains(target)) {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSidebarOpen]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const hasPermission = (permission: Permission) => user?.permissions?.includes(permission);

  const localUser = JSON.parse(localStorage.getItem('user_data') || '{}');
  const userRole = user?.role || localUser.role || '';
  const canCreatePermit = userRole === 'ISSUER' || userRole === 'ADMITTING' || userRole === 'ADMIN';
  const canViewStatistics = userRole === 'AUDITOR' || userRole === 'ADMIN';

  // «Живые» уведомления: опрос раз в 30 с + мгновенная догрузка при возврате
  // на вкладку + всплывающая плашка, если пришло новое (не молча менять бейдж)
  const knownIdsRef = useRef<Set<number>>(new Set());
  const firstLoadRef = useRef(true);

  const fetchNotifs = () => {
      if (document.hidden) return; // фоновой вкладке не молотим
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      fetch('api/v1/notifications/', { headers: { 'Authorization': `Token ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
          const items: any[] = Array.isArray(data) ? data.filter((n:any) => !n.is_read) : [];
          if (firstLoadRef.current) {
              firstLoadRef.current = false;
          } else {
              const fresh = items.filter(n => !knownIdsRef.current.has(n.id));
              if (fresh.length > 0) {
                  toast({ message: fresh[0].title || 'Новое уведомление', type: 'info' });
              }
          }
          items.forEach((n: any) => knownIdsRef.current.add(n.id));
          setNotifications(items);
      })
      .catch(e => console.error("Ошибка уведомлений:", e));
  };

  useEffect(() => {
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 30000);
      // Вернулись на вкладку — проверяем сразу, не ждём следующего тика
      const onVisible = () => { if (!document.hidden) fetchNotifs(); };
      document.addEventListener('visibilitychange', onVisible);
      return () => {
          clearInterval(interval);
          document.removeEventListener('visibilitychange', onVisible);
      };
  }, []);

  const handleMarkAsRead = async (id: number) => {
      try {
          const token = localStorage.getItem('auth_token');
          await fetch(`/api/v1/notifications/${id}/mark_read/`, {
              method: 'POST',
              headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' }
          });
          setNotifications(prev => prev.filter(n => n.id !== id));
      } catch (e) { console.error(e); }
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans text-slate-600 overflow-hidden">
      {/* Анимация выпадающих панелей (уведомления) */}
      <style>{`
        @keyframes notif-pop { from { opacity: 0; transform: translateY(-4px) scale(.98); } to { opacity: 1; transform: none; } }
        .notif-pop { animation: notif-pop .16s cubic-bezier(.23, 1, .32, 1) both; transform-origin: top right; }
        @media (prefers-reduced-motion: reduce) { .notif-pop { animation: none; } }
      `}</style>
      {/* Navbar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-[60] h-16 shadow-sm shrink-0">
        <div className="px-4 h-full flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <button ref={menuButtonRef} onClick={toggleSidebar} className="lg:hidden p-2 text-gray-500 hover:bg-gray-50 rounded-md transition-colors">
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-3 cursor-pointer" onClick={onNavigate}>
              {/* Логотип организации — слева, перед названием; вписан по высоте шапки с запасом */}
              <img
                src="/logo-kbm.png"
                alt="АО «Каражанбасмунай»"
                title="АО «Каражанбасмунай»"
                className="h-14 w-auto object-contain shrink-0"
              />
              <div className="flex flex-col font-['PT_Sans']">
                <span className="text-3xl font-bold text-blue-700 leading-none">ЭНД</span>
                <span className="text-sm text-blue-600 font-bold tracking-wider uppercase">{t('layout.brandSubtitle')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <LanguageSwitcher className="hidden sm:inline-flex" />
            {/* Уведомления */}
            <div className="relative" ref={notifRef}>
                <button onClick={() => setIsNotifOpen(!isNotifOpen)} className={`relative p-2 rounded-full transition-colors ${isNotifOpen ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
                  <Bell size={22} />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 min-w-[20px] px-1 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                        {notifications.length > 99 ? '99+' : notifications.length}
                    </span>
                  )}
                </button>
                {isNotifOpen && (
                    <div className="absolute right-0 mt-2 w-[380px] max-w-[calc(100vw-24px)] bg-white border border-slate-200/80 rounded-2xl shadow-[0_16px_48px_-12px_rgba(6,32,58,0.22)] z-50 overflow-hidden notif-pop">
                        {/* Шапка: заголовок + счётчик + действие */}
                        <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-sm">{t('layout.notifications')}</span>
                                {notifications.length > 0 && (
                                    <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold flex items-center justify-center">
                                        {notifications.length > 99 ? '99+' : notifications.length}
                                    </span>
                                )}
                            </div>
                            {notifications.length > 0 && (
                                <button
                                    onClick={() => notifications.forEach(n => handleMarkAsRead(n.id))}
                                    className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors"
                                >
                                    <Check size={13} /> {t('layout.markAllRead')}
                                </button>
                            )}
                        </div>
                        {/* Список */}
                        <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                            {notifications.length === 0 ? (
                                <div className="py-10 flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                                        <Bell size={22} />
                                    </div>
                                    <p className="text-sm text-slate-400">{t('layout.noNotifications')}</p>
                                </div>
                            ) : notifications.map(n => (
                                <div
                                    key={n.id}
                                    onClick={() => { handleMarkAsRead(n.id); if (n.permit_id && onSelectPermit) { onSelectPermit(String(n.permit_id)); setIsNotifOpen(false); } }}
                                    className="group flex gap-3 px-4 py-3.5 hover:bg-slate-50 cursor-pointer transition-colors"
                                >
                                    <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shrink-0 group-hover:bg-blue-600 transition-colors"></span>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-sm text-slate-800 leading-snug">{n.title}</p>
                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                                        <p className="text-[11px] text-slate-400 mt-1.5 tabular-nums">{formatNotifTime(n.created_at)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            {/* Профиль */}
            <div className="relative" ref={profileRef}>
              <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 pl-2 pr-1 py-1 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-colors">
                <div className="text-right hidden md:block">
                  <div className="text-sm font-semibold text-gray-700">{user?.name || t('layout.user')}</div>
                  <div className="text-xs text-gray-400 truncate max-w-[150px]">{user?.position || t('layout.employee')}</div>
                </div>
                <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 border border-white shadow-sm overflow-hidden"><User size={20} /></div>
                <ChevronDown size={14} className="text-gray-300 hidden md:block" />
              </button>
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-[100]  origin-top-right">
                  <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                    <p className="text-sm font-bold text-gray-900">{user?.name}</p>
                    <p className="text-xs text-blue-600 font-medium mb-3">{user?.position}</p>
                    <p className="text-xs text-gray-700">{user?.organization}</p>
                  </div>
                  <button onClick={onLogout} className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"><LogOut size={16} className="mr-2" /> {t('layout.logout')}</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar and Main Content */}
      <div className="flex flex-1 overflow-hidden relative w-full">
        <aside ref={sidebarRef} className={`fixed lg:static inset-y-0 left-0 z-20 w-72 bg-white border-r border-gray-100 text-slate-500 transform transition-transform duration-300 ease-in-out shadow-lg lg:shadow-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col h-full pt-16 lg:pt-0 shrink-0`}>
          <div className="flex-1 p-4 space-y-1 overflow-y-auto">
            <div className="px-3 py-4 mb-2 flex items-center justify-between gap-2">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('layout.menu')}</h3>
              <LanguageSwitcher className="sm:hidden scale-90 origin-right" />
            </div>

            <SidebarLink icon={<LayoutDashboard size={20}/>} label={t('layout.main')} active={currentView === 'DASHBOARD'} onClick={onNavigate} />

            {canCreatePermit && (
                <SidebarLink icon={<FilePlus size={20}/>} label={t('layout.createPermit')} active={currentView === 'CREATE'} onClick={onCreate} />
            )}

            <SidebarLink
                icon={<CheckSquare size={20}/>}
                label={t('layout.myTasks')}
                badge={notifications.length > 0 ? notifications.length.toString() : undefined}
                active={currentView === 'MY_TASKS'}
                onClick={onNavigateMyTasks}
            />

            {hasPermission('VIEW_LOTO_LOGS') && (<SidebarLink icon={<ClipboardList size={20}/>} label={t('layout.lotoReports')} active={currentView === 'LOTO_REPORTS'} onClick={onNavigateLoto}/>)}
            <div className="my-4 border-t border-gray-50"></div>

            {/* 👇 АКТИВИРОВАЛИ КНОПКУ АРХИВ */}
            <SidebarLink
                icon={<FileText size={20}/>}
                label={t('layout.journal')}
                active={currentView === 'ARCHIVE'}
                onClick={onNavigateArchive}
            />
            {canViewStatistics && (
              <SidebarLink
                icon={<ChartColumn size={20}/>}
                label={t('layout.statistics')}
                active={currentView === 'AUDIT_STATS'}
                onClick={onNavigateAuditStats}
              />
            )}
          </div>
          <div className="p-4 border-t border-gray-100 bg-white">
             {onNavigateModules && (
               <button onClick={onNavigateModules} className="flex items-center gap-3 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors w-full px-3 py-2 rounded-lg hover:bg-blue-50 hover:shadow-sm mb-1"><Grid3X3 size={18} /><span>{t('layout.allModules')}</span></button>
             )}
             <button onClick={onLogout} className="flex items-center gap-3 text-sm font-medium text-slate-400 hover:text-red-600 transition-colors w-full px-3 py-2 rounded-lg hover:bg-red-50 hover:shadow-sm"><LogOut size={18} /><span>{t('layout.logoutFull')}</span></button>
             <div className="text-[10px] text-gray-300 mt-4 text-center"><p>{t('layout.copyright', { year: new Date().getFullYear() })}</p></div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-2 md:p-4 pb-24 scroll-smooth w-full">
           <div className="w-full">{children}</div>
        </main>
      </div>
    </div>
  );
};

const SidebarLink: React.FC<{ icon: React.ReactNode, label: string, active?: boolean, badge?: string, onClick?: () => void }> = ({ icon, label, active, badge, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${active ? 'bg-blue-50/80 text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-gray-50 hover:text-slate-700'}`}>
    <div className="flex items-center gap-3">{icon}<span>{label}</span></div>
    {badge && (<span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${active ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-600'}`}>{badge}</span>)}
  </button>
);