'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Sidebar from '@/components/dashboard/Sidebar';
import { API_BASE, getAuthHeaders } from '@/lib/api';

interface RequestType {
  _id: string;
  service: { nameAr: string };
  craftsman: { name: string } | null;
  status: string;
  pricing: { totalAmount: number };
  createdAt: string;
}

const statusLabel = (s: string) => {
  const map: Record<string, string> = {
    PENDING_MATCHING: 'قيد البحث',
    ACCEPTED: 'مقبول',
    ARRIVED: 'في الطريق',
    IN_PROGRESS: 'قيد التنفيذ',
    COMPLETED: 'مكتمل',
    CANCELLED: 'ملغي',
  };
  return map[s] || s;
};

const statusColor = (s: string) => {
  const map: Record<string, string> = {
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-gray-100 text-gray-500',
    IN_PROGRESS: 'bg-purple-100 text-purple-700',
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

export default function CustomerHistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<RequestType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('user_token');
    if (!token) { router.push('/login'); return; }

    axios.get(`${API_BASE}/users/dashboard/customer`, {
      headers: getAuthHeaders(),
    }).then((res) => {
      if (res.data.status === 'success') {
        setHistory(res.data.data.requestHistory || []);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      <Sidebar items={NAV_ITEMS} role="customer" />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">السجل</h1>
            <p className="text-sm text-gray-500 font-light mt-1">جميع خدماتك السابقة</p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse h-20" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <p className="text-5xl mb-4">📜</p>
              <h2 className="text-xl font-black text-gray-900 mb-2">لا توجد خدمات سابقة</h2>
              <p className="text-sm text-gray-500 font-light">سيظهر هنا تاريخ طلباتك</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-50">
                {history.map((req) => (
                  <div key={req._id} className="flex items-center justify-between p-4 px-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-sm">🛠️</div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{req.service?.nameAr || 'خدمة'}</p>
                        <p className="text-xs text-gray-400">
                          {req.craftsman ? `بواسطة ${req.craftsman.name}` : 'لم يتم التعيين'} • {new Date(req.createdAt).toLocaleDateString('ar-EG')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-xs font-bold px-2.5 py-1.5 rounded-full ${statusColor(req.status)}`}>
                        {statusLabel(req.status)}
                      </span>
                      <span className="font-display text-sm text-gray-900">${req.pricing?.totalAmount || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
