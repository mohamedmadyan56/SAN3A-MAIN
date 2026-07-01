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
    { label: 'الإعدادات', href: '/dashboard/customer/settings', icon: '⚙️' },
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
                  <h2 className="font-black text-gray-900 mb-4 tracking-tight">الطلبات النشطة</h2>
                  <div className="space-y-3">
                    {data.activeRequests.map((req) => (
                      <div key={req._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#eef6ef] text-[#0f5132] flex items-center justify-center text-lg">
                            🛠️
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{req.service?.nameAr || 'خدمة'}</p>
                            <p className="text-xs text-gray-400">{req.location?.address || ''}</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusColor(req.status)}`}>
                            {statusLabel(req.status)}
                          </span>
                          <p className="text-xs text-gray-400 mt-1">${req.pricing?.totalAmount || 0}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data?.requestHistory && data.requestHistory.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="font-black text-gray-900 mb-4 tracking-tight">آخر الخدمات</h2>
                  <div className="space-y-3">
                    {data.requestHistory.map((req) => (
                      <div key={req._id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{req.service?.nameAr || 'خدمة'}</p>
                          <p className="text-xs text-gray-400">
                            {req.craftsman ? `الحرفي: ${req.craftsman.name}` : 'لم يتم التعيين'} • {new Date(req.createdAt).toLocaleDateString('ar-EG')}
                          </p>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColor(req.status)}`}>
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
