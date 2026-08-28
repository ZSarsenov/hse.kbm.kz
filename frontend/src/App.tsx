import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { PermitTypeSelector } from './components/PermitTypeSelector';
import { ConfirmDialog, confirm as confirmDialog } from './components/ConfirmDialog';
import { Toasts, toast } from './components/Toasts';
import { CardErrorBoundary } from './components/ErrorBoundary';
import { formatPermit } from './utils/formatPermit';
import { ModuleSelector } from './components/ModuleSelector';
import { ListSkeleton } from './components/Skeleton';
import { WorkPermit, PageView, PermitCategory } from './types';

// Тяжёлые экраны подгружаются лениво — стартовый чанк меньше, первый вход быстрее.
// Карта (maplibre) уезжает в отдельный чанк внутри CreatePermit/WellMap.
const PermitDetail = lazy(() => import('./pages/PermitDetail').then(m => ({ default: m.PermitDetail })));
const CreatePermit = lazy(() => import('./pages/CreatePermit').then(m => ({ default: m.CreatePermit })));
const LotoReports = lazy(() => import('./pages/LotoReports').then(m => ({ default: m.LotoReports })));
const AuditStatistics = lazy(() => import('./pages/AuditStatistics').then(m => ({ default: m.AuditStatistics })));
const MyTasks = lazy(() => import('./pages/MyTasks').then(m => ({ default: m.MyTasks })));
const AIAssistant = lazy(() => import('./components/AIAssistant').then(m => ({ default: m.AIAssistant })));

