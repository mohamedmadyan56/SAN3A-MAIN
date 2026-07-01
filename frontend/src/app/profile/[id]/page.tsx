'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import { API_BASE } from '@/lib/api';

function getInitials(name: string): string {
  return name?.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase() || '?';
}

function getAvatarColor(name: string): string {
  const colors = [
    'from-[#0f5132] to-[#0a3822]',
    'from-[#dc2626] to-[#991b1b]',
    'from-[#2563eb] to-[#1e40af]',
    'from-[#7c3aed] to-[#5b21b6]',
    'from-[#d97706] to-[#92400e]',
    'from-[#0891b2] to-[#155e75]',
  ];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

interface PublicUser {
  _id: string;
  name: string;
  avatar: string;
  role: string;
  rating: number;
  isAvailable: boolean;
  avgResponseTimeSeconds: number;
  responseCount: number;
  location: { address: string };
}

export default function PublicProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [completedJobs, setCompletedJobs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    axios.get(`${API_BASE}/users/public/${id}`)
      .then((res) => {
        if (res.data.status === 'success') {
          setUser(res.data.data.user);
          setCompletedJobs(res.data.data.stats.completedJobs);
        }
      })
      .catch(() => setError('المستخدم غير موجود'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-lg mx-auto pt-24 px-4 animate-pulse space-y-4">
          <div className="h-48 bg-gray-200 rounded-3xl" />
          <div className="h-8 bg-gray-200 rounded w-48 mx-auto" />
          <div className="h-4 bg-gray-200 rounded w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div dir="rtl" className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-lg mx-auto pt-32 px-4 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">المستخدم غير موجود</h1>
          <p className="text-gray-500 mb-6">عذراً، لم نتمكن من العثور على هذا المستخدم</p>
          <button onClick={() => router.push('/')} className="bg-[#0f5132] text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-[#0c3f27] transition-all">العودة للرئيسية</button>
        </div>
      </div>
    );
  }

  const isCraftsman = user.role === 'craftsman';

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-lg mx-auto pt-20 px-4 pb-10">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Banner */}
          <div className="h-32 bg-gradient-to-l from-[#0f5132] via-[#0a3822] to-[#062c19] relative">
            {isCraftsman && user.isAvailable && (
              <div className="absolute top-4 left-4 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                متاح الآن
              </div>
            )}
          </div>

          {/* Avatar */}
          <div className="flex justify-center -mt-12 mb-4">
            {user.avatar && user.avatar !== 'default.png' ? (
              <img src={user.avatar} alt={user.name} className="w-24 h-24 rounded-3xl object-cover border-4 border-white shadow-md" />
            ) : (
              <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${getAvatarColor(user.name)} flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-md`}>
                {getInitials(user.name)}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="px-6 pb-6 text-center">
            <h1 className="text-2xl font-black text-gray-900 mb-1">{user.name}</h1>
            <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 ${
              isCraftsman ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {isCraftsman ? 'حرفي' : user.role === 'admin' ? 'مسؤول' : 'عميل'}
            </span>

            {isCraftsman && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className={`w-5 h-5 ${star <= Math.round(user.rating) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm font-bold text-gray-700">{user.rating}</span>
              </div>
            )}

            {user.location?.address && (
              <div className="flex items-center justify-center gap-1.5 text-gray-500 text-sm mb-4">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {user.location.address}
              </div>
            )}

            {/* Stats Cards */}
            {isCraftsman && (
              <div className="grid grid-cols-2 gap-3 mt-6 mb-6">
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-2xl font-black text-gray-900">{completedJobs}</p>
                  <p className="text-xs text-gray-500">طلبات مكتملة</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-2xl font-black text-gray-900">
                    {user.avgResponseTimeSeconds ? `${Math.round(user.avgResponseTimeSeconds / 60)}` : '--'}
                  </p>
                  <p className="text-xs text-gray-500">متوسط زمن الرد (دقيقة)</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              {isCraftsman && (
                <button
                  onClick={() => router.push(`/requests/new?craftsman=${user._id}`)}
                  className="flex-1 bg-[#0f5132] text-white text-sm font-bold py-3 rounded-2xl hover:bg-[#0c3f27] transition-all shadow-sm"
                >
                  طلب الخدمة
                </button>
              )}
              <button
                onClick={() => router.back()}
                className={`${isCraftsman ? 'flex-none' : 'flex-1'} border border-gray-200 text-gray-600 text-sm font-bold py-3 rounded-2xl hover:bg-gray-50 transition-all`}
              >
                عودة
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
