'use client';
import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import { API_BASE, extractTextContent, getAuthHeaders } from '@/lib/api';

interface IService {
  _id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  icon?: string;
}

type TimingOption = 'NOW' | 'SCHEDULE';

function ServiceIcon({ name, active }: { name: string; active: boolean }) {
  const stroke = active ? '#0f5132' : '#374151';
  const common = {
    width: 32,
    height: 32,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke,
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'cleaning':
      return (
        <svg {...common}>
          <path d="M19 3 9 13" />
          <path d="M14 4l6 6" />
          <path d="M9 13l-6 7 4 1 2-3" />
          <path d="M5 18l3 2" />
        </svg>
      );
    case 'air-conditioning':
    case 'ac':
      return (
        <svg {...common}>
          <path d="M12 2v20" />
          <path d="M4 7l16 10" />
          <path d="M20 7 4 17" />
        </svg>
      );
    case 'electricity':
    case 'electric':
      return (
        <svg {...common}>
          <path d="M9 7V3M15 7V3" />
          <path d="M6 7h12v4a6 6 0 0 1-12 0V7z" />
          <path d="M9 17v2a3 3 0 0 0 6 0v-2" />
        </svg>
      );
    case 'plumbing':
    default:
      return (
        <svg {...common}>
          <path d="M21 7.5 16.5 12l-2-2L19 5.5a5 5 0 0 0-6.5 6.5L3 21l1.5 1.5L15 13a5 5 0 0 0 6-5.5z" />
        </svg>
      );
  }
}

const arabicStepNumber = (n: number) => ['١', '٢', '٣'][n - 1] ?? String(n);