const PageFallback = () => <div className="p-2 md:p-4"><ListSkeleton rows={6} /></div>;

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

  // Кеш списка нарядов: полный рефетч делаем только если список пуст,
  // сменился пользователь (token) или данные помечены устаревшими (dirty).
  const permitsDirtyRef = useRef(true);
  const loadedForTokenRef = useRef<string | null>(null);

  // Приводит сырой объект наряда из API к нашему формату — единая версия в utils/formatPermit

  // --- FETCHING DATA: первая страница крупным размером, остальные — параллельно ---
  // Бэкенд поддерживает ?page_size (до 200, см. DynamicPageSizePagination на бэке).
  // Сначала показываем первые 100 нарядов, затем (если их больше) догружаем
  // оставшиеся страницы ОДНОВРЕМЕННО, а не последовательно друг за другом.
  const fetchPermits = async (currentToken: string) => {
    setIsLoading(true);
    try {
      const firstResp = await fetch('/api/v1/permits/?page=1&page_size=100', {
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
      setIsLoading(false); // Dashboard уже может рендерить первую сотню

      // Если массив (старый формат без пагинации) — больше ничего не догружаем
      if (Array.isArray(firstData)) return;

      // Догружаем остальные страницы параллельно
      const totalCount: number = firstData.count || 0;
      const pageSize = firstItems.length || 100;
      const totalPages = Math.ceil(totalCount / pageSize);
      if (totalPages <= 1) return;

      setIsBackgroundLoading(true);
      const restPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
      const fetchPage = (page: number) =>
        fetch(`/api/v1/permits/?page=${page}&page_size=100`, {
          headers: { 'Authorization': `Token ${currentToken}` },
        })
          .then(resp => (resp.ok ? resp.json() : null))
          .catch(() => null);

      // Первая попытка — всей пачкой параллельно…
      const responses = await Promise.all(restPages.map(fetchPage));
      // …упавшие страницы (сеть/таймаут) переспрашиваем по одной
      const failedIdx = responses.map((r, i) => (r === null ? i : -1)).filter(i => i >= 0);
      for (const i of failedIdx) {
        responses[i] = await fetchPage(restPages[i]);
      }
      if (responses.some(r => r === null)) {
        console.warn('Часть страниц списка нарядов не загрузилась даже после повтора');
      }
      const restItems = responses.flatMap(data => {
        if (!data) return [];
        const items: any[] = Array.isArray(data) ? data : (data.results || []);
        return items.map(formatPermit);
      });
      if (restItems.length > 0) {
        setPermits(prev => [...prev, ...restItems]);
      }
      setIsBackgroundLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      setIsLoading(false);
      setIsBackgroundLoading(false);
    }
  };

  // --- EFFECT 1: LOAD PERMITS FOR DASHBOARD ---
  // Кеш: полный рефетч только когда список пуст, сменился token или выставлен
  // dirty-флаг. Обычные переходы дашборд↔карточка ничего не перезагружают —
  // локальный state обновляется точечно (удаление/подписи/редактирование).
  useEffect(() => {
    if (!token || currentView !== 'DASHBOARD') return;
    if (permits.length > 0 && !permitsDirtyRef.current && loadedForTokenRef.current === token) return;
    permitsDirtyRef.current = false;
    loadedForTokenRef.current = token;
    fetchPermits(token);
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
        const formattedPermit = formatPermit(p);

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
        toast({ message: t('app.openPermitFail'), type: 'error' });
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
    const ok = await confirmDialog({
      title: 'Удаление наряда',
      message: t('app.deleteConfirm'),
      confirmText: 'Удалить',
      danger: true,
    });
    if (!ok) {
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
        toast({ message: t('app.deleteOk'), type: 'success' });
      } else {
        toast({ message: t('app.deleteFail'), type: 'error' });
      }
    } catch (error) {
      console.error(error);
      toast({ message: t('app.connectionError'), type: 'error' });
    }
  };

  const handleSelectCategory = (category: PermitCategory) => {
    setSelectedCategory(category);
    setIsTypeSelectorOpen(false);
    setCurrentView('CREATE');
    window.scrollTo(0, 0);
  };

  const handleCloseCreate = () => {
    // Автосохранение могло создать черновик на сервере — список устарел
    permitsDirtyRef.current = true;
    setCurrentView('DASHBOARD');
    setEditingPermit(null);
  };

  const handleSubmitNew = () => {
    // Наряд создан/изменён — при возврате на дашборд список перезагрузится
    permitsDirtyRef.current = true;
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
        const formattedPermit = formatPermit(p);
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
              <CardErrorBoundary>
              <Suspense fallback={<PageFallback />}>
              <PermitDetail
                permit={getSelectedPermit()!}
                onBack={handleNavigateDashboard}
                onEdit={() => handleEditPermit(getSelectedPermit()!)}
                onDelete={() => handleDeletePermit(selectedPermitId)}
                onRefresh={refetchSelectedPermit}
              />
              </Suspense>
              </CardErrorBoundary>
          ) : (
              isLoading ? (
                  <ListSkeleton rows={8} />
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
            <Suspense fallback={<PageFallback />}>
            <MyTasks onSelectPermit={handleSelectPermit} />
            </Suspense>
        )}

        {/* ПРОСМОТР НАРЯДА С ИНДИКАТОРОМ ЗАГРУЗКИ */}
        {currentView === 'DETAIL' && selectedPermitId && (
          // Если наряд найден — показываем его, иначе — скелетон загрузки
          getSelectedPermit() ? (
              <CardErrorBoundary>
              <Suspense fallback={<PageFallback />}>
              <PermitDetail
                permit={getSelectedPermit()!}
                onBack={handleNavigateDashboard}
                onEdit={() => handleEditPermit(getSelectedPermit()!)}
                onDelete={() => handleDeletePermit(selectedPermitId)}
                onRefresh={refetchSelectedPermit}
              />
              </Suspense>
              </CardErrorBoundary>
          ) : (
              <ListSkeleton rows={6} />
          )
        )}

        {/* СОЗДАНИЕ / РЕДАКТИРОВАНИЕ */}
        {currentView === 'CREATE' && (
          <Suspense fallback={<PageFallback />}>
          <CreatePermit
            category={selectedCategory}
            onCancel={handleCloseCreate}
            onSubmit={handleSubmitNew}
            initialData={editingPermit}
          />
          </Suspense>
        )}

        {/* ОТЧЕТЫ LOTO */}
        {currentView === 'LOTO_REPORTS' && (
          <Suspense fallback={<PageFallback />}>
          <LotoReports
             onNavigateToPermit={handleSelectPermit}
          />
          </Suspense>
        )}

        {currentView === 'AUDIT_STATS' && (
          <Suspense fallback={<PageFallback />}>
          <AuditStatistics />
          </Suspense>
        )}
      </Layout>

      <PermitTypeSelector
        isOpen={isTypeSelectorOpen}
        onClose={() => setIsTypeSelectorOpen(false)}
        onSelect={handleSelectCategory}
      />
      {/* 👇 2. ВСТАВЛЯЕМ АССИСТЕНТА СЮДА (ПЕРЕД ЗАКРЫВАЮЩИМ ТЕГОМ) */}
      <Suspense fallback={null}>
        <AIAssistant />
      </Suspense>

      {/* Стилизованные диалоги подтверждения (вместо window.confirm) */}
      <ConfirmDialog />

      {/* Всплывающие уведомления (вместо window.alert) */}
      <Toasts />
    </>
  );
}

export default App;