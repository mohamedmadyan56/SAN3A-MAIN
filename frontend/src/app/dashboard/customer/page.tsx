'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Sidebar from '@/components/dashboard/Sidebar';
import { API_BASE, getAuthHeaders } from '@/lib/api';

interface RequestType {
  _id: string;
  service: { nameAr: string; icon?: string };
  craftsman: { name: string; rating: number; avatar?: string } | null;
  status: string;
  pricing: { totalAmount: number };
  createdAt: string;
  location: { address: string };
}

interface DashboardData {
  activeRequests: RequestType[];
  requestHistory: RequestType[];
  totalSpent: number;
  favorites: unknown[];
}

export default function CustomerDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('user_token');
    if (!token) { router.push('/login'); return; }

    axios.get(`${API_BASE}/users/dashboard/customer`, {
      headers: getAuthHeaders(),
    }).then((res) => {
      if (res.data.status === 'success') setData(res.data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      PENDING_MATCHING: 'قيد البحث عن حرفي',
      SELECTED: 'بانتظار تأكيد الحجز',
      ACCEPTED: 'تم قبول الطلب',
      ARRIVED: 'الحرفي في الطريق',
      IN_PROGRESS: 'جاري العمل',
      COMPLETED: 'مكتمل',
      CANCELLED: 'ملغي',
    };
    return map[s] || s;
  };

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      PENDING_MATCHING: 'bg-amber-100 text-amber-700',
      ACCEPTED: 'bg-blue-100 text-blue-700',
      ARRIVED: 'bg-indigo-100 text-indigo-700',
      IN_PROGRESS: 'bg-purple-100 text-purple-700',
      COMPLETED: 'bg-green-100 text-green-700',
    };
    return map[s] || 'bg-gray-100 text-gray-500';
  };

  const NAV_ITEMS = [
    { label: 'لوحة التحكم', href: '/dashboard/customer', icon: '📊' },
    { label: 'الطلبات النشطة', href: '/dashboard/customer/requests', icon: '📋' },
    { label: 'السجل', href: '/dashboard/customer/history', icon: '📜' },
    { label: 'المفضلة', href: '/dashboard/customer/favorites', icon: '❤️' },
    { label: 'الإعدادات', href: '/dashboard/settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      <Sidebar items={NAV_ITEMS} role="customer" />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">مرحباً بعودتك 👋</h1>
              <p className="text-sm text-gray-500 font-light">إليك نظرة سريعة على خدمات منزلك.</p>
            </div>
            <button onClick={() => router.push('/requests/new')}
              className="bg-[#0f5132] text-white text-sm font-bold px-6 py-3 rounded-full hover:bg-[#0c3f27] transition-colors flex items-center gap-2">
              <span>+</span> طلب خدمة
            </button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse h-24" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                  <p className="text-3xl font-black text-[#0f5132]">{data?.activeRequests?.length || 0}</p>
                  <p className="text-sm text-gray-500 font-light">الطلبات النشطة</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                  <p className="text-3xl font-black text-[#0f5132]">{data?.requestHistory?.length || 0}</p>
                  <p className="text-sm text-gray-500 font-light">آخر الخدمات</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                  <p className="text-3xl font-black text-[#0f5132]">${data?.totalSpent || 0}</p>
                  <p className="text-sm text-gray-500 font-light">إجمالي الإنفاق</p>
                </div>
              </div>

              {data?.activeRequests && data.activeRequests.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-black text-gray-900 tracking-tight">الطلبات النشطة</h2>
                    <span className="text-xs font-bold text-[#0f5132] bg-[#eef6ef] px-3 py-1 rounded-full">{data.activeRequests.length}</span>
                  </div>
                  <div className="space-y-3">
                    {data.activeRequests.map((req) => (
                      <div key={req._id} className="group relative flex items-center justify-between p-4 pr-5 bg-gradient-to-l from-gray-50 to-white rounded-xl border border-gray-100 hover:border-[#0f5132]/20 hover:shadow-md transition-all duration-200">
                        <div className="absolute right-0 top-4 bottom-4 w-1 rounded-full bg-gradient-to-b from-[#0f5132] to-[#22c55e] opacity-60 group-hover:opacity-100 transition-opacity" />
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#eef6ef] to-[#dbeee0] text-[#0f5132] flex items-center justify-center text-lg shadow-sm group-hover:scale-105 transition-transform">
                            🛠️
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm group-hover:text-[#0f5132] transition-colors">{req.service?.nameAr || 'خدمة'}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                              {req.location?.address || 'بدون عنوان'}
                            </p>
                          </div>
                        </div>
                        <div className="text-left">
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-full shadow-sm ${statusColor(req.status)}`}>
                            {statusLabel(req.status)}
                          </span>
                          <p className="font-display text-sm text-gray-900 mt-1.5">${req.pricing?.totalAmount || 0}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data?.requestHistory && data.requestHistory.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-black text-gray-900 tracking-tight">آخر الخدمات</h2>
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{data.requestHistory.length}</span>
                  </div>
                  <div className="space-y-1">
                    {data.requestHistory.map((req) => (
                      <div key={req._id} className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-gray-50 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-sm">🛠️</div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{req.service?.nameAr || 'خدمة'}</p>
                            <p className="text-xs text-gray-400">
                              {req.craftsman ? `بواسطة ${req.craftsman.name}` : 'لم يتم التعيين'} • {new Date(req.createdAt).toLocaleDateString('ar-EG')}
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1.5 rounded-full shadow-sm ${statusColor(req.status)}`}>
                          {statusLabel(req.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!data?.activeRequests || data.activeRequests.length === 0) && (!data?.requestHistory || data.requestHistory.length === 0) && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                  <p className="text-5xl mb-4">🏠</p>
                  <h2 className="text-xl font-black text-gray-900 mb-2">ابدأ رحلتك مع صنعة اليوم</h2>
                  <p className="text-sm text-gray-500 font-light mb-6">تحتاج لمساعدة عاجلة؟ اضغط هنا لطلب نجدة فورية 24/7.</p>
                  <button onClick={() => router.push('/requests/new')}
                    className="bg-[#0f5132] text-white text-sm font-bold px-6 py-3 rounded-full hover:bg-[#0c3f27] transition-colors">
                    احجز خدمة الآن
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
