'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Sidebar from '@/components/dashboard/Sidebar';
import { API_BASE, getAuthHeaders } from '@/lib/api';

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

const NAV_ITEMS = [
  { label: 'لوحة التحكم', href: '/dashboard/craftsman', icon: '📊' },
  { label: 'الطلبات المتاحة', href: '/dashboard/craftsman/available', icon: '📋' },
  { label: 'المهام النشطة', href: '/dashboard/craftsman/active', icon: '🔧' },
  { label: 'السجل', href: '/dashboard/craftsman/history', icon: '📜' },
  { label: 'الإعدادات', href: '/dashboard/settings', icon: '⚙️' },
];

export default function CraftsmanAvailablePage() {
  const router = useRouter();
  const [requests, setRequests] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('user_token');
    if (!token) { router.push('/login'); return; }

    axios.get(`${API_BASE}/users/dashboard/craftsman`, {
      headers: getAuthHeaders(),
    }).then((res) => {
      if (res.data.status === 'success') {
        setRequests(res.data.data.availableRequests || []);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [router]);

  const handleAccept = async (id: string) => {
    try {
      await axios.post(`${API_BASE}/requests/${id}/accept`, {}, { headers: getAuthHeaders() });
      setRequests((prev) => prev.filter((r) => r._id !== id));
    } catch {}
  };

  const handleReject = async (id: string) => {
    try {
      await axios.post(`${API_BASE}/requests/${id}/reject`, {}, { headers: getAuthHeaders() });
      setRequests((prev) => prev.filter((r) => r._id !== id));
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      <Sidebar items={NAV_ITEMS} role="craftsman" />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">الطلبات المتاحة</h1>
            <p className="text-sm text-gray-500 font-light mt-1">طلبات خدمة جديدة قريبة منك</p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse h-24" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <p className="text-5xl mb-4">🔍</p>
              <h2 className="text-xl font-black text-gray-900 mb-2">لا توجد طلبات متاحة الآن</h2>
              <p className="text-sm text-gray-500 font-light">ستظهر الطلبات الجديدة هنا فور توفرها</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div key={req._id} className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-amber-200 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center text-xl shadow-sm">🛠️</div>
                      <div>
                        <p className="font-bold text-gray-900">{req.service?.nameAr || 'خدمة'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{req.client?.name} • {req.location?.address}</p>
                        {req.clientNotes && <p className="text-xs text-gray-500 mt-1">"{req.clientNotes.substring(0, 60)}{req.clientNotes.length > 60 ? '...' : ''}"</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-display text-lg text-gray-900">${req.pricing?.totalAmount || 0}</span>
                      <button onClick={() => handleAccept(req._id)}
                        className="bg-gradient-to-l from-[#0f5132] to-[#0a3822] text-white text-sm font-bold px-5 py-2 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200 shadow-sm">
                        قبول
                      </button>
                      <button onClick={() => handleReject(req._id)}
                        className="border border-gray-200 text-gray-500 text-sm font-bold px-5 py-2 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-200">
                        رفض
                      </button>
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
