'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Sidebar from '@/components/dashboard/Sidebar';
import { API_BASE, getAuthHeaders } from '@/lib/api';

interface FavoriteCraftsman {
  _id: string;
  name: string;
  rating: number;
  avatar?: string;
  location?: { address?: string };
  isAvailable?: boolean;
}

const NAV_ITEMS = [
  { label: 'لوحة التحكم', href: '/dashboard/customer', icon: '📊' },
  { label: 'الطلبات النشطة', href: '/dashboard/customer/requests', icon: '📋' },
  { label: 'السجل', href: '/dashboard/customer/history', icon: '📜' },
  { label: 'المفضلة', href: '/dashboard/customer/favorites', icon: '❤️' },
  { label: 'الإعدادات', href: '/dashboard/settings', icon: '⚙️' },
];

export default function CustomerFavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteCraftsman[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('user_token');
    if (!token) { router.push('/login'); return; }

    axios.get(`${API_BASE}/users/dashboard/customer`, {
      headers: getAuthHeaders(),
    }).then((res) => {
      if (res.data.status === 'success') {
        setFavorites(res.data.data.favorites || []);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      <Sidebar items={NAV_ITEMS} role="customer" />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">المفضلة</h1>
            <p className="text-sm text-gray-500 font-light mt-1">الحرفيون المفضلون لديك</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse h-32" />
              ))}
            </div>
          ) : favorites.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <p className="text-5xl mb-4">❤️</p>
              <h2 className="text-xl font-black text-gray-900 mb-2">لا توجد مفضلة</h2>
              <p className="text-sm text-gray-500 font-light mb-6">أضف حرفيين إلى مفضلتك لمتابعتهم بسهولة</p>
              <button onClick={() => router.push('/professionals')}
                className="bg-[#0f5132] text-white text-sm font-bold px-6 py-3 rounded-full hover:bg-[#0c3f27] transition-colors">
                تصفح المحترفين
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {favorites.map((fav) => (
                <div key={fav._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-[#0f5132]/20 transition-all duration-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#eef6ef] to-[#dbeee0] flex items-center justify-center text-lg font-bold text-[#0f5132] shadow-sm">
                      {fav.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{fav.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">⭐ {fav.rating?.toFixed(1)}</p>
                    </div>
                    <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                      fav.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${fav.isAvailable ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {fav.isAvailable ? 'متاح' : 'مشغول'}
                    </span>
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
