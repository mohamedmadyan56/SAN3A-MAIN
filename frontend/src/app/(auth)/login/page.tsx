'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

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

    const loginToast = toast.loading('جاري التحقق من البيانات...');

    try {
      const response = await axios.post(
        'http://localhost:5000/api/v1/users/login',
        { email, password }
      );

      if (response.data.status === 'success') {
        const { token, data } = response.data;
        const userRole = data?.user?.role || 'customer';

        localStorage.setItem('user_token', token);
        localStorage.setItem('token', token);

        localStorage.setItem('user_token', token);
        localStorage.setItem('user_role', userRole);
        localStorage.setItem('user_name', data?.user?.name || '');
        localStorage.setItem('user_avatar', data?.user?.avatar || '');
        localStorage.setItem('user_id', data?.user?._id || '');

        toast.success(`مرحبًا بعودتك يا ${data?.user?.name || ''} 🎉`, {
          id: loginToast,
        });

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
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        'بريد إلكتروني أو كلمة مرور غير صحيحة، تأكد وحاول مجدداً';
      
      toast.error(msg, {
        id: loginToast,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-row-reverse bg-white">

      <div className="hidden lg:flex w-1/2 bg-gradient-to-b from-[#071C35] to-[#02111F] text-white relative">
        <div className="w-full flex flex-col justify-center px-16">

          <div className="absolute top-8 right-8">
            <Image
              src="/logo.png"
              alt="Logo"
              width={140}
              height={45}
              priority
              className="object-contain"
            />
          </div>

          <h1 className="text-5xl font-black leading-[1.15] tracking-tight mb-6">
            مرحبًا بعودتك<br />
            إلى منصة صنعة
          </h1>

          <p className="text-gray-300 text-lg font-light leading-[1.9] mb-12">
            سجل الدخول للوصول إلى حسابك وإدارة خدماتك بسهولة.
          </p>

          <div className="space-y-6">
            <div className="flex items-center gap-3 justify-end">
              <span>تجربة استخدام سريعة</span>
              <div className="w-8 h-8 rounded-full border border-green-400 flex items-center justify-center text-green-400">
                ✓
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end">
              <span>حساب آمن بالكامل</span>
              <div className="w-8 h-8 rounded-full border border-green-400 flex items-center justify-center text-green-400">
                🛡
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end">
              <span>دعم مستمر 24/7</span>
              <div className="w-8 h-8 rounded-full border border-green-400 flex items-center justify-center text-green-400">
                🎧
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-xl" dir="rtl">

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
            <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">
              تسجيل الدخول
            </h2>
            <p className="text-gray-500">أدخل بياناتك للمتابعة</p>
          </div>

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
                className="w-full h-14 rounded-xl border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-[#007A4D] text-gray-900"
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
                className="w-full h-14 rounded-xl border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-[#007A4D] text-gray-900"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#007A4D] hover:bg-[#006341] disabled:bg-gray-400 transition text-white py-4 rounded-xl text-lg font-medium"
            >
              {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>

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
            <button className="text-[#007A4D] font-medium">العربية</button>
            <button className="text-gray-500">English</button>
          </div>

        </div>
      </div>
    </div>
  );
}
