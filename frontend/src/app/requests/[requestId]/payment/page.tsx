'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import Stepper from '@/components/Stepper';
import { API_BASE, extractTextContent, getAuthHeaders } from '@/lib/api';

type PaymentMethod = 'CARD' | 'CASH';

interface RequestDetails {
  _id: string;
  service?: { nameAr?: string; name?: string };
  craftsman?: { name?: string; rating?: number; avgResponseTimeSeconds?: number | null; location?: { address?: string } };
  location?: { address?: string };
  clientNotes?: string;
  scheduledAt?: string;
  pricing?: { baseFee?: number; emergencyFee?: number; totalAmount?: number };
}

interface PaymentPageProps {
  params: Promise<{ requestId: string }>;
}

export default function PaymentPage({ params }: PaymentPageProps) {
  const { requestId } = use(params);
  const router = useRouter();
  const [request, setRequest] = useState<RequestDetails | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const response = await axios.get(`${API_BASE}/requests/${requestId}`, { headers: getAuthHeaders() });
        setRequest(response.data.data.request);
      } catch (err: unknown) {
        setError(extractTextContent(err, 'تعذر تحميل تفاصيل الحجز'));
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [requestId]);

  const confirmBooking = async () => {
    setSubmitting(true);
    setError('');
    try {
      await axios.post(
        `${API_BASE}/requests/${requestId}/confirm-booking`,
        { paymentMethod },
        { headers: getAuthHeaders() }
      );
      router.push(`/requests/${requestId}/tracking`);
    } catch (err: unknown) {
      setError(extractTextContent(err, 'تعذر تأكيد الحجز، حاول مرة أخرى'));
    } finally {
      setSubmitting(false);
    }
  };

  const baseFee = request?.pricing?.baseFee ?? 120;
  const emergencyFee = request?.pricing?.emergencyFee ?? 30;
  const total = request?.pricing?.totalAmount ?? baseFee + emergencyFee;
  const serviceName = request?.service?.nameAr || request?.service?.name || 'سباكة';
  const craftsmanName = request?.craftsman?.name || 'محترف صنعة';

  return (
    <div className="min-h-screen bg-[#eef6ef]" dir="rtl">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="mb-10">
          <Stepper currentStep={4} />
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-gray-100 shadow-sm bg-white h-96 animate-pulse" />
        ) : (
          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-6 items-start">
            <section className="space-y-5 lg:order-2">
              <div className="rounded-2xl border border-gray-100 shadow-sm bg-white p-6">
                <h1 className="text-xl font-bold text-gray-900 mb-5">طريقة الدفع</h1>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD')}
                    className={`w-full text-right rounded-2xl border p-4 transition-colors ${paymentMethod === 'CARD' ? 'border-[#0f5132] bg-[#eef6ef]' : 'border-gray-100 bg-white'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xl">💳</span>
                      <span className="flex-1 font-bold text-gray-900">بطاقة ائتمان</span>
                      <span className={`w-4 h-4 rounded-full border ${paymentMethod === 'CARD' ? 'border-[#0f5132] bg-[#0f5132]' : 'border-gray-300'}`} />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                      <span>**** **** **** 4242</span>
                      <span className="font-bold text-[#0f5132]">تغيير</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`w-full text-right rounded-2xl border p-4 transition-colors ${paymentMethod === 'CASH' ? 'border-[#0f5132] bg-[#eef6ef]' : 'border-gray-100 bg-white'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xl">💵</span>
                      <span className="flex-1 font-bold text-gray-900">دفع نقدي</span>
                      <span className={`w-4 h-4 rounded-full border ${paymentMethod === 'CASH' ? 'border-[#0f5132] bg-[#0f5132]' : 'border-gray-300'}`} />
                    </div>
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 shadow-sm bg-white p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-5">ملخص التكلفة</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">رسوم الخدمة الأساسية</span><span className="font-bold">{baseFee}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">رسوم طوارئ (فوراً)</span><span className="font-bold text-[#0f5132]">+{emergencyFee}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">ضريبة القيمة المضافة</span><span className="font-bold">مشمولة</span></div>
                  <div className="border-t border-gray-100 pt-4 flex justify-between text-lg"><span className="font-bold">الإجمالي النهائي</span><span className="font-bold text-[#0f5132]">{total}</span></div>
                  <div className="flex justify-end"><span className="rounded-full bg-[#eef6ef] text-[#0f5132] text-xs font-bold px-3 py-1">دفع مؤمن</span></div>
                </div>
              </div>

              <button
                type="button"
                onClick={confirmBooking}
                disabled={submitting}
                className="w-full bg-[#0f5132] text-white rounded-full font-bold hover:bg-[#0c3f27] transition-colors py-3 disabled:opacity-60"
              >
                {submitting ? 'جاري التأكيد...' : 'تأكيد الحجز ✓'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="w-full border border-[#0f5132] text-[#0f5132] rounded-full hover:bg-[#eef6ef] transition-colors py-3 font-bold"
              >
                رجوع للخطوة السابقة
              </button>
            </section>

            <section className="grid sm:grid-cols-2 gap-5 lg:order-1">
              <div className="rounded-2xl border border-gray-100 shadow-sm bg-white p-5">
                <p className="text-gray-500 text-sm mb-2">نوع الخدمة</p>
                <p className="font-bold text-gray-900">{serviceName}</p>
                <p className="text-gray-500 text-sm mt-4 mb-2">الموعد</p>
                <p className="font-bold text-gray-900">الآن، طلب طوارئ</p>
              </div>
              <div className="rounded-2xl border border-gray-100 shadow-sm bg-white p-5">
                <div className="w-12 h-12 rounded-2xl bg-[#eef6ef] flex items-center justify-center mb-3">👨‍🔧</div>
                <h2 className="font-bold text-gray-900">{craftsmanName}</h2>
                <p className="text-sm text-gray-500 mt-2">⭐ {(request?.craftsman?.rating ?? 4.9).toFixed(1)} · خبير 10س</p>
                <p className="text-sm text-gray-500 mt-1">📍 على بعد 2.4 كم</p>
              </div>
              <div className="sm:col-span-2 rounded-2xl border border-gray-100 shadow-sm bg-white p-5">
                <h2 className="font-bold text-gray-900 mb-3">موقع الخدمة</h2>
                <div className="h-40 rounded-2xl bg-[#eef6ef] border border-gray-100 flex items-center justify-center text-[#0f5132] font-bold mb-4">
                  {request?.location?.address || 'القاهرة، وسط البلد'}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">ملاحظات للفني</h3>
                <p className="text-sm text-gray-500 leading-7">«{request?.clientNotes || 'يوجد تسريب يحتاج إلى فحص سريع.'}»</p>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
