'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const navigate = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('user_token');
    if (token) navigate.push('/');
  }, []);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'craftsman'>('customer');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await axios.post(
        'http://localhost:5000/api/v1/users/signup',
        { name, email, phone, password, role }
      );

      if (response.data.status === 'success') {
        setSuccessMessage('تم إنشاء الحساب بنجاح! 🎉');
        const token = response.data.token;
        localStorage.setItem('token', token);
        localStorage.setItem('user_token', token);
        localStorage.setItem('user_role', response.data.data?.user?.role || 'customer');
        localStorage.setItem('user_name', response.data.data?.user?.name || '');
        navigate.push('/');
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        'حدث خطأ أثناء إنشاء الحساب، يرجى المحاولة مرة أخرى';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-row-reverse bg-white">

      {/* ===== الجانب الأيمن (معلومات المنصة) ===== */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-b from-[#071C35] to-[#02111F] text-white relative">
        <div className="w-full flex flex-col justify-center px-16">

          {/* اللوجو في الأعلى */}
          <div className="absolute top-8 right-8">
            <Image
              src="/logo.png"
              alt="San3a Logo"
              width={140}
              height={45}
              priority
              className="object-contain"
            />
          </div>

          <h1 className="text-6xl font-black leading-[1.1] tracking-tight mb-6">
            انضم إلى مجتمعنا من<br />
            المحترفين الموثوقين<br />
            وأصحاب المنازل السعداء
          </h1>

          <p className="text-gray-300 text-lg font-light leading-[1.9] mb-12">
            المنصة الأكثر موثوقية لخدمات المنازل الذكية الاحترافية.<br />
            آمنة، موثوقة، وسلسة.
          </p>

          <div className="space-y-6">
            <div className="flex items-center gap-3 justify-end">
              <span>شبكة محترفين موثقة</span>
              <div className="w-8 h-8 rounded-full border border-green-400 flex items-center justify-center text-green-400">
                ✓
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end">
              <span>حماية دفع آمنة</span>
              <div className="w-8 h-8 rounded-full border border-green-400 flex items-center justify-center text-green-400">
                🛡
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end">
              <span>دعم فني متخصص على مدار الساعة</span>
              <div className="w-8 h-8 rounded-full border border-green-400 flex items-center justify-center text-green-400">
                🎧
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== الجانب الأيسر (الفورم) ===== */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-xl" dir="rtl">

          {/* اللوجو فوق الفورم */}
          <div className="flex justify-center mb-8">
            <Image
              src="/logo.png"
              alt="منصة صنعة"
              width={180}
              height={60}
              priority
              className="object-contain"
            />
          </div>

          <div className="text-center mb-8">
            <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">
              إنشاء حساب
            </h2>
            <p className="text-gray-500">ابدأ رحلتك مع صنعة اليوم.</p>
          </div>

          {/* رسائل التنبيه والخطأ */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-4 text-sm font-medium">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-600 p-4 rounded-xl mb-4 text-sm font-medium">
              {successMessage}
            </div>
          )}

          {/* اختيار نوع الحساب */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <button
              type="button"
              onClick={() => setRole('customer')}
                className={`py-4 rounded-xl font-bold transition-all tracking-tight ${
                  role === 'customer'
                    ? 'bg-[#007A4D] text-white shadow-md'
                    : 'bg-[#EEF5F1] text-gray-700 hover:bg-gray-200'
                }`}
              >
                أنا عميل
              </button>

              <button
                type="button"
                onClick={() => setRole('craftsman')}
                className={`py-4 rounded-xl font-bold transition-all tracking-tight ${
                  role === 'craftsman'
                    ? 'bg-[#007A4D] text-white shadow-md'
                    : 'bg-[#EEF5F1] text-gray-700 hover:bg-gray-200'
                }`}
              >
                أنا فني محترف
              </button>
          </div>

          {/* فورم إدخال البيانات */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block mb-2 text-gray-700 font-medium">
                الاسم الكامل
              </label>
              <input
                type="text"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أدخل اسمك الكامل"
                className="w-full h-14 rounded-xl border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-[#007A4D] text-gray-900"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+20 100 000 0000"
                  pattern="^\+?[0-9\s]{8,15}$"
                  title="يرجى إدخال رقم هاتف صحيح (أرقام فقط، يمكن أن يبدأ بـ +)"
                  className="w-full h-14 rounded-xl border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-[#007A4D] text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block mb-2 text-gray-700 font-medium">
                كلمة المرور
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8 أحرف على الأقل"
                className="w-full h-14 rounded-xl border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-[#007A4D] text-gray-900"
              />
            </div>

            {/* شروط وسياسة الخصوصية */}
            <div className="flex items-center gap-3 justify-start select-none">
              <input
                id="terms"
                type="checkbox"
                required
                className="w-5 h-5 accent-[#007A4D] cursor-pointer"
              />
              <label htmlFor="terms" className="text-gray-700 cursor-pointer text-sm font-medium">
                أوافق على الشروط وسياسة الخصوصية
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#007A4D] hover:bg-[#006341] disabled:bg-gray-400 transition text-white py-4 rounded-xl text-lg font-medium"
            >
              {isLoading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
            </button>
          </form>

          <div className="text-center mt-8">
            <span className="text-gray-500">لديك حساب بالفعل؟</span>
            <button
              type="button"
              onClick={() => navigate.push('/login')}
              className="mr-2 font-black text-gray-900 hover:underline"
            >
              تسجيل الدخول
            </button>
          </div>

          <div className="flex justify-center gap-6 mt-12 text-lg">
            <button type="button" className="text-[#007A4D] font-medium">
              العربية
            </button>
            <button type="button" className="text-gray-500">
              English
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
