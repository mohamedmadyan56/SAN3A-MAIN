'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import axios from 'axios';

interface Professional {
  _id: string;
  name: string;
  rating: number;
  avgResponseTimeSeconds: number | null;
  avatar?: string;
  location?: { address?: string };
}

function formatResponseTime(seconds: number | null): string {
  if (seconds === null) return 'جديد';
  if (seconds < 60) return `${Math.round(seconds)} ث`;
  return `${Math.round(seconds / 60)} د`;
}

const specializations = [
  { name: 'السباكة', icon: '🪠', desc: 'تصليح وتركيب المواسير والخلاطات والشفاطات' },
  { name: 'الكهرباء', icon: '⚡', desc: 'تمديدات وصيانة وإصلاح الأعطال الكهربائية' },
  { name: 'التكييف', icon: '❄️', desc: 'تركيب وصيانة وتنظيف المكيفات' },
  { name: 'النجارة', icon: '🔨', desc: 'تصنيع وتركيب وإصلاح الأثاث والديكور' },
  { name: 'الدهانات', icon: '🎨', desc: 'دهان الجدران والأسطح الداخلية والخارجية' },
  { name: 'التنظيف', icon: '🧹', desc: 'خدمات تنظيف المنازل والمكاتب والتعقيم' },
];

export default function ProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfessionals = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/v1/services');
        if (res.data.status === 'success') {
          const services = res.data.data.services;
          const dummy = services.slice(0, 4).map((s: any, i: number) => ({
            _id: s._id || String(i),
            name: ['أحمد السيد', 'مصطفى محمود', 'كريم حسن', 'محمد علي'][i],
            rating: [4.9, 4.8, 4.7, 4.9][i],
            avgResponseTimeSeconds: [45, 120, 30, 90][i],
            location: { address: ['القاهرة', 'الجيزة', 'القاهرة', 'الإسكندرية'][i] },
          }));
          setProfessionals(dummy);
        }
      } catch { setProfessionals([]); }
      finally { setLoading(false); }
    };
    fetchProfessionals();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0f7f2] to-[#e8f1eb]" dir="rtl">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* العنوان */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0f5132]/10 mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0f5132" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3 tracking-tight">محترفونا المعتمدون</h1>
          <p className="text-gray-500 text-sm sm:text-base max-w-2xl mx-auto">
            نخبة من المحترفين الموثوقين والمفحوصين. جميعهم حاصلون على تقييمات عالية من عملاء سابقين.
          </p>
        </div>

        {/* التخصصات */}
        <div className="mb-16">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-right">التخصصات المتوفرة</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {specializations.map((spec) => (
              <Link
                key={spec.name}
                href={`/requests/new?service=${encodeURIComponent(spec.name)}`}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center hover:border-[#0f5132]/30 hover:shadow-md transition-all"
              >
                <div className="text-3xl mb-3">{spec.icon}</div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{spec.name}</h3>
                <p className="text-[10px] text-gray-400 leading-relaxed">{spec.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* قائمة المحترفين */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#0f5132]" />
              <h2 className="text-xl font-bold text-gray-900">أفضل المحترفين</h2>
            </div>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                  <div className="w-16 h-16 bg-gray-200 rounded-2xl mx-auto mb-4" />
                  <div className="h-4 w-24 bg-gray-200 rounded-full mx-auto mb-2" />
                  <div className="h-3 w-16 bg-gray-200 rounded-full mx-auto" />
                </div>
              ))}
            </div>
          ) : professionals.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
              <p className="text-gray-400">لا يوجد محترفون بعد</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {professionals.map((p) => (
                <div key={p._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center hover:shadow-md hover:border-[#0f5132]/20 transition-all">
                  <div className="w-16 h-16 rounded-2xl bg-[#eef6ef] flex items-center justify-center text-2xl mx-auto mb-4 shadow-sm">
                    👨‍🔧
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{p.name}</h3>
                  <div className="flex items-center justify-center gap-3 text-xs text-gray-500 mb-3">
                    <span className="text-amber-600 font-bold">⭐ {p.rating.toFixed(1)}</span>
                    <span>استجابة: {formatResponseTime(p.avgResponseTimeSeconds)}</span>
                  </div>
                  <Link
                    href="/requests/new"
                    className="inline-block w-full text-xs font-bold text-[#0f5132] border-2 border-[#0f5132] py-2 rounded-xl hover:bg-[#0f5132] hover:text-white transition-all"
                  >
                    طلب الخدمة
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-l from-[#0f5132] to-[#0a3822] rounded-3xl p-8 sm:p-10 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-black mb-3 tracking-tight">انضم كحرفي محترف</h2>
          <p className="text-sm text-white/70 max-w-lg mx-auto mb-6">
            سجل الآن وابدأ في استقبال طلبات الخدمات من العملاء القريبين منك. المنصة الأسرع نمواً في العالم العربي.
          </p>
          <Link
            href="/register?role=craftsman"
            className="inline-flex items-center gap-2 bg-white text-[#0f5132] text-sm font-bold px-6 py-3 rounded-2xl hover:bg-gray-50 transition-all shadow-lg"
          >
            إنشاء حساب حرفي
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
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
