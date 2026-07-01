'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Sidebar from '@/components/dashboard/Sidebar';
import { API_BASE, getAuthHeaders } from '@/lib/api';

interface Job {
  _id: string;
  client: { name: string };
  service: { nameAr: string };
  status: string;
  pricing: { totalAmount: number };
  location: { address: string };
  createdAt: string;
}

const statusLabel = (s: string) => {
  const map: Record<string, string> = {
    ACCEPTED: 'مقبول',
    ARRIVED: 'في الطريق',
    IN_PROGRESS: 'قيد التنفيذ',
    COMPLETED: 'مكتمل',
  };
  return map[s] || s;
};

const NAV_ITEMS = [
  { label: 'لوحة التحكم', href: '/dashboard/craftsman', icon: '📊' },
  { label: 'الطلبات المتاحة', href: '/dashboard/craftsman/available', icon: '📋' },
  { label: 'المهام النشطة', href: '/dashboard/craftsman/active', icon: '🔧' },
  { label: 'السجل', href: '/dashboard/craftsman/history', icon: '📜' },
  { label: 'الإعدادات', href: '/dashboard/settings', icon: '⚙️' },
];

export default function CraftsmanActivePage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('user_token');
    if (!token) { router.push('/login'); return; }

    axios.get(`${API_BASE}/users/dashboard/craftsman`, {
      headers: getAuthHeaders(),
    }).then((res) => {
      if (res.data.status === 'success') {
        setJobs(res.data.data.activeJobs || []);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [router]);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await axios.patch(`${API_BASE}/requests/${id}/status`, { status }, { headers: getAuthHeaders() });
      if (status === 'COMPLETED') {
        await axios.patch(`${API_BASE}/requests/${id}/complete`, {}, { headers: getAuthHeaders() });
      }
      window.location.reload();
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      <Sidebar items={NAV_ITEMS} role="craftsman" />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">المهام النشطة</h1>
            <p className="text-sm text-gray-500 font-light mt-1">مهامك الحالية قيد التنفيذ</p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse h-24" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <p className="text-5xl mb-4">🔧</p>
              <h2 className="text-xl font-black text-gray-900 mb-2">لا توجد مهام نشطة</h2>
              <p className="text-sm text-gray-500 font-light">اقبل طلباً جديداً لبدء العمل</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div key={job._id} className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm ${
                        job.status === 'ACCEPTED' ? 'bg-gradient-to-br from-indigo-50 to-indigo-100' :
                        job.status === 'ARRIVED' ? 'bg-gradient-to-br from-purple-50 to-purple-100' : 'bg-gradient-to-br from-green-50 to-green-100'
                      }`}>🛠️</div>
                      <div>
                        <p className="font-bold text-gray-900">{job.service?.nameAr || 'خدمة'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{job.client?.name} • {job.location?.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full shadow-sm ${
                        job.status === 'ACCEPTED' ? 'bg-indigo-50 text-indigo-700' :
                        job.status === 'ARRIVED' ? 'bg-purple-50 text-purple-700' :
                        'bg-green-50 text-green-700'
                      }`}>{statusLabel(job.status)}</span>
                      <span className="font-display text-base text-gray-900">${job.pricing?.totalAmount || 0}</span>
                      {job.status === 'ACCEPTED' && (
                        <button onClick={() => handleStatusUpdate(job._id, 'ARRIVED')}
                          className="bg-indigo-50 text-indigo-700 text-xs font-bold px-4 py-2 rounded-xl hover:bg-indigo-100 transition-all">🚗 وصلت</button>
                      )}
                      {job.status === 'ARRIVED' && (
                        <button onClick={() => handleStatusUpdate(job._id, 'IN_PROGRESS')}
                          className="bg-purple-50 text-purple-700 text-xs font-bold px-4 py-2 rounded-xl hover:bg-purple-100 transition-all">🔧 ابدأ</button>
                      )}
                      {job.status === 'IN_PROGRESS' && (
                        <button onClick={() => handleStatusUpdate(job._id, 'COMPLETED')}
                          className="bg-green-50 text-green-700 text-xs font-bold px-4 py-2 rounded-xl hover:bg-green-100 transition-all">✅ تم</button>
                      )}
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
