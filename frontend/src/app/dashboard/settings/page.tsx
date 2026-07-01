'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { CldUploadWidget } from 'next-cloudinary';
import Sidebar from '@/components/dashboard/Sidebar';
import { API_BASE, extractTextContent, getAuthHeaders } from '@/lib/api';

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

export default function SettingsPage() {
  const router = useRouter();
  const [role, setRole] = useState(() => {
    if (typeof window === 'undefined') return 'customer';
    return localStorage.getItem('user_role') || 'customer';
  });
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [avatar, setAvatar] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('user_token');
    const userRole = localStorage.getItem('user_role') || 'customer';
    const timeout = window.setTimeout(() => setRole(userRole), 0);

    if (!token) { router.push('/login'); return; }

    axios.get(`${API_BASE}/users/profile`, {
      headers: getAuthHeaders(),
    }).then((res) => {
      if (res.data.status === 'success') {
        const user = res.data.data.user;
        setName(user.name || '');
        setEmail(user.email || '');
        setPhone(user.phone || '');
        setAddress(user.location?.address || '');
        const av = user.avatar || '';
        setAvatar(av !== 'default.png' ? av : '');
        localStorage.setItem('user_id', user._id || '');
      }
    }).catch(() => {}).finally(() => setLoading(false));
    return () => window.clearTimeout(timeout);
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.patch(`${API_BASE}/users/update-profile`, {
        name, phone, address, avatar,
      }, {
        headers: getAuthHeaders(),
      });
      if (res.data.status === 'success') {
        localStorage.setItem('user_name', name);
        localStorage.setItem('user_avatar', avatar || '');
        toast.success('تم حفظ التغييرات بنجاح');
      }
    } catch (err: unknown) {
      toast.error(extractTextContent(err, 'حدث خطأ أثناء حفظ التغييرات'));
    } finally {
      setSaving(false);
    }
  };

  const NAV_ITEMS = [
    { label: 'لوحة التحكم', href: `/dashboard/${role}`, icon: '📊' },
    { label: 'الإعدادات', href: '/dashboard/settings', icon: '⚙️' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex" dir="rtl">
        <Sidebar items={NAV_ITEMS} role={role} />
        <main className="flex-1 p-6">
          <div className="animate-pulse space-y-4 max-w-2xl mx-auto">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="h-80 bg-gray-200 rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      <Sidebar items={NAV_ITEMS} role={role} />

      <main className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2 tracking-tight">الإعدادات</h1>
          <p className="text-sm text-gray-500 mb-8">إدارة ملفك الشخصي ومعلومات حسابك</p>

          <form onSubmit={handleSave} className="space-y-6">
            {/* صورة البروفايل */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
              <h2 className="font-bold text-gray-900 mb-6">الصورة الشخصية</h2>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="Profile"
                      className="w-24 h-24 rounded-2xl object-cover shadow-sm border border-gray-100"
                    />
                  ) : (
                    <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${getAvatarColor(name)} flex items-center justify-center text-white text-3xl font-bold shadow-sm`}>
                      {getInitials(name)}
                    </div>
                  )}
                  <div className="absolute -bottom-2 -left-2">
                    <CldUploadWidget
                      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'san3a_uploads'}
                      options={{
                        maxFiles: 1,
                        sources: ['local', 'camera', 'url'],
                        cropping: true,
                        croppingAspectRatio: 1,
                        showSkipCropButton: false,
                        styles: { palette: { theme: 'green' } },
                      }}
                      onSuccess={(result: { info?: string | { secure_url?: string } }) => {
                        const url = typeof result.info === 'object' ? result.info.secure_url : undefined;
                        if (url) setAvatar(url);
                        toast.success('تم رفع الصورة بنجاح');
                      }}
                    >
                      {({ open }) => (
                        <button
                          type="button"
                          onClick={() => open()}
                          className="w-8 h-8 rounded-full bg-[#0f5132] text-white flex items-center justify-center shadow-md hover:bg-[#0c3f27] transition-all text-sm"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                        </button>
                      )}
                    </CldUploadWidget>
                  </div>
                </div>
                <div className="text-center sm:text-right">
                  <p className="font-bold text-gray-900 text-sm">{name || 'مستخدم'}</p>
                  <p className="text-xs text-gray-400">{email}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {role === 'admin' ? 'مسؤول' : role === 'craftsman' ? 'حرفي' : 'عميل'}
                  </p>
                </div>
              </div>
            </div>

            {/* المعلومات الأساسية */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-5">
              <h2 className="font-bold text-gray-900 mb-4">المعلومات الأساسية</h2>

              <div>
                <label className="block mb-2 text-gray-700 font-medium text-sm">الاسم الكامل</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full h-12 rounded-xl border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-[#0f5132]/20 text-gray-900 text-sm" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-gray-700 font-medium text-sm">البريد الإلكتروني</label>
                  <input type="email" value={email} disabled
                    className="w-full h-12 rounded-xl border border-gray-200 px-4 bg-gray-50 text-gray-500 cursor-not-allowed text-sm" />
                </div>
                <div>
                  <label className="block mb-2 text-gray-700 font-medium text-sm">رقم الهاتف</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-12 rounded-xl border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-[#0f5132]/20 text-gray-900 text-sm" />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-gray-700 font-medium text-sm">العنوان</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                  placeholder="مثال: القاهرة، مصر الجديدة"
                  className="w-full h-12 rounded-xl border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-[#0f5132]/20 text-gray-900 text-sm" />
              </div>
            </div>

            {/* تفاصيل الحساب */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
              <h2 className="font-bold text-gray-900 mb-4">تفاصيل الحساب</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-400 text-xs mb-1">نوع الحساب</p>
                  <p className="font-bold text-gray-900">
                    {role === 'admin' ? 'مسؤول' : role === 'craftsman' ? 'حرفي' : 'عميل'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-400 text-xs mb-1">اللغة</p>
                  <p className="font-bold text-gray-900">العربية</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-400 text-xs mb-1">الإشتراك</p>
                  <p className="font-bold text-[#0f5132]">مجاني</p>
                </div>
              </div>
            </div>

            {/* الأزرار */}
            <div className="flex items-center gap-3">
              <button type="submit" disabled={saving}
                className="bg-[#0f5132] text-white text-sm font-bold px-6 py-3 rounded-2xl hover:bg-[#0c3f27] disabled:bg-gray-400 transition-all shadow-sm">
                {saving ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    جاري الحفظ...
                  </span>
                ) : 'حفظ التغييرات'}
              </button>
              <button type="button" onClick={() => router.back()}
                className="border border-gray-200 text-gray-600 text-sm font-bold px-6 py-3 rounded-2xl hover:bg-gray-50 transition-all">
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
