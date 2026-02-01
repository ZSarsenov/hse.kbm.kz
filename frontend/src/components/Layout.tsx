import React, { useState, useEffect } from 'react';
import { 
  Menu, Bell, User, LayoutDashboard, FilePlus, CheckSquare, 
  FileText, LogOut, ChevronDown, Building2, Briefcase, ClipboardList
} from 'lucide-react';
import { Permission } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  onNavigate: () => void;
  onNavigateLoto?: () => void;
  onNavigateMyTasks?: () => void;
  onCreate?: () => void;
  onLogout: () => void;
  user?: {
    name: string;
    avatar?: string;
    position: string;
    department: string;
    organization: string;
    role?: string; // 🔥 Добавили поле role
    permissions: Permission[];
  };
  currentView?: string;
}

export const Layout: React.FC<LayoutProps> = ({
  children, onNavigate, onNavigateLoto, onNavigateMyTasks, onCreate, onLogout, user, currentView
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Уведомления (храним только непрочитанные)
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const hasPermission = (permission: Permission) => user?.permissions?.includes(permission);

  // 🔥 ПРОВЕРКА ПРАВ НА СОЗДАНИЕ (ISSUER или ADMIN)
  // Берем роль из пропсов user или напрямую из localStorage для надежности
  const localUser = JSON.parse(localStorage.getItem('user_data') || '{}');
  const userRole = user?.role || localUser.role || '';
  const canCreatePermit = userRole === 'ISSUER' || userRole === 'ADMIN';

  // 1. Загрузка уведомлений
  const fetchNotifs = () => {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      fetch('api/v1/notifications/', {
          headers: { 'Authorization': `Token ${token}` }
      })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
          setNotifications(Array.isArray(data) ? data.filter((n:any) => !n.is_read) : []);
      })
      .catch(e => console.error("Ошибка уведомлений:", e));
  };

  useEffect(() => {
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 30000);
      return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: number) => {
      try {
          const token = localStorage.getItem('auth_token');
          await fetch(`/api/v1/notifications/${id}/mark_read/`, {
              method: 'POST',
              headers: {
                  'Authorization': `Token ${token}`,
                  'Content-Type': 'application/json'
              }
          });
          setNotifications(prev => prev.filter(n => n.id !== id));
      } catch (e) {
          console.error("Ошибка при чтении уведомления", e);
      }
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans text-slate-600 overflow-hidden">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-[60] h-16 shadow-sm shrink-0">
        <div className="px-4 h-full flex items-center justify-between w-full">

          <div className="flex items-center gap-4">
            <button onClick={toggleSidebar} className="lg:hidden p-2 text-gray-500 hover:bg-gray-50 rounded-md transition-colors">
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-3 cursor-pointer" onClick={onNavigate}>
              <div className="flex flex-col font-['PT_Sans']">
                <span className="text-3xl font-bold text-blue-700 leading-none">ЭНД</span>
                <span className="text-sm text-blue-600 font-bold tracking-wider uppercase">АО «Каражанбасмунай»</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">

            {/* УВЕДОМЛЕНИЯ */}
            <div className="relative">
                <button
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className={`relative p-2 rounded-full transition-colors ${isNotifOpen ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                >
                  <Bell size={22} />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 min-w-[20px] px-1 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                        {notifications.length > 99 ? '99+' : notifications.length}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                    <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                        <div className="p-3 border-b bg-gray-50/50 flex justify-between items-center">
                            <span className="font-bold text-gray-700 text-sm">Уведомления</span>
                            {notifications.length > 0 && (
                                <button
                                    onClick={() => notifications.forEach(n => handleMarkAsRead(n.id))}
                                    className="text-xs text-blue-600 hover:underline"
                                >
                                    Прочитать все
                                </button>
                            )}
                        </div>
                        <div className="max-h-[350px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 text-sm">
                                    <Bell size={32} className="mx-auto mb-2 opacity-20"/>
                                    Нет новых уведомлений
                                </div>
                            ) : (
                                notifications.map(n => (
                                    <div
                                        key={n.id}
                                        onClick={() => handleMarkAsRead(n.id)}
                                        className="p-4 border-b border-gray-50 hover:bg-blue-50 cursor-pointer transition-colors group relative"
                                    >
                                        <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full group-hover:bg-blue-600 transition-colors"></div>
                                        <p className="font-bold text-sm text-gray-800 pr-4">{n.title}</p>
                                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">{n.message}</p>
                                        <p className="text-[10px] text-gray-400 mt-2">{new Date(n.created_at).toLocaleString()}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Профиль */}
            <div className="relative">
              <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 pl-2 pr-1 py-1 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-colors">
                <div className="text-right hidden md:block">
                  <div className="text-sm font-semibold text-gray-700">{user?.name || 'Пользователь'}</div>
                  <div className="text-xs text-gray-400 truncate max-w-[150px]">{user?.position || 'Сотрудник'}</div>
                </div>
                <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 border border-white shadow-sm overflow-hidden">
                   <User size={20} />
                </div>
                <ChevronDown size={14} className="text-gray-300 hidden md:block" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-[100] animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                  <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                    <p className="text-sm font-bold text-gray-900">{user?.name}</p>
                    <p className="text-xs text-blue-600 font-medium mb-3">{user?.position}</p>
                    <div className="space-y-2.5">
                        <div className="flex items-start gap-2">
                            <Building2 size={14} className="text-gray-400 mt-0.5 shrink-0" />
                            <div className="flex flex-col"><span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-0.5">Предприятие</span><span className="text-xs text-gray-700 font-medium">{user?.organization}</span></div>
                        </div>
                    </div>
                  </div>
                  <button onClick={onLogout} className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"><LogOut size={16} className="mr-2" /> Выйти</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar and Main Content */}
      <div className="flex flex-1 overflow-hidden relative w-full">
        <aside className={`fixed lg:static inset-y-0 left-0 z-20 w-72 bg-white border-r border-gray-100 text-slate-500 transform transition-transform duration-300 ease-in-out shadow-lg lg:shadow-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col h-full pt-16 lg:pt-0 shrink-0`}>
          <div className="flex-1 p-4 space-y-1 overflow-y-auto">
            <div className="px-3 py-4 mb-2"><h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Меню</h3></div>

            <SidebarLink icon={<LayoutDashboard size={20}/>} label="Главное" active={currentView === 'DASHBOARD'} onClick={onNavigate} />

            {/* 👇 СКРЫВАЕМ КНОПКУ, ЕСЛИ НЕТ ПРАВ */}
            {canCreatePermit && (
                <SidebarLink icon={<FilePlus size={20}/>} label="Создать Наряд" active={currentView === 'CREATE'} onClick={onCreate} />
            )}

            <SidebarLink
                icon={<CheckSquare size={20}/>}
                label="Мои Задачи"
                badge={notifications.length > 0 ? notifications.length.toString() : undefined}
                active={currentView === 'MY_TASKS'}
                onClick={onNavigateMyTasks}
            />

            {hasPermission('VIEW_LOTO_LOGS') && (<SidebarLink icon={<ClipboardList size={20}/>} label="Отчеты LOTO" active={currentView === 'LOTO_REPORTS'} onClick={onNavigateLoto}/>)}
            <div className="my-4 border-t border-gray-50"></div>
            <SidebarLink icon={<FileText size={20}/>} label="Архив" />
          </div>
          <div className="p-4 border-t border-gray-100 bg-white">
             <button onClick={onLogout} className="flex items-center gap-3 text-sm font-medium text-slate-400 hover:text-red-600 transition-colors w-full px-3 py-2 rounded-lg hover:bg-red-50 hover:shadow-sm"><LogOut size={18} /><span>Выйти из системы</span></button>
             <div className="text-[10px] text-gray-300 mt-4 text-center"><p>&copy; 2026 АО «Каражанбасмунай»</p></div>
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