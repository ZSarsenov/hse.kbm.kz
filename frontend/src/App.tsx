import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { PermitDetail } from './pages/PermitDetail';
import { CreatePermit } from './pages/CreatePermit';
import { Login } from './pages/Login';
import { LotoReports } from './pages/LotoReports';
import { AuditStatistics } from './pages/AuditStatistics';
import { MyTasks } from './pages/MyTasks';
import { PermitTypeSelector } from './components/PermitTypeSelector';
import { ModuleSelector } from './components/ModuleSelector';
import { WorkPermit, PageView, PermitCategory } from './types';
import { AIAssistant } from './components/AIAssistant';

function App() {
  const { t } = useTranslation();
  // 1. Auth & User Data
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [userData, setUserData] = useState<any>(() => {
      const savedUser = localStorage.getItem('user_data');
      return savedUser ? JSON.parse(savedUser) : null;
  });


  const isLoggedIn = !!token;

  // 2. Navigation State
  const [currentView, setCurrentView] = useState<PageView>('MODULE_SELECT');
  const [selectedPermitId, setSelectedPermitId] = useState<string | null>(null);

  // 3. Create/Edit State
  const [isTypeSelectorOpen, setIsTypeSelectorOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<PermitCategory>(PermitCategory.DANGEROUS);

  // Стейт для редактирования
  const [editingPermit, setEditingPermit] = useState<WorkPermit | null>(null);

  // 4. Data State
  const [permits, setPermits] = useState<WorkPermit[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);

  // Приводит сырой объект наряда из API к нашему формату camelCase
  const formatPermit = (p: any): WorkPermit => ({
    id: p.id,
    permitId: p.permit_id || 'Черновик',
    templateType: p.templateType || 'Наряд повышенной опасности',
    status: p.status,
    scan_file: p.scan_file,
    safety_document: p.safety_document,
    loto_photo: p.loto_photo,
    initiator: {
      name: p.initiator?.name || [p.initiator?.last_name, p.initiator?.first_name].filter(Boolean).join(' ') || '—',
      position: p.initiator?.position,
      iin: p.initiator?.iin,
      bin: p.initiator?.bin,
      id: p.initiator?.id,
    },
    location: { name: p.location_name || 'Место не указано' },
    createdAt: p.created_at,
    validFrom: p.valid_from,
    validTo: p.valid_to,
    data: p.data,
    approvalSteps: p.approval_steps,
    producer_closed: p.producer_closed,
  });

  // --- FETCHING DATA: первая страница быстро, остальные — в фоне ---
  // Бэкенд использует пагинацию DRF (PAGE_SIZE=20). Чтобы UX был мгновенным,
  // сначала показываем 20 первых нарядов, затем подгружаем page=2,3,... в фоне.
  const fetchPermits = async (currentToken: string) => {
    setIsLoading(true);
    try {
      const firstResp = await fetch('/api/v1/permits/?page=1', {
        headers: { 'Authorization': `Token ${currentToken}` },
      });
      if (firstResp.status === 401) {
        handleLogout();
        return;
      }
      if (!firstResp.ok) throw new Error('Ошибка загрузки списка нарядов');
      const firstData = await firstResp.json();

      // Поддержка обоих форматов: пагинированный {results,count,next} или массив (на случай отключённой пагинации)
      const firstItems: any[] = Array.isArray(firstData) ? firstData : (firstData.results || []);
      setPermits(firstItems.map(formatPermit));
      setIsLoading(false); // Dashboard уже может рендерить первые 20

      // Если массив (старый формат без пагинации) — больше ничего не догружаем
      if (Array.isArray(firstData)) return;

      // Догружаем остальные страницы в фоне
      const totalCount: number = firstData.count || 0;
      const pageSize = firstItems.length || 20;
      const totalPages = Math.ceil(totalCount / pageSize);
      if (totalPages <= 1) return;

      setIsBackgroundLoading(true);
      for (let page = 2; page <= totalPages; page++) {
        const resp = await fetch(`/api/v1/permits/?page=${page}`, {
          headers: { 'Authorization': `Token ${currentToken}` },
        });
        if (!resp.ok) break;
        const data = await resp.json();
        const items: any[] = Array.isArray(data) ? data : (data.results || []);
        if (items.length === 0) break;
        setPermits(prev => [...prev, ...items.map(formatPermit)]);
      }
      setIsBackgroundLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      setIsLoading(false);
      setIsBackgroundLoading(false);
    }
  };

  // --- EFFECT 1: LOAD PERMITS FOR DASHBOARD ---
  useEffect(() => {
    if (token && currentView === 'DASHBOARD') {
      fetchPermits(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, currentView]);

  // --- EFFECT 2: LOAD FULL PERMIT FOR DETAIL VIEW ---
  // ВАЖНО: после оптимизации (Этап 2) список нарядов от /api/v1/permits/
  // отдаёт ОБЛЕГЧЁННУЮ версию data (без safetyMeasures, teamMembers, checklist,
  // isolationMatrix, riskTable и др. тяжёлых полей). Полная версия доступна
  // только через GET /api/v1/permits/{id}/. Поэтому при открытии деталей
  // ВСЕГДА дозапрашиваем полный наряд и заменяем кешированную облегчённую
  // версию на полную — иначе вкладки "Бригада", "Меры", "LOTO" и т.д. пустые.
  useEffect(() => {
    if (currentView === 'DETAIL' && selectedPermitId && token) {
      fetch(`/api/v1/permits/${selectedPermitId}/`, {
        headers: { 'Authorization': `Token ${token}` }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Не удалось загрузить наряд');
      })
      .then(p => {
        const formattedPermit: WorkPermit = {
          id: p.id,
          permitId: p.permit_id || 'Черновик',
          templateType: p.templateType || 'Наряд повышенной опасности',
          status: p.status,
          scan_file: p.scan_file,
          safety_document: p.safety_document,
          loto_photo: p.loto_photo,
          initiator: {
            name: p.initiator?.name || [p.initiator?.last_name, p.initiator?.first_name].filter(Boolean).join(' ') || '—',
            position: p.initiator?.position,
            iin: p.initiator?.iin,
            bin: p.initiator?.bin,
            id: p.initiator?.id,
          },
          location: {
            name: p.location_name || 'Место не указано'
          },
          createdAt: p.created_at,
          validFrom: p.valid_from,
          validTo: p.valid_to,
          data: p.data,
          approvalSteps: p.approval_steps,
          producer_closed: p.producer_closed,
        };

        // Заменяем облегчённую версию на полную или добавляем, если не было
        setPermits(prev => {
          const exists = prev.some(item => String(item.id) === String(formattedPermit.id));
          if (exists) {
            return prev.map(item =>
              String(item.id) === String(formattedPermit.id) ? formattedPermit : item
            );
          }
          return [...prev, formattedPermit];
        });
      })
      .catch(err => {
        console.error("Ошибка загрузки деталей наряда:", err);
        alert(t('app.openPermitFail'));
        setCurrentView('MY_TASKS' as any);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPermitId, currentView, token]);

  // --- HANDLERS ---
  const handleLogin = (newToken: string, data: any) => {
    localStorage.setItem('auth_token', newToken);
    setToken(newToken);
    localStorage.setItem('user_data', JSON.stringify(data));
    setUserData(data);
    setCurrentView('MODULE_SELECT');
  };

  const handleSelectModule = (module: string) => {
    if (module === 'permits') {
      setCurrentView('DASHBOARD');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setToken(null);
    setUserData(null);
    setCurrentView('LOGIN');
  };

  const handleSelectPermit = (id: string) => {
    setSelectedPermitId(id);
    setCurrentView('DETAIL');
    window.scrollTo(0, 0);
  };

  // Навигация
  const handleNavigateDashboard = () => {
    setCurrentView('DASHBOARD');
    setSelectedPermitId(null);
    setEditingPermit(null);
  };

  const handleNavigateLoto = () => {
    setCurrentView('LOTO_REPORTS');
    setSelectedPermitId(null);
  };

  const handleNavigateArchive = () => {
      setCurrentView('ARCHIVE');
      setSelectedPermitId(null);
  };

  const handleNavigateAuditStats = () => {
    setCurrentView('AUDIT_STATS');
    setSelectedPermitId(null);
  };

  const handleNavigateMyTasks = () => {
    setCurrentView('MY_TASKS' as any);
    setSelectedPermitId(null);
    setEditingPermit(null);
  };

  const handleCreateNew = () => {
      setEditingPermit(null);
      setIsTypeSelectorOpen(true);
  };

  // Редактирование
  // ВАЖНО: списочный эндпоинт /api/v1/permits/ отдаёт ОБЛЕГЧЁННУЮ data
  // (без teamMembers, riskTable, checklist, m5_* и др. — см. PermitListSerializer
  // LIST_DATA_KEYS). Если открыть редактирование с этими "дырявыми" данными
  // и сохранить через PUT — бэкенд перезапишет JSON-поле в БД пустотой.
  // Поэтому ВСЕГДА явно догружаем полную версию через /api/v1/permits/{id}/
  // перед показом формы редактирования.
  const handleEditPermit = async (permit: WorkPermit) => {
      if (!token) return;
      setSelectedCategory(PermitCategory.DANGEROUS);
      // Сначала переходим во view CREATE с временно "обрезанной" версией —
      // показываем форму, чтобы не было паузы. Полная версия подгрузится через
      // мгновение и заменит state.
      setEditingPermit(permit);
      setCurrentView('CREATE');
      window.scrollTo(0, 0);
      try {
          const response = await fetch(`/api/v1/permits/${permit.id}/`, {
              headers: { 'Authorization': `Token ${token}` }
          });
          if (response.ok) {
              const raw = await response.json();
              const fullPermit = formatPermit(raw);
              setEditingPermit(fullPermit);
              // Также обновляем кеш — нам пригодится при следующем открытии деталей
              setPermits(prev => prev.map(item =>
                  String(item.id) === String(fullPermit.id) ? fullPermit : item
              ));
          } else if (response.status === 401) {
              handleLogout();
          }
      } catch (e) {
          console.error('Ошибка догрузки полной версии для редактирования:', e);
          // Падать назад не нужно — у нас уже есть кешированная версия в editingPermit
      }
  };

  // Удаление
  const handleDeletePermit = async (id: string) => {
    if (!window.confirm(t('app.deleteConfirm'))) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/permits/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      if (response.ok) {
        setPermits(prev => prev.filter(p => String(p.id) !== String(id)));
        setSelectedPermitId(null);
        setCurrentView('DASHBOARD');
        alert(t('app.deleteOk'));
      } else {
        alert(t('app.deleteFail'));
      }
    } catch (error) {
      console.error(error);
      alert(t('app.connectionError'));
    }
  };

  const handleSelectCategory = (category: PermitCategory) => {
    setSelectedCategory(category);
    setIsTypeSelectorOpen(false);
    setCurrentView('CREATE');
    window.scrollTo(0, 0);
  };

  const handleCloseCreate = () => {
    setCurrentView('DASHBOARD');
    setEditingPermit(null);
  };

  const handleSubmitNew = () => {
    setCurrentView('DASHBOARD');
    setEditingPermit(null);
  };

  // 👇 ГЛАВНОЕ ИСПРАВЛЕНИЕ: Преобразуем оба ID в строку для сравнения
  const getSelectedPermit = () => permits.find(p => String(p.id) === String(selectedPermitId));

  const refetchSelectedPermit = () => {
    if (!selectedPermitId || !token) return;
    fetch(`/api/v1/permits/${selectedPermitId}/`, { headers: { 'Authorization': `Token ${token}` } })
      .then(res => res.ok ? res.json() : Promise.reject(new Error('Не удалось загрузить наряд')))
      .then(p => {
        const formattedPermit: WorkPermit = {
          id: p.id,
          permitId: p.permit_id || 'Черновик',
          templateType: p.templateType || 'Наряд повышенной опасности',
          status: p.status,
          scan_file: p.scan_file,
          safety_document: p.safety_document,
          loto_photo: p.loto_photo,
          initiator: {
            name: p.initiator?.name || [p.initiator?.last_name, p.initiator?.first_name, p.initiator?.surname].filter(Boolean).join(' ') || '—',
            position: p.initiator?.position,
            iin: p.initiator?.iin,
            bin: p.initiator?.bin,
            id: p.initiator?.id,
          },
          location: { name: p.location_name || 'Место не указано' },
          createdAt: p.created_at,
          validFrom: p.valid_from,
          validTo: p.valid_to,
          data: p.data,
          approvalSteps: p.approval_steps,
          producer_closed: p.producer_closed,
        };
        setPermits(prev => prev.map(permit => String(permit.id) === String(formattedPermit.id) ? formattedPermit : permit));
      })
      .catch(err => console.error('Ошибка обновления наряда:', err));
  };

  // --- RENDER ---
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  if (currentView === 'MODULE_SELECT') {
    return (
      <ModuleSelector
        onSelectModule={handleSelectModule}
        userName={
          userData?.name ||
          [userData?.last_name, userData?.first_name].filter(Boolean).join(' ') ||
          'Пользователь'
        }
      />
    );
  }

  return (
    <>
      <Layout
        onNavigate={handleNavigateDashboard}
        onNavigateLoto={handleNavigateLoto}
        onNavigateMyTasks={handleNavigateMyTasks}
        onNavigateArchive={handleNavigateArchive}
        onNavigateAuditStats={handleNavigateAuditStats}
        onNavigateModules={() => setCurrentView('MODULE_SELECT')}
        onCreate={handleCreateNew}
        onLogout={handleLogout}
        onSelectPermit={handleSelectPermit}
        user={{
          name: userData?.name ||
                [userData?.last_name, userData?.first_name, userData?.surname].filter(Boolean).join(' ') ||
                'Пользователь',
          position: userData?.position || 'Сотрудник',
          department: userData?.department || 'Не указано',
          organization: userData?.company || 'АО "Каражанбасмунай"',
          role: userData?.role,
          permissions: userData?.role === 'ADMIN'
            ? ['CREATE_PERMIT', 'VIEW_LOTO_LOGS', 'APPROVE_PERMIT', 'ADMIN_ACCESS', 'VIEW_AUDIT_STATS']
            : userData?.role === 'AUDITOR'
              ? ['VIEW_AUDIT_STATS']
              : ['CREATE_PERMIT', 'VIEW_LOTO_LOGS']
        }}
        currentView={currentView}
      >
        {/* ГЛАВНАЯ ПАНЕЛЬ */}
        {/* ГЛАВНАЯ СТРАНИЦА ИЛИ АРХИВ */}
        {(currentView === 'DASHBOARD' || currentView === 'ARCHIVE') && (
          selectedPermitId && getSelectedPermit() ? (
              <PermitDetail
                permit={getSelectedPermit()!}
                onBack={handleNavigateDashboard}
                onEdit={() => handleEditPermit(getSelectedPermit()!)}
                onDelete={() => handleDeletePermit(selectedPermitId)}
                onRefresh={refetchSelectedPermit}
              />
          ) : (
              isLoading ? (
                  <div className="flex flex-col justify-center items-center h-full min-h-[50vh] text-slate-500">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-600 mb-4"></div>
                      <p>Загрузка данных...</p>
                  </div>
              ) : (
                  <Dashboard
                    permits={permits}
                    onSelectPermit={handleSelectPermit}
                    onCreateNew={handleCreateNew}
                    isArchiveView={currentView === 'ARCHIVE'}
                    isBackgroundLoading={isBackgroundLoading}
                  />
              )
          )
        )}

        {/* СТРАНИЦА "МОИ ЗАДАЧИ" */}
        {currentView === 'MY_TASKS' && (
            <MyTasks onSelectPermit={handleSelectPermit} />
        )}

        {/* ПРОСМОТР НАРЯДА С ИНДИКАТОРОМ ЗАГРУЗКИ */}
        {currentView === 'DETAIL' && selectedPermitId && (
          // Если наряд найден — показываем его, иначе — спиннер загрузки
          getSelectedPermit() ? (
              <PermitDetail
                permit={getSelectedPermit()!}
                onBack={handleNavigateDashboard}
                onEdit={() => handleEditPermit(getSelectedPermit()!)}
                onDelete={() => handleDeletePermit(selectedPermitId)}
                onRefresh={refetchSelectedPermit}
              />
          ) : (
              <div className="flex flex-col justify-center items-center h-full min-h-[50vh] text-slate-500">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-600 mb-4"></div>
                  <p>Загрузка данных наряда...</p>
              </div>
          )
        )}

        {/* СОЗДАНИЕ / РЕДАКТИРОВАНИЕ */}
        {currentView === 'CREATE' && (
          <CreatePermit
            category={selectedCategory}
            onCancel={handleCloseCreate}
            onSubmit={handleSubmitNew}
            initialData={editingPermit}
          />
        )}

        {/* ОТЧЕТЫ LOTO */}
        {currentView === 'LOTO_REPORTS' && (
          <LotoReports
             onNavigateToPermit={handleSelectPermit}
          />
        )}

        {currentView === 'AUDIT_STATS' && (
          <AuditStatistics />
        )}
      </Layout>

      <PermitTypeSelector
        isOpen={isTypeSelectorOpen}
        onClose={() => setIsTypeSelectorOpen(false)}
        onSelect={handleSelectCategory}
      />
      {/* 👇 2. ВСТАВЛЯЕМ АССИСТЕНТА СЮДА (ПЕРЕД ЗАКРЫВАЮЩИМ ТЕГОМ) */}
      <AIAssistant />
    </>
  );
}

export default App;