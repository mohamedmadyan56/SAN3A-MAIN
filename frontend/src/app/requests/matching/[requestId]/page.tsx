'use client';
import { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import { API_BASE, extractTextContent, getAuthHeaders } from '@/lib/api';

interface Craftsman {
  _id: string;
  name: string;
  phone: string;
  avatar?: string;
  rating?: number;
  distance?: number;
}

interface MatchingPageProps {
  params: Promise<{ requestId: string }>;
}

const TIMEOUT_THRESHOLD = 60;
const POLL_INTERVAL_MS = 4000;
const AUTO_REDIRECT_SECONDS = 15;

export default function MatchingPage({ params }: MatchingPageProps) {
  const { requestId } = use(params);
  const router = useRouter();

  const [craftsmen, setCraftsmen] = useState<Craftsman[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [searchRadiusExpanded, setSearchRadiusExpanded] = useState<boolean>(false);
  const [navigatingResults, setNavigatingResults] = useState<boolean>(false);

  const knownIdsRef = useRef<Set<string>>(new Set());
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchNearbyCraftsmen = async () => {
      try {
        if (!localStorage.getItem('token') && !localStorage.getItem('user_token')) {
          setError('لم يتم العثور على توكن تسجيل الدخول');
          return;
        }

        const response = await axios.get(
          `${API_BASE}/requests/${requestId}/nearby-craftsmen`,
          {
            headers: getAuthHeaders(),
            params: searchRadiusExpanded ? { radius: 10000 } : undefined,
          }
        );

        if (response.data.status === 'success') {
          const fetched: Craftsman[] = response.data.data.craftsmen;
          const freshIds = new Set<string>();
          fetched.forEach((c) => {
            if (!knownIdsRef.current.has(c._id)) {
              freshIds.add(c._id);
              knownIdsRef.current.add(c._id);
            }
          });
          setNewIds(freshIds);
          setCraftsmen(fetched);
          setError('');
        }
      } catch (err: unknown) {
        console.error('خطأ أثناء تحديث الرادار:', err);
        setError(extractTextContent(err, 'تعذر تحديث نتائج الرادار'));
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyCraftsmen();
    const interval = setInterval(fetchNearbyCraftsmen, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [requestId, searchRadiusExpanded]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (elapsedSeconds >= AUTO_REDIRECT_SECONDS && craftsmen.length > 0) {
      router.push(`/requests/matching/${requestId}/results`);
    }
  }, [elapsedSeconds, craftsmen.length, requestId, router]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSelectCraftsman = (craftsman: Craftsman) => {
    setSelectedId(craftsman._id);
  };

  const goToResults = () => {
    setNavigatingResults(true);
    router.push(`/requests/matching/${requestId}/results`);
  };

  const showTimeoutNotice = elapsedSeconds >= TIMEOUT_THRESHOLD && !searchRadiusExpanded;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0f7f2] to-[#e8f1eb]" dir="rtl">
      <Navbar />

      {/* المحتوى الرئيسي */}
      <main className="max-w-lg mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* العنوان والرادار */}
        <div className="bg-white rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 sm:p-8 mb-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#0f5132]/10 mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f5132" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2 tracking-tight">جاري البحث عن فني</h2>
            <p className="text-sm text-gray-500">
              نبحث في محيط {searchRadiusExpanded ? '١٠' : '٥'} كم عن أفضل المحترفين
            </p>
          </div>

          {/* الرادار والعداد */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-52 h-52 flex items-center justify-center mb-4">
              {/* خلفية سوداء للرادار */}
              <div className="absolute w-full h-full rounded-full bg-[#0a0a0a]" />
              <div className="absolute w-full h-full rounded-full bg-gradient-to-b from-transparent via-[#1a0505]/30 to-transparent" />

              {/* الحلقات الثابتة */}
              <div className="absolute w-full h-full rounded-full border border-[#dc2626]/20" />
              <div className="absolute w-[85%] h-[85%] rounded-full border border-[#dc2626]/25" />
              <div className="absolute w-[70%] h-[70%] rounded-full border border-[#dc2626]/30" />
              <div className="absolute w-[55%] h-[55%] rounded-full border border-[#dc2626]/35" />
              <div className="absolute w-[40%] h-[40%] rounded-full border border-[#dc2626]/40" />

              {/* خطوط توجيه (十字) */}
              <div className="absolute w-full h-[1px] bg-[#dc2626]/10 top-1/2" />
              <div className="absolute h-full w-[1px] bg-[#dc2626]/10 left-1/2" />
              <div className="absolute w-[1px] h-full bg-[#dc2626]/10 left-1/4" style={{ transform: 'rotate(30deg)', transformOrigin: 'center' }} />
              <div className="absolute w-[1px] h-full bg-[#dc2626]/10 left-1/4" style={{ transform: 'rotate(-30deg)', transformOrigin: 'center' }} />

              {/* موجات البing - متعددة الطبقات */}
              <div className="absolute w-full h-full rounded-full bg-[#dc2626]/10 animate-[radarPing_2s_ease-out_infinite]" />
              <div className="absolute w-full h-full rounded-full bg-[#dc2626]/8 animate-[radarPing_2s_ease-out_0.6s_infinite]" />
              <div className="absolute w-full h-full rounded-full bg-[#dc2626]/8 animate-[radarPing_2s_ease-out_1.2s_infinite]" />

              {/* خط المسح الدوار */}
              <div className="absolute w-full h-full animate-[radarSpin_2s_linear_infinite]">
                <div className="absolute top-0 left-1/2 w-[2px] h-1/2 bg-gradient-to-b from-[#ef4444]/70 via-[#dc2626]/40 to-transparent origin-bottom rounded-full shadow-[0_0_8px_rgba(239,68,68,0.3)]" />
                <div className="absolute top-1/2 left-1/2 w-1/2 h-[2px] bg-gradient-to-l from-[#ef4444]/40 to-transparent origin-right" />
                <div className="absolute top-0 left-1/2 w-2/5 h-2/5 bg-gradient-to-br from-[#ef4444]/15 via-[#dc2626]/8 to-transparent rounded-full" />
              </div>

              {/* نقط متحركة تمثل الفنيين */}
              {craftsmen.length > 0 && (
                <>
                  <div className="absolute w-3 h-3 bg-[#ef4444] rounded-full shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-[radarBlip_1.5s_ease-in-out_infinite]" style={{ top: '28%', left: '65%' }} />
                  <div className="absolute w-2.5 h-2.5 bg-[#f87171] rounded-full shadow-[0_0_10px_rgba(248,113,113,0.7)] animate-[radarBlip_1.5s_ease-in-out_0.3s_infinite]" style={{ top: '60%', left: '25%' }} />
                  <div className="absolute w-2 h-2 bg-[#ef4444] rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-[radarBlip_1.5s_ease-in-out_0.6s_infinite]" style={{ top: '45%', left: '75%' }} />
                  <div className="absolute w-2.5 h-2.5 bg-[#f87171] rounded-full shadow-[0_0_10px_rgba(248,113,113,0.7)] animate-[radarBlip_1.5s_ease-in-out_0.9s_infinite]" style={{ top: '70%', left: '55%' }} />
                  <div className="absolute w-2 h-2 bg-[#ef4444] rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-[radarBlip_1.5s_ease-in-out_1.2s_infinite]" style={{ top: '35%', left: '35%' }} />
                </>
              )}

              {/* الأيقونة في المنتصف */}
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[#dc2626] to-[#991b1b] text-white flex items-center justify-center shadow-xl shadow-[#dc2626]/40 z-10 border border-[#ef4444]/30">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
            </div>

            {/* العداد */}
            <div className="flex items-center gap-2.5 bg-[#0a0a0a] border border-[#dc2626]/30 shadow-lg shadow-[#dc2626]/10 rounded-2xl px-5 py-2">
              <span className="relative flex w-3 h-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ef4444] opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#dc2626]" />
              </span>
              <span className="text-lg font-mono font-black text-[#ef4444] tracking-[0.2em] drop-shadow-[0_0_4px_rgba(239,68,68,0.3)]">
                {formatTime(elapsedSeconds)}
              </span>
            </div>
          </div>

          {/* رسالة توسيع البحث */}
          {showTimeoutNotice && (
            <div className="bg-amber-50 border border-amber-200/70 rounded-2xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <span className="text-lg">🔍</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-amber-800 mb-2">
                    لم نجد نتائج كافية في محيطك
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchRadiusExpanded(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-full transition-all shadow-sm"
                  >
                    توسيع نطاق البحث إلى ١٠ كم
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* زر عرض النتائج */}
          {craftsmen.length > 0 && (
            <button
              type="button"
              onClick={goToResults}
              disabled={navigatingResults}
              className="w-full bg-gradient-to-l from-[#0f5132] to-[#0a3822] text-white text-sm font-bold py-3 rounded-2xl hover:shadow-lg hover:shadow-[#0f5132]/20 transition-all"
            >
              {navigatingResults ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  جاري عرض النتائج
                </span>
              ) : (
                <>
                  عرض النتائج ({craftsmen.length})
                  <span className="mr-2">←</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* قائمة الفنيين */}
        <div className="bg-white rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
              {craftsmen.length} فني متاح
            </span>
            <h3 className="text-sm font-bold text-gray-900">الفنيون المتاحون</h3>
          </div>

          {error && (
            <div className="bg-red-50/80 border border-red-200 text-red-700 p-3 rounded-2xl text-xs flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-[10px] font-bold shrink-0">!</span>
              {error}
            </div>
          )}

          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                    <div className="space-y-2">
                      <div className="h-3 w-24 bg-gray-200 rounded-full" />
                      <div className="h-2.5 w-16 bg-gray-200 rounded-full" />
                    </div>
                  </div>
                  <div className="h-8 w-16 bg-gray-200 rounded-full" />
                </div>
              ))}
            </div>
          )}

          {!loading && craftsmen.length === 0 && !error && (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-3">
                <span className="text-lg">⏳</span>
              </div>
              <p className="text-sm text-amber-700 font-medium">لم نجد فنيين متاحين بعد</p>
              <p className="text-xs text-gray-400 mt-1">جاري مواصلة البحث تلقائياً...</p>
            </div>
          )}

          <div className="space-y-2.5 max-h-80 overflow-y-auto">
            {craftsmen.map((craftsman) => {
              const isNew = newIds.has(craftsman._id);
              const isSelected = selectedId === craftsman._id;
              const distanceKm = typeof craftsman.distance === 'number' ? (craftsman.distance / 1000).toFixed(1) : null;
              const rating = craftsman.rating ?? 4.5;

              return (
                <div
                  key={craftsman._id}
                  className={`min-h-[72px] flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200 ${
                    isSelected
                      ? 'border-[#0f5132] bg-[#eef6ef]'
                      : 'border-transparent bg-gray-50 hover:bg-white hover:border-gray-200 hover:shadow-sm'
                  } ${isNew ? 'animate-[slideIn_0.4s_ease-out]' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shadow-sm ${
                      isSelected ? 'bg-white' : 'bg-white'
                    }`}>
                      👨‍🔧
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{craftsman.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-amber-600 font-bold">⭐ {rating.toFixed(1)}</span>
                        {distanceKm && (
                          <span className="text-xs text-gray-400">{distanceKm} كم</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectCraftsman(craftsman)}
                    className={`text-xs font-bold px-4 py-2 rounded-full transition-all ${
                      isSelected
                        ? 'bg-[#0f5132] text-white shadow-sm'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-[#0f5132] hover:text-[#0f5132]'
                    }`}
                  >
                    {isSelected ? 'تم ✓' : 'اختيار'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* إلغاء الطلب */}
        <button
          type="button"
          onClick={() => router.push('/requests/new')}
          className="mt-6 text-xs font-medium text-gray-400 hover:text-red-500 transition-colors mx-auto block"
        >
          إلغاء الطلب والعودة
        </button>
      </main>

      {/* الفوتر */}
      <footer className="bg-white border-t border-gray-100 mt-8">
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

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes radarPing {
          0% { transform: scale(0.3); opacity: 1; }
          100% { transform: scale(1.3); opacity: 0; }
        }
        @keyframes radarSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes radarBlip {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.6); }
        }
      `}</style>
    </div>
  );
}