export default function NewRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const [services, setServices] = useState<IService[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [address, setAddress] = useState<string>('جاري جلب موقعك الحالي...');
  const [editingAddress, setEditingAddress] = useState<boolean>(false);
  const [addressInput, setAddressInput] = useState<string>('');
  const [clientNotes, setClientNotes] = useState<string>('');
  const [timing, setTiming] = useState<TimingOption>('NOW');
  const [scheduledDate, setScheduledDate] = useState<string>('');

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get(`${API_BASE}/services`);
        if (response.data.status === 'success') {
          const fetchedServices = response.data.data.services;
          setServices(fetchedServices);
          if (fetchedServices.length > 0) {
            setSelectedServiceId(fetchedServices[0]._id);
          }
        }
      } catch (err: unknown) {
        setError('فشل في تحميل الخدمات من السيرفر، تأكد من تشغيل الباك إند');
      }
    };

    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await axios.get(`${API_BASE}/users/profile`, { headers: getAuthHeaders() });
        if (response.data.data?.user?.location?.address) {
          setAddress(response.data.data.user.location.address);
        } else {
          setAddress('القاهرة، وسط البلد');
        }
      } catch (err) {
        setAddress('القاهرة، وسط البلد');
      }
    };

    fetchServices();
    fetchUserProfile();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedServiceId) {
      setError('يرجى اختيار الخدمة المطلوبة أولاً');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');

      const response = await axios.post(
        `${API_BASE}/requests`,
        {
          service: selectedServiceId,
          address,
          coordinates: [31.2358, 30.0445],
          clientNotes,
          paymentMethod: 'CASH',
          scheduling: timing,
          scheduledAt: timing === 'SCHEDULE' ? scheduledDate : undefined,
        },
        {
          headers: token ? getAuthHeaders() : undefined,
        }
      );

      if (response.data.status === 'success') {
        router.push(`/requests/matching/${response.data.data.request._id}`);
      }
    } catch (err: unknown) {
      setError(extractTextContent(err, 'فشل في إنشاء الطلب، يرجى المحاولة مرة أخرى'));
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, label: 'اختيار الخدمة' },
    { number: 2, label: 'التفاصيل' },
    { number: 3, label: 'التأكيد' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0f7f2] to-[#e8f1eb]" dir="rtl">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* العنوان والوصف */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0f5132]/10 mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0f5132" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2 tracking-tight">طلب خدمة جديدة</h1>
          <p className="text-gray-500 text-sm sm:text-base">اختر الخدمة المناسبة لك وسنجد لك أفضل المحترفين</p>
        </div>

        {/* خطوات التقدم */}
        <div className="flex items-center justify-center mb-8 sm:mb-10 gap-0">
          {steps.map((step, idx) => {
            const isActive = idx === 0;
            const isPast = idx < 0;
            return (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-300 ${
                      isActive
                        ? 'bg-[#0f5132] text-white shadow-md shadow-[#0f5132]/20'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {isPast ? '✓' : arabicStepNumber(step.number)}
                  </div>
                  <span className={`text-[11px] sm:text-xs whitespace-nowrap ${
                    isActive ? 'text-gray-900 font-semibold' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`w-12 sm:w-16 md:w-24 h-0.5 mx-2 sm:mx-3 mb-6 rounded-full ${
                      idx === 0 ? 'bg-[#0f5132]/30' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* الفورم */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 sm:p-8 space-y-8">
            {error && (
              <div className="bg-red-50/80 border border-red-200 text-red-700 p-4 rounded-2xl text-sm flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-xs font-bold shrink-0">!</span>
                {error}
              </div>
            )}

            {/* اختيار الخدمة */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-6 rounded-full bg-[#0f5132]" />
                <h3 className="text-lg font-bold text-gray-900">اختر الخدمة المطلوبة</h3>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {services.map((service) => {
                  const active = selectedServiceId === service._id;
                  return (
                    <button
                      key={service._id}
                      type="button"
                      onClick={() => setSelectedServiceId(service._id)}
                      className={`relative flex flex-col items-center gap-2.5 py-5 px-5 rounded-2xl border-2 transition-all duration-200 flex-1 basis-[120px] max-w-[160px] ${
                        active
                          ? 'border-[#0f5132] bg-[#eef6ef] shadow-md shadow-[#0f5132]/10 scale-[1.03]'
                          : 'border-gray-100 bg-gray-50/50 hover:border-gray-200 hover:bg-white hover:shadow-sm'
                      }`}
                    >
                      {active && (
                        <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-[#0f5132] flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
                          ✓
                        </span>
                      )}
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors duration-200 ${
                        active ? 'bg-white shadow-sm' : 'bg-white'
                      }`}>
                        <ServiceIcon name={service.slug} active={active} />
                      </div>
                      <span className={`text-sm font-medium ${active ? 'text-[#0f5132]' : 'text-gray-600'}`}>
                        {service.nameAr}
                      </span>
                    </button>
                  );
                })}
              </div>
              {services.length === 0 && !error && (
                <div className="flex flex-col items-center gap-3 py-8 text-gray-400">
                  <div className="w-8 h-8 border-2 border-gray-300 border-t-[#0f5132] rounded-full animate-spin" />
                  <p className="text-sm">جاري تحميل الخدمات...</p>
                </div>
              )}
            </div>

            {/* الموقع */}
            <div className="border-t border-gray-100 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 rounded-full bg-[#0f5132]" />
                <h3 className="text-lg font-bold text-gray-900">موقع تنفيذ الخدمة</h3>
              </div>
              {editingAddress ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    className="flex-1 px-4 py-3 border-2 border-[#0f5132]/30 rounded-2xl bg-[#f8fbf9] text-gray-900 text-sm focus:outline-none focus:border-[#0f5132] focus:ring-0"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (addressInput.trim()) {
                          setAddress(addressInput.trim());
                          setEditingAddress(false);
                        }
                      }
                      if (e.key === 'Escape') setEditingAddress(false);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (addressInput.trim()) {
                        setAddress(addressInput.trim());
                        setEditingAddress(false);
                      }
                    }}
                    className="bg-[#0f5132] text-white px-5 py-3 rounded-2xl text-sm font-medium hover:bg-[#0c3f27] transition-all shadow-sm"
                  >
                    حفظ
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingAddress(false)}
                    className="text-gray-500 px-4 py-3 rounded-2xl text-sm hover:bg-gray-100 transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-[#f8fbf9] border border-gray-100 rounded-2xl px-5 py-3.5 group hover:border-gray-200 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-white shadow-sm text-base">📍</span>
                    <span className="text-sm text-gray-700">{address}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAddressInput(address);
                      setEditingAddress(true);
                    }}
                    className="text-[#0f5132] text-sm font-medium opacity-0 group-hover:opacity-100 transition-all bg-[#0f5132]/5 px-4 py-1.5 rounded-full"
                  >
                    تعديل
                  </button>
                </div>
              )}
            </div>

            {/* الملاحظات */}
            <div className="border-t border-gray-100 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 rounded-full bg-[#0f5132]" />
                <h3 className="text-lg font-bold text-gray-900">تفاصيل إضافية</h3>
              </div>
              <textarea
                rows={3}
                placeholder="اكتب وصفاً للمشكلة (مثلاً: تسريب مياه في حوض المطبخ)"
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl bg-[#f8fbf9] placeholder-gray-400 text-gray-900 text-sm focus:outline-none focus:border-[#0f5132]/40 focus:bg-white focus:shadow-sm transition-all"
              />
              <p className="text-xs text-gray-400 mt-1.5 text-left">أضف أي تفاصيل تساعد الفني في فهم المهمة</p>
            </div>

            {/* التوقيت */}
            <div className="border-t border-gray-100 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 rounded-full bg-[#0f5132]" />
                <h3 className="text-lg font-bold text-gray-900">وقت التنفيذ</h3>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setTiming('NOW')}
                  className={`flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-medium transition-all duration-200 ${
                    timing === 'NOW'
                      ? 'bg-[#0f5132] text-white shadow-md shadow-[#0f5132]/20'
                      : 'bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100 hover:border-gray-200'
                  }`}
                >
                  <span className="text-base">⚡</span>
                  فوري
                </button>
                <button
                  type="button"
                  onClick={() => setTiming('SCHEDULE')}
                  className={`flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-medium transition-all duration-200 ${
                    timing === 'SCHEDULE'
                      ? 'bg-[#0f5132] text-white shadow-md shadow-[#0f5132]/20'
                      : 'bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100 hover:border-gray-200'
                  }`}
                >
                  <span className="text-base">📅</span>
                  موعد لاحق
                </button>
              </div>
              {timing === 'NOW' && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-xl px-4 py-2 mt-3 flex items-center gap-2">
                  <span>⏱</span>
                  سيتم إرسال طلبك فوراً للمحترفين المتاحين
                </p>
              )}
              {timing === 'SCHEDULE' && (
                <div className="mt-4">
                  <label className="block text-xs text-gray-500 mb-2">اختر التاريخ والوقت</label>
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-[#f8fbf9] text-gray-900 text-sm focus:outline-none focus:border-[#0f5132]/40 focus:bg-white focus:shadow-sm transition-all"
                  />
                </div>
              )}
            </div>
          </div>

          {/* الأزرار */}
          <div className="flex items-center justify-between mt-6 gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-sm font-medium text-gray-500 px-5 py-3 rounded-2xl border border-gray-200 hover:bg-white hover:border-gray-300 transition-all"
            >
              رجوع
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-l from-[#0f5132] to-[#0a3822] text-white text-sm font-medium px-6 py-3 rounded-2xl hover:shadow-lg hover:shadow-[#0f5132]/20 focus:outline-none disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none transition-all"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  تأكيد الطلب
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-180">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </main>

      {/* الفوتر */}
      <footer className="bg-white border-t border-gray-100 mt-12">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <span className="text-[#0f5132] font-bold text-base">صنعة</span>
          <div className="flex items-center gap-6">
            <Link href="/help" className="hover:text-gray-600 transition-colors">المساعدة</Link>
            <Link href="/professionals" className="hover:text-gray-600 transition-colors">المحترفون</Link>
            <a href="#" className="hover:text-gray-600 transition-colors">الخصوصية</a>
          </div>
          <span>© ٢٠٢٦ صنعة. جميع الحقوق محفوظة.</span>
        </div>
      </footer>
    </div>
  );
}
