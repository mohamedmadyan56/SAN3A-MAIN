'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Sidebar from '@/components/dashboard/Sidebar';
import { API_BASE, getAuthHeaders } from '@/lib/api';

interface User {
  name: string;
  rating: number;
  avgResponseTimeSeconds: number | null;
  isAvailable: boolean;
}

interface Job {
  _id: string;
  client: { name: string; phone: string };
  service: { nameAr: string };
  status: string;
  pricing: { totalAmount: number };
  location: { address: string };
  clientNotes: string;
  createdAt: string;
  distance?: number;
}

interface DashboardData {
  user: User;
  stats: { activeJobs: number; completedJobs: number; totalEarnings: number; todayEarnings: number; rating: number; avgResponseTime: number | null };
  activeJobs: Job[];
  recentJobs: Job[];
  availableRequests: Job[];
}

const brand = '#0f5132';
const brandLight = '#eef6ef';
const POLL_INTERVAL = 8000;
const MODAL_TIMEOUT = 30;

export default function CraftsmanDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const [pendingModal, setPendingModal] = useState<Job | null>(null);
  const [modalTimer, setModalTimer] = useState(MODAL_TIMEOUT);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const modalQueueRef = useRef<Job[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isModalActiveRef = useRef(false);

  const showNextFromQueue = () => {
    if (modalQueueRef.current.length === 0) {
      setPendingModal(null);
      isModalActiveRef.current = false;
      setModalTimer(MODAL_TIMEOUT);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }
    const next = modalQueueRef.current.shift()!;
    setPendingModal(next);
    isModalActiveRef.current = true;
    setModalTimer(MODAL_TIMEOUT);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setModalTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          showNextFromQueue();
          return MODAL_TIMEOUT;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const dismissModal = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    showNextFromQueue();
  };

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/users/dashboard/craftsman`, {
        headers: getAuthHeaders(),
      });
      if (res.data.status === 'success') {
        const newData = res.data.data as DashboardData;
        setData(newData);

        const newRequests = (newData.availableRequests || []).filter(
          (r) => !seenIdsRef.current.has(r._id)
        );
        if (newRequests.length > 0) {
          newRequests.forEach((r) => seenIdsRef.current.add(r._id));
          modalQueueRef.current.push(...newRequests);
          if (!isModalActiveRef.current) {
            showNextFromQueue();
          }
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('user_token');
    if (!token) { router.push('/login'); return; }

    (async () => {
      try {
        const res = await axios.get(`${API_BASE}/users/dashboard/craftsman`, {
          headers: getAuthHeaders(),
        });
        if (res.data.status === 'success') {
          const initialData = res.data.data as DashboardData;
          setData(initialData);
          seenIdsRef.current = new Set(
            (initialData.availableRequests || []).map((r) => r._id)
          );
        }
      } catch {} finally {
        setLoading(false);
      }
    })();

    const pollInterval = setInterval(fetchData, POLL_INTERVAL);
    return () => {
      clearInterval(pollInterval);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleAccept = async (id: string) => {
    try {
      await axios.post(`${API_BASE}/requests/${id}/accept`, {}, {
        headers: getAuthHeaders(),
      });
      setData((prev) => prev ? {
        ...prev,
        availableRequests: prev.availableRequests.filter((r) => r._id !== id),
        stats: { ...prev.stats, activeJobs: prev.stats.activeJobs + 1 },
      } : prev);
    } catch {}
    dismissModal();
  };

  const handleCraftsmanAccept = async (id: string) => {
    try {
      await axios.post(`${API_BASE}/requests/${id}/accept`, {}, { headers: getAuthHeaders() });
      setData((prev) => prev ? {
        ...prev,
        activeJobs: prev.activeJobs.map((j) => j._id === id ? { ...j, status: 'ACCEPTED' } : j),
        stats: prev.stats ? { ...prev.stats } : prev.stats,
      } : prev);
    } catch {}
    dismissModal();
  };

  const handleReject = async (id: string) => {
    try {
      await axios.post(`${API_BASE}/requests/${id}/reject`, {}, {
        headers: getAuthHeaders(),
      });
      setData((prev) => prev ? {
        ...prev,
        availableRequests: prev.availableRequests.filter((r) => r._id !== id),
      } : prev);
    } catch {}
    dismissModal();
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await axios.patch(`${API_BASE}/requests/${id}/status`, { status }, {
        headers: getAuthHeaders(),
      });
      if (status === 'COMPLETED') {
        await axios.patch(`${API_BASE}/requests/${id}/complete`, {}, {
          headers: getAuthHeaders(),
        });
      }
      window.location.reload();
    } catch {}
  };

  const NAV_ITEMS = [
    { label: 'لوحة التحكم', href: '/dashboard/craftsman', icon: '📊' },
    { label: 'الطلبات المتاحة', href: '/dashboard/craftsman/available', icon: '📋' },
    { label: 'المهام النشطة', href: '/dashboard/craftsman/active', icon: '🔧' },
    { label: 'السجل', href: '/dashboard/craftsman/history', icon: '📜' },
    { label: 'الإعدادات', href: '/dashboard/settings', icon: '⚙️' },
  ];

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      PENDING_MATCHING: 'متاح',
      SELECTED: 'بانتظار التأكيد',
      ACCEPTED: 'مقبول',
      ARRIVED: 'في الطريق',
      IN_PROGRESS: 'قيد التنفيذ',
      COMPLETED: 'مكتمل',
    };
    return map[s] || s;
  };

  const statusBadge = (s: string) => {
    const variants: Record<string, string> = {
      SELECTED: 'bg-amber-50 text-amber-700 border-amber-200',
      ACCEPTED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      ARRIVED: 'bg-purple-50 text-purple-700 border-purple-200',
      IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
      COMPLETED: 'bg-green-50 text-green-700 border-green-200',
    };
    return variants[s] || 'bg-gray-50 text-gray-600 border-gray-200';
  };

  const statusIcon = (s: string) => {
    const icons: Record<string, string> = {
      SELECTED: 'bg-gradient-to-br from-amber-50 to-amber-100',
      ACCEPTED: 'bg-gradient-to-br from-indigo-50 to-indigo-100',
      ARRIVED: 'bg-gradient-to-br from-purple-50 to-purple-100',
      IN_PROGRESS: 'bg-gradient-to-br from-blue-50 to-blue-100',
      COMPLETED: 'bg-gradient-to-br from-green-50 to-green-100',
    };
    return icons[s] || 'bg-gray-50';
  };

  const dayNames = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  return (
    <div className="min-h-screen bg-[var(--bg-page)] flex" dir="rtl">
      <Sidebar items={NAV_ITEMS} role="craftsman" />

      <main className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* الهيدر */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">مرحباً بعودتك 👋</h1>
              <p className="text-sm text-gray-500 mt-1.5">نظرة عامة على أدائك وأرباحك</p>
            </div>
            <div className="flex items-center bg-white rounded-xl border border-gray-100 p-1 shadow-sm">
              <div className="flex items-center gap-2 bg-[var(--brand)] text-white px-4 py-2 rounded-lg text-sm font-bold">
                <span className="w-2 h-2 bg-[var(--success)] rounded-full shadow-sm" />
                متصل
              </div>
              <div className="flex items-center gap-2 text-gray-400 px-4 py-2 rounded-lg text-sm font-medium">
                غير متصل
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse h-32" />
              ))}
            </div>
          ) : (
            <>
              {/* بطاقات الإحصائيات */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="8" width="20" height="12" rx="2" ry="2" />
                        <path d="M6 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
                      </svg>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15" /></svg>
                      +${data?.stats?.todayEarnings?.toFixed(0) || '0'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">أرباح اليوم</p>
                    <p className="text-2xl font-bold text-gray-900 font-display">${data?.stats?.todayEarnings?.toFixed(0) || '0'}</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                      </svg>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-bold text-sky-700 bg-sky-50 px-2 py-1 rounded-full border border-sky-100">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15" /></svg>
                      +{data?.stats?.completedJobs || 0}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">المهام المنجزة</p>
                    <p className="text-2xl font-bold text-gray-900">{data?.stats?.completedJobs || 0}</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full border border-gray-200">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                      ثابت
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">التقييم</p>
                    <p className="text-2xl font-bold text-gray-900 font-display">{data?.stats?.rating?.toFixed(1) || '0.0'}</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-bold text-violet-700 bg-violet-50 px-2 py-1 rounded-full border border-violet-100">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15" /></svg>
                      نشط
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">المهام النشطة</p>
                    <p className="text-2xl font-bold text-gray-900">{data?.stats?.activeJobs || 0}</p>
                  </div>
                </div>
              </div>

              {/* الطلبات المتاحة */}
              {data?.availableRequests && data.availableRequests.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping absolute" />
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 relative" />
                      </div>
                      <h2 className="font-bold text-gray-900">طلبات جديدة</h2>
                    </div>
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-red-400 text-white text-xs font-bold shadow-sm">
                      {data.availableRequests.length}
                    </span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {data.availableRequests.slice(0, 3).map((req, idx) => (
                      <div key={req._id} className={`group flex flex-col sm:flex-row sm:items-center justify-between py-4 ${idx === 0 ? 'pt-0' : ''}`}>
                        <div className="flex items-center gap-3 flex-1 min-w-0 mb-3 sm:mb-0">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center text-lg shadow-sm group-hover:scale-105 transition-transform shrink-0">
                            🛠️
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 text-sm truncate">{req.service?.nameAr || 'خدمة'}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                              <span className="truncate">{req.client?.name}</span>
                              <span className="text-gray-300 shrink-0">•</span>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                              <span className="truncate">{req.location?.address || 'بدون عنوان'}</span>
                            </p>
                            {req.clientNotes && <p className="text-xs text-gray-400 mt-1.5 italic truncate">"{req.clientNotes.substring(0, 40)}{req.clientNotes.length > 40 ? '...' : ''}"</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:shrink-0">
                          <span className="font-display text-base text-gray-900 font-bold ml-1">${req.pricing?.totalAmount || 0}</span>
                          <button onClick={() => handleAccept(req._id)}
                            className="bg-[var(--brand)] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[var(--brand-dark)] hover:shadow-sm transition-all duration-200 shadow-sm min-w-[60px]">
                            قبول
                          </button>
                          <button onClick={() => handleReject(req._id)}
                            className="border border-red-200 text-red-600 text-xs font-bold px-4 py-2 rounded-lg hover:bg-red-50 hover:border-red-300 transition-all duration-200 min-w-[60px]">
                            رفض
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {data.availableRequests.length > 3 && (
                    <button onClick={() => router.push('/dashboard/craftsman/available')}
                      className="w-full text-center text-sm text-[var(--brand)] font-bold mt-4 py-2.5 rounded-lg hover:bg-[var(--brand-light)] transition-colors">
                      عرض الكل ({data.availableRequests.length})
                    </button>
                  )}
                </div>
              )}

              {/* المهام النشطة + الأرباح الأسبوعية */}
              <div className="grid lg:grid-cols-3 gap-6 mb-6">
                {/* المهام النشطة */}
                {data?.activeJobs && data.activeJobs.length > 0 && (
                  <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="font-bold text-gray-900">المهام النشطة</h2>
                      <span className="text-xs font-bold text-[var(--brand)] bg-[var(--brand-light)] px-3 py-1 rounded-full border border-[var(--brand)]/10">{data.activeJobs.length}</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {data.activeJobs.map((job, idx) => (
                        <div key={job._id} className={`group flex flex-col sm:flex-row sm:items-center justify-between py-4 ${idx === 0 ? 'pt-0' : ''} hover:bg-gray-50/50 -mx-2 px-2 rounded-lg transition-colors`}>
                          <div className="flex items-center gap-3 flex-1 min-w-0 mb-3 sm:mb-0">
                            <div className={`w-11 h-11 rounded-xl ${statusIcon(job.status)} flex items-center justify-center text-lg shadow-sm group-hover:scale-105 transition-transform shrink-0`}>
                              🛠️
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 text-sm truncate">{job.service?.nameAr || 'خدمة'}</p>
                              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                <span className="truncate">{job.client?.name}</span>
                                <span className="text-gray-300 shrink-0">•</span>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                <span className="truncate">{job.location?.address || 'بدون عنوان'}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:shrink-0">
                            <span className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border ${statusBadge(job.status)}`}>
                              {statusLabel(job.status)}
                            </span>
                            {job.status === 'SELECTED' && (
                              <button onClick={() => handleCraftsmanAccept(job._id)}
                                className="bg-[var(--brand)] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[var(--brand-dark)] hover:shadow-sm transition-all duration-200 shadow-sm">
                                ✅ قبول
                              </button>
                            )}
                            {job.status === 'ACCEPTED' && (
                              <button onClick={() => handleStatusUpdate(job._id, 'ARRIVED')}
                                className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-2 rounded-lg hover:bg-indigo-100 hover:shadow-sm transition-all duration-200 border border-indigo-200">
                                🚗 وصلت
                              </button>
                            )}
                            {job.status === 'ARRIVED' && (
                              <button onClick={() => handleStatusUpdate(job._id, 'IN_PROGRESS')}
                                className="bg-purple-50 text-purple-700 text-xs font-bold px-3 py-2 rounded-lg hover:bg-purple-100 hover:shadow-sm transition-all duration-200 border border-purple-200">
                                🔧 ابدأ
                              </button>
                            )}
                            {job.status === 'IN_PROGRESS' && (
                              <button onClick={() => handleStatusUpdate(job._id, 'COMPLETED')}
                                className="bg-green-50 text-green-700 text-xs font-bold px-3 py-2 rounded-lg hover:bg-green-100 hover:shadow-sm transition-all duration-200 border border-green-200">
                                ✅ تم
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* الأرباح الأسبوعية - Bar Chart */}
                <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col ${data?.activeJobs?.length ? '' : 'lg:col-span-3'}`}>
                  <h2 className="font-bold text-gray-900 mb-4">الأرباح الأسبوعية</h2>
                  <div className="flex-1 flex items-end gap-2 sm:gap-3 pt-4 pb-2 h-48">
                    {[40, 60, 30, 80, 100, 50, 20].map((height, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                        <div
                          className={`w-full rounded-lg transition-all duration-300 ${
                            idx === 4 ? 'bg-[var(--brand)] shadow-sm' : 'bg-[var(--brand)]/15 group-hover:bg-[var(--brand)]/30'
                          }`}
                          style={{ height: `${height}%` }}
                        />
                        <span className={`text-[10px] ${idx === 4 ? 'text-gray-900 font-bold' : 'text-gray-400'}`}>
                          {dayNames[idx]}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 text-center mt-4">إجمالي الأرباح هذا الأسبوع: <span className="font-bold text-gray-900">${data?.stats?.totalEarnings || 0}</span></p>
                </div>
              </div>

              {/* المهام الأخيرة */}
              {data?.recentJobs && data.recentJobs.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-gray-900">آخر المهام</h2>
                    <span className="text-xs text-gray-400">{data.recentJobs.length} مهمة</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {data.recentJobs.slice(0, 5).map((job) => (
                      <div key={job._id} className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm shadow-sm shrink-0 ${job.status === 'COMPLETED' ? 'bg-green-50' : 'bg-gray-100'}`}>
                            {job.service?.nameAr === 'سباكة' ? '🪠' :
                             job.service?.nameAr === 'كهرباء' ? '⚡' :
                             job.service?.nameAr === 'تكييف' ? '❄️' :
                             job.service?.nameAr === 'نظافة' ? '🧹' : '🔧'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">{job.service?.nameAr || 'خدمة'}</p>
                            <p className="text-xs text-gray-400 truncate">{job.client?.name} • {new Date(job.createdAt).toLocaleDateString('ar-EG')}</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-gray-900 font-display shrink-0">${job.pricing?.totalAmount || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* New Request Modal */}
      {pendingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden ring-4 ring-[var(--brand)]/20 flex flex-col">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">طلب جديد!</h3>
                <p className="text-sm text-gray-500">استجب بسرعة لتأمين هذا العمل</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-gray-100">
              <div
                className="h-full bg-[var(--brand)] rounded-l-full transition-all duration-1000 ease-linear"
                style={{ width: `${(modalTimer / MODAL_TIMEOUT) * 100}%` }}
              />
            </div>

            {/* Content */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5 bg-gray-50/50">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--brand-light)] flex items-center justify-center text-[var(--brand)]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">نوع الخدمة</p>
                    <p className="font-bold text-gray-900 text-sm">{pendingModal.service?.nameAr || 'خدمة'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">العميل</p>
                    <p className="font-bold text-gray-900 text-sm">{pendingModal.client?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">الموقع</p>
                    <p className="font-bold text-gray-900 text-sm truncate max-w-[150px]">{pendingModal.location?.address || 'بدون عنوان'}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 justify-between">
                {pendingModal.clientNotes && (
                  <div className="bg-[var(--brand-light)] rounded-2xl rounded-tr-sm p-4 border border-[var(--brand)]/20">
                    <p className="text-xs font-bold text-[var(--brand)] mb-1.5">ملاحظة العميل</p>
                    <p className="text-sm text-gray-700 leading-relaxed">"{pendingModal.clientNotes}"</p>
                  </div>
                )}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-xs text-gray-500">الأجر المتوقع</p>
                    <p className="text-xl font-bold text-[var(--brand)] font-display">${pendingModal.pricing?.totalAmount || 0}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[var(--brand-light)] flex items-center justify-center text-[var(--brand)]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Timer & Actions */}
            <div className="px-6 py-4 flex items-center justify-between bg-white border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span className="font-display text-base font-bold">{modalTimer}</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleReject(pendingModal._id)}
                  className="px-6 py-2.5 rounded-full border-2 border-gray-200 text-gray-600 text-sm font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all">
                  رفض
                </button>
                <button onClick={() => handleAccept(pendingModal._id)}
                  className="px-8 py-2.5 rounded-full bg-[var(--brand)] text-white text-sm font-bold hover:bg-[var(--brand-dark)] transition-all shadow-sm flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  قبول العمل
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
