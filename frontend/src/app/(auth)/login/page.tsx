'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { API_BASE, extractTextContent } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('user_token');
    if (token) router.push('/');
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // تشغيل الـ Toast اللودينج الاحترافي
    const loginToast = toast.loading('جاري التحقق من البيانات...');

    try {
      const response = await axios.post(
        `${API_BASE}/users/login`,
        { email, password }
      );

      if (response.data.status === 'success') {
        const { token, data } = response.data;
        const userRole = data?.user?.role || 'customer';

        localStorage.setItem('user_token', token);
        localStorage.setItem('token', token);

        // تخزين بيانات الجلسة في المتصفح
        localStorage.setItem('user_token', token);
        localStorage.setItem('user_role', userRole);
        localStorage.setItem('user_name', data?.user?.name || '');
        localStorage.setItem('user_avatar', data?.user?.avatar || '');
        localStorage.setItem('user_id', data?.user?._id || '');

        // تحويل الـ Toast لـ النجاح
        toast.success(`مرحبًا بعودتك يا ${data?.user?.name || ''} 🎉`, {
          id: loginToast,
        });

        // التوجيه الذكي للمستخدم بناءً على الـ Role
        setTimeout(() => {
          if (userRole === 'craftsman') {
            router.push('/dashboard/craftsman');
          } else if (userRole === 'admin') {
            router.push('/dashboard/admin');
          } else {
            router.push('/dashboard/customer');
          }
        }, 800);
      }
    } catch (err: unknown) {
      const msg = extractTextContent(err, 'بريد إلكتروني أو كلمة مرور غير صحيحة، تأكد وحاول مجدداً');
      
      // تحويل نفس الـ Toast لـ خطأ
      toast.error(msg, {
        id: loginToast,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef6ef] flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md rounded-2xl shadow-sm border border-gray-100 p-8 bg-white">

          {/* اللوجو فوق الفورم */}
          <div className="flex justify-center mb-8">
            <Image
              src="/logo.png"
              alt="Logo"
              width={180}
              height={60}
              priority
              className="object-contain"
            />
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              تسجيل الدخول
            </h2>
            <p className="text-gray-500">أدخل بياناتك للمتابعة</p>
          </div>

          {/* الفورم */}
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block mb-2 text-gray-700 font-medium">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="border border-gray-200 rounded-xl px-4 py-3 text-right w-full focus:border-[#0f5132] focus:ring-1 focus:ring-[#0f5132] outline-none"
              />
            </div>

            <div>
              <label className="block mb-2 text-gray-700 font-medium">
                كلمة المرور
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="border border-gray-200 rounded-xl px-4 py-3 text-right w-full focus:border-[#0f5132] focus:ring-1 focus:ring-[#0f5132] outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#0f5132] text-white rounded-full font-bold hover:bg-[#0c3f27] transition-colors py-3 disabled:opacity-60"
            >
              {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>

          {/* الروابط السفلية */}
          <div className="text-center mt-8">
            <span className="text-gray-500">ليس لديك حساب؟</span>
            <button
              type="button"
              onClick={() => router.push('/register')}
              className="mr-2 font-black text-gray-900 hover:underline"
            >
              إنشاء حساب
            </button>
          </div>

          <div className="flex justify-center gap-6 mt-12 text-lg">
            <button className="text-[#0f5132] font-medium">العربية</button>
            <button className="text-gray-500">English</button>
          </div>

        </div>
    </div>
  );
}
