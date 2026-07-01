'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import Header from '@/components/Header';

interface MatchBreakdown {
  distance: number;
  rating: number;
  responseTime: number;
  history: number;
}

interface MatchResult {
  _id: string;
  name: string;
  phone: string;
  avatar?: string;
  rating: number;
  distanceKm: number;
  avgResponseTimeSeconds: number | null;
  completedWithClient: number;
  matchPercentage: number;
  breakdown: MatchBreakdown;
}

interface ResultsPageProps {
  params: Promise<{ requestId: string }>;
}

const BRAND_GREEN = '#0f5132';
const CIRCLE_SIZE = 200;
const CIRCLE_STROKE = 12;
const CIRCLE_RADIUS = (CIRCLE_SIZE - CIRCLE_STROKE) / 2;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

function formatResponseTime(seconds: number | null): string {
  if (seconds === null) return 'فني جديد';
  if (seconds < 60) return `${Math.round(seconds)} ثانية`;
  return `${Math.round(seconds / 60)} دقيقة`;
}

function getMatchColor(percent: number): string {
  if (percent >= 85) return '#0f5132';
  if (percent >= 65) return '#0f5132';
  return '#0f5132';
}

export default function MatchResultsPage({ params }: ResultsPageProps) {
  const { requestId } = use(params);
  const router = useRouter();

  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatchResults = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('لم يتم العثور على توكن تسجيل الدخول');
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `http://localhost:5000/api/v1/requests/${requestId}/match-results`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.status === 'success') {
          setMatches(response.data.data.matches);
        }
      } catch (err: any) {
        console.error('خطأ أثناء جلب نتائج التطابق:', err);
        setError('تعذر تحميل نتائج التطابق، حاول مرة أخرى');
      } finally {
        setLoading(false);
      }
    };

    fetchMatchResults();
  }, [requestId]);

  const handleConfirmSelection = async (craftsman: MatchResult) => {
    setSelectingId(craftsman._id);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/v1/requests/${requestId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConfirmedId(craftsman._id);
    } catch (err: any) {
      console.error('خطأ أثناء تأكيد الاختيار:', err);
      setError('تعذر تأكيد الاختيار، حاول مرة أخرى');
    } finally {
      setSelectingId(null);
    }
  };

  const topMatch = matches[0];
  const restMatches = matches.slice(1);

  const dashOffset = topMatch
    ? CIRCLE_CIRCUMFERENCE - (topMatch.matchPercentage / 100) * CIRCLE_CIRCUMFERENCE
    : CIRCLE_CIRCUMFERENCE;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0f7f2] to-[#e8f1eb]" dir="rtl">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {error && (
          <div className="bg-red-50/80 border border-red-200 text-red-700 p-4 rounded-2xl text-sm flex items-center gap-3 mb-6">
            <span className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-xs font-bold shrink-0">!</span>
            {error}
          </div>
        )}

        {loading && (
          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-6 items-start">
            <div className="bg-white rounded-3xl border border-gray-100 p-8 animate-pulse h-[500px]" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-3xl border border-gray-100 p-5 animate-pulse h-28" />
              ))}
            </div>
          </div>
        )}

        {!loading && !error && matches.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            <p className="text-amber-700 font-bold mb-2">لم نجد نتائج تطابق</p>
            <p className="text-sm text-gray-400 mb-6">لا يوجد فنيون متاحون في نطاق بحثك حالياً</p>
            <button
              type="button"
              onClick={() => router.push(`/requests/matching/${requestId}`)}
              className="bg-[#0f5132] text-white text-sm font-bold px-6 py-3 rounded-2xl hover:bg-[#0c3f27] transition-all shadow-sm"
            >
              العودة للرادار
            </button>
          </div>
        )}

        {!loading && !error && topMatch && (
          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-6 items-start">
            {/* الكارد الرائد */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 sm:p-8">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#0f5132]/10 mb-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f5132" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2 tracking-tight">
                    أفضل تطابق
                  </h2>
                  <p className="text-sm text-gray-500">
                    {topMatch.name} هو الخيار الأمثل لطلبك
                  </p>
                </div>

                {/* دائرة النسبة */}
                <div className="relative mx-auto mb-6" style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}>
                  <svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} className="-rotate-90">
                    <circle
                      cx={CIRCLE_SIZE / 2}
                      cy={CIRCLE_SIZE / 2}
                      r={CIRCLE_RADIUS}
                      fill="none"
                      stroke="#f0f0f0"
                      strokeWidth={CIRCLE_STROKE}
                    />
                    <circle
                      cx={CIRCLE_SIZE / 2}
                      cy={CIRCLE_SIZE / 2}
                      r={CIRCLE_RADIUS}
                      fill="none"
                      stroke={BRAND_GREEN}
                      strokeWidth={CIRCLE_STROKE}
                      strokeDasharray={CIRCLE_CIRCUMFERENCE}
                      strokeDashoffset={dashOffset}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-black text-[#0f5132] tracking-tight">{topMatch.matchPercentage}%</span>
                    <span className="text-sm text-gray-400 font-medium">تطابق</span>
                  </div>
                </div>

                {/* تفاصيل التطابق */}
                <div className="space-y-4">
                  <BreakdownRow
                    label="المسافة"
                    weightLabel="40%"
                    detail={`${topMatch.distanceKm} كم`}
                    score={topMatch.breakdown.distance}
                  />
                  <BreakdownRow
                    label="التقييم"
                    weightLabel="30%"
                    detail={`${topMatch.rating.toFixed(1)} ⭐`}
                    score={topMatch.breakdown.rating}
                  />
                  <BreakdownRow
                    label="سرعة الاستجابة"
                    weightLabel="20%"
                    detail={formatResponseTime(topMatch.avgResponseTimeSeconds)}
                    score={topMatch.breakdown.responseTime}
                  />
                  <BreakdownRow
                    label="التعاملات السابقة"
                    weightLabel="10%"
                    detail={topMatch.completedWithClient > 0 ? `${topMatch.completedWithClient} تعاملات` : 'لا يوجد'}
                    score={topMatch.breakdown.history}
                  />
                </div>
              </div>

              {/* بطاقة الحجز */}
              <div className="bg-white rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6">
                <h3 className="font-black text-gray-900 mb-1 tracking-tight">تأكيد الحجز</h3>
                <p className="text-sm text-gray-500 mb-5">اختر {topMatch.name} لبدء تنفيذ الخدمة</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleConfirmSelection(topMatch)}
                    disabled={selectingId === topMatch._id || confirmedId === topMatch._id}
                    className="flex-1 bg-gradient-to-l from-[#0f5132] to-[#0a3822] text-white text-sm font-bold py-3 rounded-2xl hover:shadow-lg hover:shadow-[#0f5132]/20 transition-all disabled:opacity-50"
                  >
                    {confirmedId === topMatch._id
                      ? '✓ تم الحجز'
                      : selectingId === topMatch._id
                      ? 'جاري التأكيد...'
                      : 'احجز الآن'}
                  </button>
                  <button
                    type="button"
                    className="flex-1 border border-gray-200 text-gray-600 text-sm font-bold py-3 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all"
                  >
                    عرض الملف
                  </button>
                </div>
              </div>
            </div>

            {/* قائمة النتائج */}
            <div className="bg-white rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#0f5132]" />
                  <h3 className="font-bold text-gray-900">{matches.length} نتيجة</h3>
                </div>
                <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1 rounded-full">
                  حسب التطابق
                </span>
              </div>

              <div className="space-y-3">
                {matches.map((m, idx) => {
                  const isTop = m._id === topMatch._id;
                  const isConfirmed = confirmedId === m._id;
                  return (
                    <div
                      key={m._id}
                      className={`rounded-2xl border-2 p-4 transition-all duration-200 ${
                        isTop
                          ? 'border-[#0f5132] bg-[#eef6ef]'
                          : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-400">
                            {idx + 1}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link href={`/profile/${m._id}`} className="font-bold text-gray-900 text-sm hover:text-[#0f5132] transition-colors">{m.name}</Link>
                              {isConfirmed && (
                                <span className="text-[10px] font-bold text-white bg-[#0f5132] px-2 py-0.5 rounded-full">
                                  تم الاختيار
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-amber-600">⭐ {m.rating.toFixed(1)}</span>
                              {m.completedWithClient > 0 && (
                                <span className="text-[10px] text-[#0f5132] font-medium">تعامل سابق</span>
                              )}
                            </div>
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-base shadow-sm border border-gray-100">
                            👨‍🔧
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="bg-white/80 rounded-xl p-2.5 text-center">
                          <p className="text-[10px] text-gray-400 mb-0.5">المسافة</p>
                          <p className="text-xs font-bold text-gray-700">{m.distanceKm} كم</p>
                        </div>
                        <div className="bg-white/80 rounded-xl p-2.5 text-center">
                          <p className="text-[10px] text-gray-400 mb-0.5">الاستجابة</p>
                          <p className="text-xs font-bold text-gray-700">{formatResponseTime(m.avgResponseTimeSeconds)}</p>
                        </div>
                        <div className="bg-white/80 rounded-xl p-2.5 text-center">
                          <p className="text-[10px] text-gray-400 mb-0.5">التطابق</p>
                          <p className="text-xs font-bold text-[#0f5132]">{m.matchPercentage}%</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleConfirmSelection(m)}
                        disabled={selectingId === m._id || isConfirmed}
                        className={`w-full text-xs font-bold py-2.5 rounded-xl transition-all disabled:opacity-50 ${
                          isConfirmed
                            ? 'bg-[#0f5132] text-white'
                            : 'border-2 border-[#0f5132] text-[#0f5132] hover:bg-[#0f5132] hover:text-white'
                        }`}
                      >
                        {isConfirmed ? '✓ تم الاختيار' : selectingId === m._id ? 'جاري...' : 'اختيار'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {!loading && !error && matches.length > 0 && (
          <button
            type="button"
            onClick={() => router.push(`/requests/matching/${requestId}`)}
            className="mt-6 text-xs font-medium text-gray-400 hover:text-[#0f5132] transition-colors mx-auto block"
          >
            ← العودة للرادار وتوسيع البحث
          </button>
        )}
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

function BreakdownRow({
  label,
  weightLabel,
  detail,
  score,
}: {
  label: string;
  weightLabel: string;
  detail: string;
  score: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-400">{detail}</span>
        <span className="text-xs font-bold text-gray-700">
          {label}
          <span className="text-gray-400 font-normal mr-1">({weightLabel})</span>
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-l from-[#0f5132] to-[#0f5132]/70 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
        />
      </div>
    </div>
  );
}
