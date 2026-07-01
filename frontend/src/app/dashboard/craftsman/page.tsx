'use client';
import { useEffect, useState } from 'react';
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

export default function CraftsmanDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('user_token');
    if (!token) { router.push('/login'); return; }

    axios.get(`${API_BASE}/users/dashboard/craftsman`, {
      headers: getAuthHeaders(),
    }).then((res) => {
      if (res.data.status === 'success') setData(res.data.data);
    }).catch(() => {}).finally(() => setLoading(false));
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

  const dayNames = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      <Sidebar items={NAV_ITEMS} role="craftsman" />

      <main className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* الهيدر */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">مرحباً بعودتك 👋</h1>
              <p className="text-sm text-gray-500 mt-1">نظرة عامة على أدائك وأرباحك</p>
            </div>
            <div className="flex items-center bg-white rounded-2xl border border-gray-100 p-1 shadow-sm">
              <div className="flex items-center gap-2 bg-[#0f5132] text-white px-4 py-2 rounded-xl text-sm font-bold">
                <span className="w-2.5 h-2.5 bg-[#22c55e] rounded-full shadow-sm" />
                متصل
              </div>
              <div className="flex items-center gap-2 text-gray-400 px-4 py-2 rounded-xl text-sm font-medium">
                غير متصل
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse h-28" />
              ))}
            </div>
          ) : (
            <>
              {/* بطاقات الإحصائيات */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#eef6ef] flex items-center justify-center text-[#0f5132]">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="8" width="20" height="12" rx="2" ry="2" />
                        <path d="M6 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
                      </svg>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-bold text-[#0f5132] bg-[#eef6ef] px-2 py-1 rounded-full">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15" /></svg>
                      +${data?.stats?.todayEarnings?.toFixed(0) || '0'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">أرباح اليوم</p>
                    <p className="text-2xl font-black text-gray-900">${data?.stats?.todayEarnings?.toFixed(0) || '0'}</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#eef6ef] flex items-center justify-center text-[#0f5132]">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                      </svg>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-bold text-[#0f5132] bg-[#eef6ef] px-2 py-1 rounded-full">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15" /></svg>
                      +{data?.stats?.completedJobs || 0}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">المهام المنجزة</p>
                    <p className="text-2xl font-black text-gray-900">{data?.stats?.completedJobs || 0}</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#eef6ef] flex items-center justify-center text-[#0f5132]">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                      ثابت
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">التقييم</p>
                    <p className="text-2xl font-black text-gray-900">{data?.stats?.rating?.toFixed(1) || '0.0'}</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#eef6ef] flex items-center justify-center text-[#0f5132]">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-bold text-[#0f5132] bg-[#eef6ef] px-2 py-1 rounded-full">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15" /></svg>
                      نشط
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">المهام النشطة</p>
                    <p className="text-2xl font-black text-gray-900">{data?.stats?.activeJobs || 0}</p>
                  </div>
                </div>
              </div>

              {/* الطلبات المتاحة */}
              {data?.availableRequests && data.availableRequests.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping absolute" />
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 relative" />
                      </div>
                      <h2 className="font-black text-gray-900 tracking-tight">طلبات جديدة!</h2>
                    </div>
                    <span className="bg-gradient-to-l from-red-500 to-red-400 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                      {data.availableRequests.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {data.availableRequests.slice(0, 3).map((req) => (
                      <div key={req._id} className="group flex items-center justify-between p-4 bg-gradient-to-l from-gray-50 to-white rounded-xl border border-gray-100 hover:border-red-200 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center text-lg shadow-sm group-hover:scale-105 transition-transform">
                            🛠️
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{req.service?.nameAr || 'خدمة'}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                              {req.client?.name}
                              <span className="text-gray-300">•</span>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                              {req.location?.address || 'بدون عنوان'}
                            </p>
                            {req.clientNotes && <p className="text-xs text-gray-500 mt-1.5 italic">"{req.clientNotes.substring(0, 40)}{req.clientNotes.length > 40 ? '...' : ''}"</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-display text-base text-gray-900 ml-1">${req.pricing?.totalAmount || 0}</span>
                          <button onClick={() => handleAccept(req._id)}
                            className="bg-gradient-to-l from-[#0f5132] to-[#0a3822] text-white text-xs font-bold px-4 py-2 rounded-xl hover:shadow-lg hover:shadow-[#0f5132]/20 hover:scale-[1.02] transition-all duration-200 shadow-sm">
                            قبول
                          </button>
                          <button onClick={() => handleReject(req._id)}
                            className="border border-gray-200 text-gray-500 text-xs font-bold px-4 py-2 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-200">
                            رفض
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {data.availableRequests.length > 3 && (
                    <button className="w-full text-center text-sm text-[#0f5132] font-bold mt-4 py-2.5 rounded-xl hover:bg-[#eef6ef] transition-colors">
                      عرض الكل ({data.availableRequests.length})
                    </button>
                  )}
                </div>
              )}

              {/* المهام النشطة + الأرباح الأسبوعية */}
              <div className="grid lg:grid-cols-3 gap-6 mb-6">
                {/* المهام النشطة */}
                {data?.activeJobs && data.activeJobs.length > 0 && (
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="font-black text-gray-900 tracking-tight">المهام النشطة</h2>
                      <span className="text-xs font-bold text-[#0f5132] bg-[#eef6ef] px-3 py-1 rounded-full">{data.activeJobs.length}</span>
                    </div>
                    <div className="space-y-3">
                      {data.activeJobs.map((job) => (
                        <div key={job._id} className="group p-4 bg-gradient-to-l from-gray-50 to-white rounded-xl border border-gray-100 hover:border-[#0f5132]/20 hover:shadow-md transition-all duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shadow-sm group-hover:scale-105 transition-transform ${
                                job.status === 'SELECTED' ? 'bg-gradient-to-br from-amber-50 to-amber-100' :
                                job.status === 'ACCEPTED' ? 'bg-gradient-to-br from-indigo-50 to-indigo-100' :
                                job.status === 'ARRIVED' ? 'bg-gradient-to-br from-purple-50 to-purple-100' : 'bg-gradient-to-br from-green-50 to-green-100'
                              }`}>
                                🛠️
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 text-sm">{job.service?.nameAr || 'خدمة'}</p>
                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                  {job.client?.name}
                                  <span className="text-gray-300">•</span>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                  {job.location?.address || 'بدون عنوان'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold px-2.5 py-1.5 rounded-full shadow-sm ${
                                job.status === 'SELECTED' ? 'bg-amber-50 text-amber-700' :
                                job.status === 'ACCEPTED' ? 'bg-indigo-50 text-indigo-700' :
                                job.status === 'ARRIVED' ? 'bg-purple-50 text-purple-700' :
                                'bg-green-50 text-green-700'
                              }`}>
                                {statusLabel(job.status)}
                              </span>
                              {job.status === 'SELECTED' && (
                                <button onClick={() => handleCraftsmanAccept(job._id)}
                                  className="bg-gradient-to-l from-[#0f5132] to-[#0a3822] text-white text-xs font-bold px-4 py-2 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200 shadow-sm">
                                  ✅ قبول
                                </button>
                              )}
                              {job.status === 'ACCEPTED' && (
                                <button onClick={() => handleStatusUpdate(job._id, 'ARRIVED')}
                                  className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-2 rounded-xl hover:bg-indigo-100 hover:shadow-sm transition-all duration-200">
                                  🚗 وصلت
                                </button>
                              )}
                              {job.status === 'ARRIVED' && (
                                <button onClick={() => handleStatusUpdate(job._id, 'IN_PROGRESS')}
                                  className="bg-purple-50 text-purple-700 text-xs font-bold px-3 py-2 rounded-xl hover:bg-purple-100 hover:shadow-sm transition-all duration-200">
                                  🔧 ابدأ
                                </button>
                              )}
                              {job.status === 'IN_PROGRESS' && (
                                <button onClick={() => handleStatusUpdate(job._id, 'COMPLETED')}
                                  className="bg-green-50 text-green-700 text-xs font-bold px-3 py-2 rounded-xl hover:bg-green-100 hover:shadow-sm transition-all duration-200">
                                  ✅ تم
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* الأرباح الأسبوعية - Bar Chart */}
                <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col ${data?.activeJobs?.length ? '' : 'lg:col-span-3'}`}>
                  <h2 className="font-bold text-gray-900 mb-4">الأرباح الأسبوعية</h2>
                  <div className="flex-1 flex items-end gap-2 sm:gap-3 pt-4 pb-2 h-48">
                    {[40, 60, 30, 80, 100, 50, 20].map((height, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                        <div
                          className={`w-full rounded-xl transition-all duration-300 ${
                            idx === 4 ? 'bg-[#0f5132] shadow-sm' : 'bg-[#0f5132]/20 group-hover:bg-[#0f5132]/40'
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
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-gray-900">آخر المهام</h2>
                    <span className="text-xs text-gray-400">{data.recentJobs.length} مهمة</span>
                  </div>
                  <div className="space-y-1">
                    {data.recentJobs.slice(0, 5).map((job) => (
                      <div key={job._id} className="flex items-center justify-between py-3 px-2 rounded-xl hover:bg-gray-50 transition-all">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm shadow-sm ${job.status === 'COMPLETED' ? 'bg-green-50' : 'bg-gray-100'}`}>
                            {job.service?.nameAr === 'سباكة' ? '🪠' :
                             job.service?.nameAr === 'كهرباء' ? '⚡' :
                             job.service?.nameAr === 'تكييف' ? '❄️' :
                             job.service?.nameAr === 'نظافة' ? '🧹' : '🔧'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{job.service?.nameAr || 'خدمة'}</p>
                            <p className="text-xs text-gray-400">{job.client?.name} • {new Date(job.createdAt).toLocaleDateString('ar-EG')}</p>
                          </div>
                        </div>
                        <span className="text-sm font-black text-gray-900">${job.pricing?.totalAmount || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
