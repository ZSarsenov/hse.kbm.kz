import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Calendar, BarChart3, TrendingUp, MapPin, Building2, ClipboardList } from 'lucide-react';

type StatsResponse = {
  filters: { date_from?: string; date_to?: string; group_by: 'day' | 'week' | 'month' };
  kpi: {
    total_all_time: number;
    created_in_period: number;
    closed_in_period: number;
    rejected_in_period: number;
    close_rate_percent: number;
    reject_rate_percent: number;
  };
  status_distribution: Array<{ status: string; count: number }>;
  permits_trend: Array<{ period: string; count: number }>;
  top_work_types: Array<{ name: string; count: number }>;
  top_locations: Array<{ name: string; count: number }>;
  top_departments: Array<{ name: string; count: number }>;
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#94a3b8',
  PENDING_APPROVAL: '#f59e0b',
  APPROVED: '#2563eb',
  REJECTED: '#ef4444',
  CLOSED: '#16a34a',
};

const PIE_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#94a3b8'];
const MAX_AXIS_LABEL_LEN = 42;

const truncateLabel = (value: string, max = MAX_AXIS_LABEL_LEN) => {
  if (!value) return '';
  return value.length > max ? `${value.slice(0, max - 1)}...` : value;
};

export const AuditStatistics: React.FC = () => {
  const { t } = useTranslation();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<StatsResponse | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);
      params.set('group_by', groupBy);

      const res = await fetch(`/api/v1/permits/audit_stats/?${params.toString()}`, {
        headers: token ? { Authorization: `Token ${token}` } : {}
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || `Ошибка загрузки: ${res.status}`);
      }
      const data = await res.json();
      setStats(data);
    } catch (e: any) {
      setError(e?.message || t('auditStats.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStats();
  }, [groupBy]);

  const statusData = useMemo(
    () =>
      (stats?.status_distribution || []).map((item) => ({
        ...item,
        label: t(`status.${item.status}` as any),
      })),
    [stats, t]
  );

  const topWorkTypesData = useMemo(
    () =>
      (stats?.top_work_types || []).map((item) => ({
        ...item,
        shortName: truncateLabel(item.name),
      })),
    [stats]
  );

  const topLocationsData = useMemo(
    () =>
      (stats?.top_locations || []).map((item) => ({
        ...item,
        shortName: truncateLabel(item.name),
      })),
    [stats]
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('auditStats.title')}</h1>
          <p className="text-slate-500 mt-2">{t('auditStats.subtitle')}</p>
        </div>
        <button
          onClick={() => void loadStats()}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          {t('auditStats.refresh')}
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">{t('auditStats.dateFrom')}</label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">{t('auditStats.dateTo')}</label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">{t('auditStats.groupBy')}</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as 'day' | 'week' | 'month')}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="day">{t('auditStats.day')}</option>
              <option value="week">{t('auditStats.week')}</option>
              <option value="month">{t('auditStats.month')}</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => void loadStats()}
              className="w-full bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-900 transition-colors"
            >
              {t('auditStats.applyFilters')}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-500">{t('auditStats.loading')}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <KpiCard icon={<ClipboardList size={18} />} title={t('auditStats.kpiTotalAll')} value={stats?.kpi.total_all_time ?? 0} />
            <KpiCard icon={<BarChart3 size={18} />} title={t('auditStats.kpiCreatedPeriod')} value={stats?.kpi.created_in_period ?? 0} />
            <KpiCard icon={<TrendingUp size={18} />} title={t('auditStats.kpiCloseRate')} value={`${stats?.kpi.close_rate_percent ?? 0}%`} />
            <KpiCard icon={<TrendingUp size={18} />} title={t('auditStats.kpiRejectRate')} value={`${stats?.kpi.reject_rate_percent ?? 0}%`} />
            <KpiCard icon={<MapPin size={18} />} title={t('auditStats.kpiClosed')} value={stats?.kpi.closed_in_period ?? 0} />
            <KpiCard icon={<Building2 size={18} />} title={t('auditStats.kpiRejected')} value={stats?.kpi.rejected_in_period ?? 0} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <ChartCard title={t('auditStats.trendTitle')}>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={stats?.permits_trend || []} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title={t('auditStats.statusTitle')}>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={statusData} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={100} label>
                    {statusData.map((entry, index) => (
                      <Cell key={entry.status} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title={t('auditStats.topWorkTypesTitle')}>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={topWorkTypesData} layout="vertical" margin={{ top: 8, right: 12, left: 20, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="shortName" width={240} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: any) => [value, t('auditStats.permits')]}
                    labelFormatter={(_: any, payload: any) => payload?.[0]?.payload?.name || ''}
                  />
                  <Bar dataKey="count" fill="#2563eb" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title={t('auditStats.topLocationsTitle')}>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={topLocationsData} layout="vertical" margin={{ top: 8, right: 12, left: 20, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="shortName" width={240} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: any) => [value, t('auditStats.permits')]}
                    labelFormatter={(_: any, payload: any) => payload?.[0]?.payload?.name || ''}
                  />
                  <Bar dataKey="count" fill="#16a34a" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <ChartCard title={t('auditStats.statusBarTitle')}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.status_distribution || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" tickFormatter={(v) => t(`status.${v}` as any)} />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(value: any) => [value, t('auditStats.permits')]} labelFormatter={(v) => t(`status.${v}` as any)} />
                <Bar dataKey="count">
                  {(stats?.status_distribution || []).map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#2563eb'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </>
      )}
    </div>
  );
};

const KpiCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number }> = ({ icon, title, value }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
    <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
      {icon}
      <span>{title}</span>
    </div>
    <div className="text-2xl font-bold text-slate-900">{value}</div>
  </div>
);

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 shadow-sm">
    <h3 className="text-base font-semibold text-slate-900 mb-3">{title}</h3>
    {children}
  </div>
);

