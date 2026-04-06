import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { PermitDetail } from './pages/PermitDetail';
import { CreatePermit } from './pages/CreatePermit';
import { Login } from './pages/Login';
import { LotoReports } from './pages/LotoReports';
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

  // --- FETCHING DATA (Функция загрузки) ---
  const fetchPermits = async () => {
    setIsLoading(true);
    try {
        const response = await fetch('/api/v1/permits/', {
            headers: { 'Authorization': `Token ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            setPermits(data);
        } else if (response.status === 401) {
            handleLogout();
        }
    } catch (error) {
        console.error("Ошибка загрузки:", error);
    } finally {
        setIsLoading(false);
    }
  };

  // --- EFFECT 1: LOAD PERMITS FOR DASHBOARD ---
  useEffect(() => {
    if (token && currentView === 'DASHBOARD') {
      fetch('/api/v1/permits/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Ошибка загрузки списка нарядов');
      })
      .then(data => {
        const items = Array.isArray(data) ? data : (data.results || []);
        const formattedPermits = items.map((p: any) => ({
          id: p.id,
          permitId: p.permit_id,
          templateType: p.templateType || 'Наряд повышенной опасности',
          status: p.status,
          scan_file: p.scan_file,
          safety_document: p.safety_document,
          initiator: {
            name: p.initiator.name || `${p.initiator.last_name} ${p.initiator.first_name}`,
            position: p.initiator.position,
            iin: p.initiator.iin,
            bin: p.initiator.bin,
            id: p.initiator.id
          },
          location: {
            name: p.location_name || 'Место не указано'
          },
          createdAt: p.created_at,
          validFrom: p.valid_from,
          validTo: p.valid_to,
          data: p.data,
          approvalSteps: p.approval_steps
        }));
        setPermits(formattedPermits);
      })
      .catch(err => console.error("Ошибка при получении нарядов:", err));
    }
  }, [token, currentView]);

  // --- EFFECT 2: LOAD SINGLE PERMIT (Fix for My Tasks) ---
  useEffect(() => {
    // Если мы в режиме просмотра деталей и выбран ID
    if (currentView === 'DETAIL' && selectedPermitId && token) {
        // Проверяем, есть ли наряд в памяти (сравниваем как строки!)
        const existing = permits.find(p => String(p.id) === String(selectedPermitId));

        // Если наряда нет — загружаем его
        if (!existing) {
            console.log("Загружаю детали наряда ID:", selectedPermitId);

            fetch(`/api/v1/permits/${selectedPermitId}/`, {
                headers: { 'Authorization': `Token ${token}` }
            })
            .then(res => {
                if (res.ok) return res.json();
                throw new Error('Не удалось загрузить наряд');
            })
            .then(p => {
                // Форматируем данные
                const formattedPermit: WorkPermit = {
                    id: p.id,
                    permitId: p.permit_id,
                    templateType: p.templateType || 'Наряд повышенной опасности',
                    status: p.status,
                    scan_file: p.scan_file,
                    safety_document: p.safety_document,
                    initiator: {
                        name: p.initiator.name || `${p.initiator.last_name} ${p.initiator.first_name}`,
                        position: p.initiator.position,
                        iin: p.initiator.iin,
                        bin: p.initiator.bin,
                        id: p.initiator.id
                    },
                    location: {
                        name: p.location_name || 'Место не указано'
                    },
                    createdAt: p.created_at,
                    validFrom: p.valid_from,
                    validTo: p.valid_to,
                    data: p.data,
                    approvalSteps: p.approval_steps
                };

                // Добавляем в список (с проверкой на дубликаты)
                setPermits(prev => {
                    if (prev.find(item => String(item.id) === String(formattedPermit.id))) {
                        return prev;
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
    }
  }, [selectedPermitId, currentView, token, permits]);

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
  const handleEditPermit = (permit: WorkPermit) => {
      setEditingPermit(permit);
      setSelectedCategory(PermitCategory.DANGEROUS);
      setCurrentView('CREATE');
      window.scrollTo(0, 0);
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
          permitId: p.permit_id,
          templateType: p.templateType || 'Наряд повышенной опасности',
          status: p.status,
          scan_file: p.scan_file,
          safety_document: p.safety_document,
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
        onNavigateModules={() => setCurrentView('MODULE_SELECT')}
        onCreate={handleCreateNew}
        onLogout={handleLogout}
        user={{
          name: userData?.name ||
                [userData?.last_name, userData?.first_name, userData?.surname].filter(Boolean).join(' ') ||
                'Пользователь',
          position: userData?.position || 'Сотрудник',
          department: userData?.department || 'Не указано',
          organization: userData?.company || 'АО "Каражанбасмунай"',
          permissions: userData?.role === 'ADMIN'
            ? ['CREATE_PERMIT', 'VIEW_LOTO_LOGS', 'APPROVE_PERMIT', 'ADMIN_ACCESS']
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
             onNavigateToPermit={() => alert('Функция в разработке')}
          />
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