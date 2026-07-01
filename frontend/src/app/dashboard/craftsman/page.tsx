'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Sidebar from '@/components/dashboard/Sidebar';

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

    axios.get('http://localhost:5000/api/v1/users/dashboard/craftsman', {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      if (res.data.status === 'success') setData(res.data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleAccept = async (id: string) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('user_token');
      await axios.post(`http://localhost:5000/api/v1/requests/${id}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData((prev) => prev ? {
        ...prev,
        availableRequests: prev.availableRequests.filter((r) => r._id !== id),
        stats: { ...prev.stats, activeJobs: prev.stats.activeJobs + 1 },
      } : prev);
    } catch (err) {}
  };

  const handleReject = async (id: string) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('user_token');
      await axios.post(`http://localhost:5000/api/v1/requests/${id}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData((prev) => prev ? {
        ...prev,
        availableRequests: prev.availableRequests.filter((r) => r._id !== id),
      } : prev);
    } catch (err) {}
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('user_token');
      await axios.patch(`http://localhost:5000/api/v1/requests/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (status === 'COMPLETED') {
        await axios.patch(`http://localhost:5000/api/v1/requests/${id}/complete`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      window.location.reload();
    } catch (err) {}
  };

  const NAV_ITEMS = [
    { label: 'لوحة التحكم', href: '/dashboard/craftsman', icon: '📊' },
    { label: 'الطلبات المتاحة', href: '/dashboard/craftsman/available', icon: '📋' },
    { label: 'المهام النشطة', href: '/dashboard/craftsman/active', icon: '🔧' },
    { label: 'السجل', href: '/dashboard/craftsman/history', icon: '📜' },
    { label: 'الإعدادات', href: '/dashboard/craftsman/settings', icon: '⚙️' },
  ];

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      PENDING_MATCHING: 'متاح',
      ACCEPTED: 'مقبول',
      ARRIVED: 'في الطريق',
      IN_PROGRESS: 'قيد التنفيذ',
      COMPLETED: 'مكتمل',
    };
    return map[s] || s;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      <Sidebar items={NAV_ITEMS} role="craftsman" />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">مرحباً بعودتك {data?.user?.name || ''} 👋</h1>
            <p className="text-sm text-gray-500 font-light">نظرة عامة على أدائك وأرباحك.</p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse h-20" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                  <p className="text-3xl font-black text-[#0f5132]">{data?.stats?.activeJobs || 0}</p>
                  <p className="text-xs text-gray-500 font-light">المهام النشطة</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                  <p className="text-3xl font-black text-[#0f5132]">{data?.stats?.completedJobs || 0}</p>
                  <p className="text-xs text-gray-500 font-light">المهام المنجزة</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                  <p className="text-2xl font-black text-[#0f5132]">${data?.stats?.todayEarnings || 0}</p>
                  <p className="text-xs text-gray-500 font-light">أرباح اليوم</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                  <p className="text-3xl font-black text-[#0f5132]">{data?.stats?.rating?.toFixed(1) || '0.0'}</p>
                  <p className="text-xs text-gray-500 font-light">التقييم</p>
                </div>
              </div>

              {data?.availableRequests && data.availableRequests.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-black text-gray-900 tracking-tight">طلبات جديدة!</h2>
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">
                      {data.availableRequests.length} جديد
                    </span>
                  </div>
                  <div className="space-y-3">
                    {data.availableRequests.slice(0, 3).map((req) => (
                      <div key={req._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{req.service?.nameAr || 'خدمة'}</p>
                          <p className="text-xs text-gray-400">{req.client?.name} • {req.location?.address}</p>
                          {req.clientNotes && <p className="text-xs text-gray-500 mt-1">"{req.clientNotes.substring(0, 50)}..."</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#0f5132]">${req.pricing?.totalAmount || 0}</span>
                          <button onClick={() => handleAccept(req._id)}
                            className="bg-[#0f5132] text-white text-xs font-bold px-4 py-1.5 rounded-full hover:bg-[#0c3f27] transition-colors">
                            قبول
                          </button>
                          <button onClick={() => handleReject(req._id)}
                            className="border border-gray-300 text-gray-600 text-xs font-bold px-4 py-1.5 rounded-full hover:bg-gray-50 transition-colors">
                            رفض
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {data.availableRequests.length > 3 && (
                    <button className="w-full text-center text-sm text-[#0f5132] font-bold mt-3 hover:underline">
                      عرض الكل ({data.availableRequests.length})
                    </button>
                  )}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                {data?.activeJobs && data.activeJobs.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="font-black text-gray-900 mb-4 tracking-tight">المهام النشطة</h2>
                    <div className="space-y-3">
                      {data.activeJobs.map((job) => (
                        <div key={job._id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-bold text-gray-900 text-sm">{job.service?.nameAr || 'خدمة'}</p>
                            <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                              {statusLabel(job.status)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mb-3">{job.client?.name} • {job.location?.address}</p>
                          <div className="flex gap-2">
                            {job.status === 'ACCEPTED' && (
                              <button onClick={() => handleStatusUpdate(job._id, 'ARRIVED')}
                                className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-full hover:bg-indigo-200 transition-colors">
                                🚗 وصلت للموقع
                              </button>
                            )}
                            {job.status === 'ARRIVED' && (
                              <button onClick={() => handleStatusUpdate(job._id, 'IN_PROGRESS')}
                                className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1.5 rounded-full hover:bg-purple-200 transition-colors">
                                🔧 بدء العمل
                              </button>
                            )}
                            {job.status === 'IN_PROGRESS' && (
                              <button onClick={() => handleStatusUpdate(job._id, 'COMPLETED')}
                                className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full hover:bg-green-200 transition-colors">
                                ✅ اكتمل العمل
                              </button>
                            )}
                            <span className="text-xs text-gray-400 mr-auto">${job.pricing?.totalAmount || 0}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="font-black text-gray-900 mb-4 tracking-tight">الأرباح الأسبوعية</h2>
                  <div className="h-48 flex items-center justify-center text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
                    📊 ${data?.stats?.totalEarnings || 0} إجمالي الأرباح
                  </div>
                </div>
              </div>

              {data?.recentJobs && data.recentJobs.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-6">
                  <h2 className="font-black text-gray-900 mb-4 tracking-tight">المهام الأخيرة</h2>
                  <div className="space-y-2">
                    {data.recentJobs.slice(0, 5).map((job) => (
                      <div key={job._id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#eef6ef] text-[#0f5132] flex items-center justify-center text-sm">
                            {job.client?.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{job.service?.nameAr || 'خدمة'}</p>
                            <p className="text-xs text-gray-400">{job.client?.name} • {new Date(job.createdAt).toLocaleDateString('ar-EG')}</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-gray-900">${job.pricing?.totalAmount || 0}</span>
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
