'use client';
import { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface Craftsman {
  _id: string;
  name: string;
  phone: string;
  avatar?: string;
  location?: {
    coordinates: [number, number];
  };
}

// ⚠️ بيانات وهمية مؤقتة (rating, خبرة, توثيق) لحد ما تتضاف فعليًا في الباك إند (User schema)
// كل ما تضيف الحقول الحقيقية، تقدر تشيل الدالة دي وتقرأ القيم مباشرة من الـ craftsman object
interface EnrichedCraftsman extends Craftsman {
  rating: number;
  isVerified: boolean;
  experienceYears: number;
  responseTimeMinutes: number;
  distanceKm: number;
  matchScore: number;
}

function enrichCraftsmanWithMockData(craftsman: Craftsman, index: number): EnrichedCraftsman {
  // قيم وهمية ثابتة نسبيًا بناءً على ترتيب الفني في القايمة، عشان العرض يكون متنوع شكليًا
  // بدون أي عشوائية حقيقية (عشان النتيجة تفضل ثابتة لو الصفحة عملت re-render)
  const mockRatings = [4.9, 4.7, 4.8, 4.6, 4.5];
  const mockExperience = [10, 6, 8, 3, 5];
  const mockResponseTime = [15, 25, 30, 20, 40];
  const mockVerified = [true, false, true, false, true];
  const mockDistance = [2.4, 3.1, 5.0, 1.8, 6.2];

  const rating = mockRatings[index % mockRatings.length];
  const experienceYears = mockExperience[index % mockExperience.length];
  const responseTimeMinutes = mockResponseTime[index % mockResponseTime.length];
  const isVerified = mockVerified[index % mockVerified.length];
  const distanceKm = mockDistance[index % mockDistance.length];

  // حساب نسبة مطابقة تقريبية (وهمية) زي تصميم "درجة المطابقة":
  // 40% مسافة + 30% تقييم + 20% سرعة استجابة + 10% تاريخ سابق مع العميل
  const distanceScore = Math.max(0, 1 - distanceKm / 10) * 40;
  const ratingScore = (rating / 5) * 30;
  const responseScore = Math.max(0, 1 - responseTimeMinutes / 60) * 20;
  const historyScore = index === 0 ? 10 : 5; // وهمي: أول فني نعتبره "له تاريخ سابق"
  const matchScore = Math.round(distanceScore + ratingScore + responseScore + historyScore);

  return {
    ...craftsman,
    rating,
    isVerified,
    experienceYears,
    responseTimeMinutes,
    distanceKm,
    matchScore: Math.min(matchScore, 99),
  };
}

interface MatchingPageProps {
  params: Promise<{ requestId: string }>;
}

const SEARCH_TIMEOUT_MS = 60_000; // مدة البحث القصوى قبل ما نوقف الرادار ونوضح للمستخدم إنه ملقيناش حد
const POLLING_INTERVAL_MS = 4_000;

export default function MatchingPage({ params }: MatchingPageProps) {
  const { requestId } = use(params);
  const router = useRouter();

  const [craftsmen, setCraftsmen] = useState<Craftsman[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [searchTimedOut, setSearchTimedOut] = useState<boolean>(false);
  const [selectingId, setSelectingId] = useState<string>(''); // الفني اللي جاري إرسال طلب الاختيار له حاليًا

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedRef = useRef<number>(0);

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    const fetchNearbyCraftsmen = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('لم يتم العثور على توكن تسجيل الدخول');
          stopPolling();
          return;
        }

        const response = await axios.get(
          `http://localhost:5000/api/v1/requests/${requestId}/nearby-craftsmen`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data.status === 'success') {
          const fetched: Craftsman[] = response.data.data.craftsmen;
          setCraftsmen(fetched);

          // ✅ أهم تعديل: لما نلاقي فنيين، نوقف الـ polling فورًا
          // بدل ما يستمر للأبد حتى بعد ظهور النتائج
          if (fetched.length > 0) {
            stopPolling();
          }
        }
      } catch (err: any) {
        console.error('خطأ أثناء تحديث الرادار:', err);
        // ما نوقفش الرادار بسبب فشل مؤقت في الشبكة، يحاول تاني في الدورة الجاية
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyCraftsmen();

    intervalRef.current = setInterval(() => {
      elapsedRef.current += POLLING_INTERVAL_MS;
      fetchNearbyCraftsmen();
    }, POLLING_INTERVAL_MS);

    // ✅ جديد: لو عدت مدة البحث القصوى ومفيش نتائج، نوقف الرادار تلقائيًا
    timeoutRef.current = setTimeout(() => {
      stopPolling();
      setSearchTimedOut(true);
    }, SEARCH_TIMEOUT_MS);

    return () => stopPolling();
  }, [requestId]);

  // إعادة المحاولة بعد انتهاء المهلة، بدون إعادة تحميل الصفحة كاملة
  const handleRetry = () => {
    setSearchTimedOut(false);
    setLoading(true);
    elapsedRef.current = 0;

    const fetchNearbyCraftsmen = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await axios.get(
          `http://localhost:5000/api/v1/requests/${requestId}/nearby-craftsmen`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data.status === 'success') {
          const fetched: Craftsman[] = response.data.data.craftsmen;
          setCraftsmen(fetched);
          if (fetched.length > 0) stopPolling();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyCraftsmen();
    intervalRef.current = setInterval(() => {
      elapsedRef.current += POLLING_INTERVAL_MS;
      fetchNearbyCraftsmen();
    }, POLLING_INTERVAL_MS);
    timeoutRef.current = setTimeout(() => {
      stopPolling();
      setSearchTimedOut(true);
    }, SEARCH_TIMEOUT_MS);
  };

  // ✅ جديد: اختيار فني معين فعليًا — يبعت الطلب للباك إند، وبعد التأكيد ينتقل لصفحة confirm
  const handleSelectCraftsman = async (craftsmanId: string) => {
    setSelectingId(craftsmanId);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('لم يتم العثور على توكن تسجيل الدخول');
        setSelectingId('');
        return;
      }

      const response = await axios.patch(
        `http://localhost:5000/api/v1/requests/${requestId}/select-craftsman`,
        { craftsmanId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.status === 'success') {
        // التنقل بيحصل هنا فقط، بعد تأكيد الباك إند إن الفني تم ربطه بالطلب فعليًا
        router.push(`/requests/${requestId}/confirm`);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'تعذر اختيار هذا الفني، يرجى المحاولة مرة أخرى'
      );
      setSelectingId('');
    }
  };

  const enrichedCraftsmen: EnrichedCraftsman[] = craftsmen.map((c, i) =>
    enrichCraftsmanWithMockData(c, i)
  );

  // أفضل ترشيح (أعلى نسبة مطابقة) يظهر في كارت "درجة المطابقة" الرئيسي
  const topMatch = enrichedCraftsmen.length > 0
    ? [...enrichedCraftsmen].sort((a, b) => b.matchScore - a.matchScore)[0]
    : null;

  const showMatchingScreen = craftsmen.length > 0 && !searchTimedOut;

  return (
    <div className="min-h-screen bg-[#eef6ef] flex flex-col justify-between" dir="rtl">
      {/* الهيدر */}
      <header className="border-b border-gray-200/70 bg-[#eef6ef]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#0f5132] flex items-center justify-center text-white text-xs">
              ⌂
            </div>
            <span className="text-xl font-bold text-gray-900">صنعة</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-700">
            <a href="#" className="hover:text-gray-900">البحث عن خدمات</a>
            <a href="#" className="hover:text-gray-900">حجوزاتي</a>
            <a href="#" className="hover:text-gray-900">محترفون معتمدون</a>
          </nav>
          <button type="button" className="bg-gray-900 text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-black transition-colors">
            لوحة التحكم
          </button>
        </div>
      </header>

      {/* ===================== حالة 1: لسه بنبحث (مفيش نتائج ولا انتهت المهلة) ===================== */}
      {!showMatchingScreen && !searchTimedOut && (
        <main className="max-w-md w-full mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">جاري البحث عن أقرب فني متاح...</h2>
            <p className="text-sm text-gray-500">يقوم النظام بمسح دائرة قطرها ٥ كم حول موقعك حالياً</p>
          </div>

          <div className="relative w-44 h-44 mx-auto my-6 flex items-center justify-center">
            <div className="absolute w-full h-full rounded-full bg-[#0f5132] opacity-10 animate-ping"></div>
            <div className="absolute w-32 h-32 rounded-full bg-[#0f5132] opacity-20 animate-pulse"></div>
            <div className="relative w-16 h-16 rounded-full bg-[#0f5132] text-white flex items-center justify-center shadow-xl font-bold border-2 border-white text-xl">
              📍
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 mb-2 border-b pb-2 text-right">
              الفنيين المتواجدين في النطاق حالياً ({craftsmen.length})
            </h3>

            {error && (
              <div className="bg-red-50 text-red-700 p-3 text-xs rounded-xl text-center font-medium">
                {error}
              </div>
            )}

            {loading && !error && (
              <p className="text-center text-gray-400 text-xs py-4">جاري تشغيل الرادار الجغرافي...</p>
            )}

            {!loading && craftsmen.length === 0 && !error && (
              <div className="text-center py-6 text-amber-700 bg-amber-50/50 rounded-xl font-medium text-xs border border-amber-100/50">
                لم نجد فنيين متاحين في محيطك حالياً، الرادار مستمر في المسح تلقائياً...
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => router.push('/requests/new')}
            className="mt-6 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100/70 px-4 py-2.5 rounded-full transition-colors mx-auto"
          >
            إلغاء الطلب والعودة
          </button>
        </main>
      )}

      {/* ===================== حالة 2: انتهت مهلة البحث ومفيش نتائج ===================== */}
      {searchTimedOut && (
        <main className="max-w-md w-full mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-2xl">
              ⏱
            </div>
            <h2 className="text-xl font-extrabold text-gray-900">لم نجد فنيين متاحين حالياً</h2>
            <p className="text-sm text-gray-500">
              حاولنا البحث لمدة دقيقة كاملة، يمكنك إعادة المحاولة الآن أو تعديل تفاصيل طلبك.
            </p>

            <div className="flex flex-col gap-3 pt-2">
              <button
                type="button"
                onClick={handleRetry}
                className="bg-[#0f5132] text-white text-sm font-bold py-3 rounded-full hover:bg-[#0c3f27] transition-colors"
              >
                إعادة المحاولة
              </button>
              <button
                type="button"
                onClick={() => router.push('/requests/new')}
                className="text-sm font-medium text-gray-600 py-3 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                تعديل الطلب والعودة
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ===================== حالة 3: لقينا فنيين - شاشة درجة المطابقة ===================== */}
      {showMatchingScreen && topMatch && (
        <main className="max-w-6xl w-full mx-auto px-6 py-10 flex-1">
          {error && (
            <div className="bg-red-50 border-r-4 border-red-400 p-4 text-sm text-red-700 rounded mb-6">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-6">
            {/* الكارد الأيسر: درجة المطابقة بالتفصيل */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-extrabold text-gray-900 mb-1">درجة المطابقة</h2>
                <p className="text-sm text-gray-500">
                  بناءً على متطلباتك، يعتبر {topMatch.name} خياراً ممتازاً لهذه المهمة.
                </p>
              </div>

              <div className="relative w-44 h-44 mx-auto">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                  <circle
                    cx="50" cy="50" r="42" fill="none" stroke="#0f5132" strokeWidth="10"
                    strokeDasharray={`${(topMatch.matchScore / 100) * 263.9} 263.9`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-[#0f5132]">{topMatch.matchScore}%</span>
                  <span className="text-xs text-gray-500">تطابق</span>
                </div>
              </div>

              <div className="space-y-4">
                <ScoreBar
                  label="مطابقة المسافة"
                  weight={40}
                  valueLabel={`ممتاز (${topMatch.distanceKm} كم)`}
                  percent={Math.max(0, 100 - topMatch.distanceKm * 10)}
                />
                <ScoreBar
                  label="جودة التقييم"
                  weight={30}
                  valueLabel={`فئة متميزة (${topMatch.rating})`}
                  percent={(topMatch.rating / 5) * 100}
                />
                <ScoreBar
                  label="سرعة الاستجابة"
                  weight={20}
                  valueLabel={`سريع (وصول خلال ${topMatch.responseTimeMinutes} د)`}
                  percent={Math.max(0, 100 - topMatch.responseTimeMinutes)}
                />
                <ScoreBar
                  label="التاريخ السابق"
                  weight={10}
                  valueLabel="محترف جديد"
                  percent={30}
                />
              </div>
            </div>

            {/* الكارد الأيمن: قائمة الفنيين */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">تم العثور على {craftsmen.length} نتائج</h3>
                <span className="text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">الأفضل مطابقة</span>
              </div>

              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {[...enrichedCraftsmen]
                  .sort((a, b) => b.matchScore - a.matchScore)
                  .map((c) => (
                    <div key={c._id} className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1 text-sm font-bold text-gray-900">
                          {c.rating} <span className="text-amber-400">★</span>
                        </div>
                        <div className="text-right">
                          <h4 className="font-bold text-gray-900">{c.name}</h4>
                          {c.isVerified && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full mt-1">
                              محترف معتمد ✓
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 justify-end">
                        <span>{c.distanceKm} كم 📍</span>
                        <span>{c.responseTimeMinutes} دقيقة ⏱</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectCraftsman(c._id)}
                        disabled={selectingId !== ''}
                        className="w-full bg-[#0f5132] text-white text-sm font-bold py-2.5 rounded-full hover:bg-[#0c3f27] disabled:bg-gray-300 transition-colors"
                      >
                        {selectingId === c._id ? 'جاري الإرسال...' : 'اختيار المحترف'}
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => router.push('/requests/new')}
              className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100/70 px-4 py-2.5 rounded-full transition-colors"
            >
              إلغاء الطلب والعودة
            </button>
          </div>
        </main>
      )}

      {/* الفوتر */}
      <footer className="bg-gray-900 text-gray-300 py-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <span className="text-[#22c55e] font-bold text-base">صنعة</span>
          <span className="text-gray-500">© ٢٠٢٦ صنعة لخدمات المنازل الذكية. جميع الحقوق محفوظة.</span>
        </div>
      </footer>
    </div>
  );
}

function ScoreBar({
  label,
  weight,
  valueLabel,
  percent,
}: {
  label: string;
  weight: number;
  valueLabel: string;
  percent: number;
}) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="text-gray-500">{valueLabel}</span>
        <span className="font-medium text-gray-800">{label} ({weight}%)</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#0f5132] rounded-full"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
