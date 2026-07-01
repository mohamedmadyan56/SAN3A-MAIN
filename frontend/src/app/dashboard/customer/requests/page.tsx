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
    CANCELLED: 'bg-gray-100 text-gray-500',
  };
  return map[s] || 'bg-gray-100 text-gray-500';
};

const statusIcon = (s: string) => {
  const map: Record<string, string> = {
    PENDING_MATCHING: '🔍',
    ACCEPTED: '✅',
    ARRIVED: '🚗',
    IN_PROGRESS: '🔧',
    COMPLETED: '🎉',
    CANCELLED: '❌',
  };
  return map[s] || '📋';
};

const NAV_ITEMS = [
  { label: 'لوحة التحكم', href: '/dashboard/customer', icon: '📊' },
  { label: 'الطلبات النشطة', href: '/dashboard/customer/requests', icon: '📋' },
  { label: 'السجل', href: '/dashboard/customer/history', icon: '📜' },
  { label: 'المفضلة', href: '/dashboard/customer/favorites', icon: '❤️' },
  { label: 'الإعدادات', href: '/dashboard/settings', icon: '⚙️' },
];

export default function CustomerRequestsPage() {
  const router = useRouter();
  const [activeRequests, setActiveRequests] = useState<RequestType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('user_token');
    if (!token) { router.push('/login'); return; }

    axios.get(`${API_BASE}/users/dashboard/customer`, {
      headers: getAuthHeaders(),
    }).then((res) => {
      if (res.data.status === 'success') {
        setActiveRequests(res.data.data.activeRequests || []);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      <Sidebar items={NAV_ITEMS} role="customer" />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">الطلبات النشطة</h1>
              <p className="text-sm text-gray-500 font-light mt-1">جميع طلباتك الحالية</p>
            </div>
            <button onClick={() => router.push('/requests/new')}
              className="bg-[#0f5132] text-white text-sm font-bold px-6 py-3 rounded-full hover:bg-[#0c3f27] transition-colors flex items-center gap-2 shadow-sm">
              <span>+</span> طلب خدمة
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse h-24" />
              ))}
            </div>
          ) : activeRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <p className="text-5xl mb-4">📋</p>
              <h2 className="text-xl font-black text-gray-900 mb-2">لا توجد طلبات نشطة</h2>
              <p className="text-sm text-gray-500 font-light mb-6">ابدأ بطلب خدمة جديدة الآن</p>
              <button onClick={() => router.push('/requests/new')}
                className="bg-[#0f5132] text-white text-sm font-bold px-6 py-3 rounded-full hover:bg-[#0c3f27] transition-colors">
                اطلب خدمة
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeRequests.map((req) => (
                <div key={req._id} className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5 pr-6 hover:shadow-md hover:border-[#0f5132]/20 transition-all duration-200">
                  <div className="absolute right-0 top-0 bottom-0 w-1.5 rounded-r-2xl bg-gradient-to-b from-[#0f5132] to-[#22c55e]" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#eef6ef] to-[#dbeee0] flex items-center justify-center text-xl shadow-sm group-hover:scale-105 transition-transform">
                        🛠️
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{req.service?.nameAr || 'خدمة'}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          {req.location?.address || 'بدون عنوان'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full shadow-sm ${statusColor(req.status)}`}>
                          {statusIcon(req.status)} {statusLabel(req.status)}
                        </span>
                        <p className="font-display text-base text-gray-900 mt-1.5">${req.pricing?.totalAmount || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
