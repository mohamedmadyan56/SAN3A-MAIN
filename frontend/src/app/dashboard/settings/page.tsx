'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Sidebar from '@/components/dashboard/Sidebar';

export default function SettingsPage() {
  const router = useRouter();
  const [role, setRole] = useState('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('user_token');
    const userRole = localStorage.getItem('user_role') || 'customer';
    setRole(userRole);

    if (!token) { router.push('/login'); return; }

    axios.get('http://localhost:5000/api/v1/users/profile', {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      if (res.data.status === 'success') {
        const user = res.data.data.user;
        setName(user.name || '');
        setEmail(user.email || '');
        setPhone(user.phone || '');
        setAddress(user.location?.address || '');
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('user_token');
      await axios.patch(`http://localhost:5000/api/v1/admin/users/${localStorage.getItem('user_id')}`, {
        name, phone,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('تم حفظ التغييرات بنجاح');
    } catch (err) {
      toast.error('حدث خطأ أثناء حفظ التغييرات');
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
            <div className="h-64 bg-gray-200 rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      <Sidebar items={NAV_ITEMS} role={role} />

      <main className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-black text-gray-900 mb-6 tracking-tight">الإعدادات</h1>

          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
            <div>
              <label className="block mb-2 text-gray-700 font-medium text-sm">الاسم الكامل</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full h-12 rounded-xl border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-[#0f5132]/20 text-gray-900" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-gray-700 font-medium text-sm">البريد الإلكتروني</label>
                <input type="email" value={email} disabled
                  className="w-full h-12 rounded-xl border border-gray-200 px-4 bg-gray-50 text-gray-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="block mb-2 text-gray-700 font-medium text-sm">رقم الهاتف</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-12 rounded-xl border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-[#0f5132]/20 text-gray-900" />
              </div>
            </div>

            <div>
              <label className="block mb-2 text-gray-700 font-medium text-sm">العنوان</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                className="w-full h-12 rounded-xl border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-[#0f5132]/20 text-gray-900" />
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-bold text-gray-900 mb-4">تفاصيل الحساب</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">نوع الحساب</p>
                  <p className="font-medium text-gray-900">
                    {role === 'admin' ? 'مسؤول' : role === 'craftsman' ? 'حرفي' : 'عميل'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">اللغة</p>
                  <p className="font-medium text-gray-900">العربية</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button type="submit" disabled={saving}
                className="bg-[#0f5132] text-white text-sm font-bold px-6 py-3 rounded-full hover:bg-[#0c3f27] disabled:bg-gray-400 transition-colors">
                {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </button>
              <button type="button" onClick={() => router.back()}
                className="border border-gray-300 text-gray-600 text-sm font-bold px-6 py-3 rounded-full hover:bg-gray-50 transition-colors">
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
