'use client';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';

const SERVICES = [
  { name: 'الدهانات', icon: '🎨', desc: 'دهان الجدران والأسطح الداخلية والخارجية' },
  { name: 'النجارة', icon: '🔨', desc: 'تصنيع وتركيب وإصلاح الأثاث والديكور' },
  { name: 'الكهرباء', icon: '⚡', desc: 'تمديدات وصيانة وإصلاح الأعطال الكهربائية' },
  { name: 'السباكة', icon: '🪠', desc: 'تصليح وتركيب المواسير والخلاطات' },
  { name: 'الصيانة العامة', icon: '🛠️', desc: 'إصلاحات منزلية شاملة وصيانة عامة' },
  { name: 'فتح الأقفال', icon: '🔑', desc: 'فتح الأقفال المكسورة وتركيب كوالين جديدة' },
  { name: 'التنظيف', icon: '🧹', desc: 'خدمات تنظيف المنازل والمكاتب والتعقيم' },
  { name: 'التكييف', icon: '❄️', desc: 'تركيب وصيانة وتنظيف المكيفات' },
];

const TRUST_BADGES = [
  { label: 'ضمان الرضا', icon: '✓' },
  { label: 'دعم 24/7', icon: '🎧' },
  { label: 'دفع آمن', icon: '💳' },
  { label: 'فحص السجل الجنائي', icon: '🛡️' },
];

const STATS = [
  { value: '4.9/5', label: 'متوسط التقييم' },
  { value: '+10K', label: 'محترف معتمد' },
  { value: '+5K', label: 'خدمة منجزة' },
  { value: '30s', label: 'متوسط وقت التطابق' },
];

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="bg-[#dbeee0] h-full rounded-2xl flex items-center justify-center text-gray-500 text-sm">
      جاري تحميل الخريطة...
    </div>
  ),
});

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Navbar />

      {/* الهيرو */}
      <section className="relative overflow-hidden bg-gradient-to-l from-[#0a2e1f] via-[#0d3d28] to-[#0f5132]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* النص */}
            <div className="text-right order-2 md:order-1">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs text-white/80 mb-6">
                <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                منصة الخدمات المنزلية الأولى في مصر
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-[1.1] tracking-tight mb-6">
                حرفيون موثوقون<br />
                عند باب منزلك
              </h1>
              <p className="text-sm sm:text-base text-gray-300 font-light leading-[1.9] mb-8 max-w-lg">
                تواصل مع محترفي خدمات معتمدين وحاصلين على تقييمات عالية لجميع احتياجات صيانة وتحسين منزلك. سريع، موثوق، ومضمون.
              </p>

              <div className="flex flex-row-reverse justify-end flex-wrap gap-3 mb-12">
                <Link
                  href="/requests/new"
                  className="flex items-center gap-2 bg-[#22c55e] hover:bg-[#16a34a] text-[#0a2e1f] font-bold text-sm px-6 py-3 rounded-full transition-all shadow-lg shadow-[#22c55e]/20"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  احجز خدمة الآن
                </Link>
                <Link
                  href="/register?role=craftsman"
                  className="flex items-center gap-2 border border-white/30 text-white font-bold text-sm px-6 py-3 rounded-full hover:bg-white/10 transition-all"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="19" y1="8" x2="19" y2="14" />
                    <line x1="22" y1="11" x2="16" y2="11" />
                  </svg>
                  انضم كحرفي
                </Link>
              </div>

              {/* الإحصائيات */}
              <div className="grid grid-cols-4 gap-4 border-t border-white/15 pt-6">
                {STATS.map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-lg sm:text-xl font-display text-white tracking-tight leading-none">{s.value}</p>
                    <p className="text-[10px] sm:text-xs text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* الخريطة */}
            <div className="relative rounded-2xl overflow-hidden order-1 md:order-2 h-72 sm:h-96 shadow-2xl">
              <Map />
              <div className="absolute bottom-3 right-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-sm p-3 flex items-center gap-3 z-[1000]">
                <div className="w-9 h-9 rounded-full bg-[#eef6ef] text-[#0f5132] flex items-center justify-center text-base shrink-0">
                  🛡️
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">موثق <span className="font-display">100%</span></p>
                  <p className="text-xs text-gray-500">محترفون مفحوصون أمنياً</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* شريط الثقة */}
      <section className="bg-[#f3f8f4] border-b border-gray-200/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-wrap justify-center gap-x-10 gap-y-3 text-sm text-gray-600">
          {TRUST_BADGES.map((b) => (
            <span key={b.label} className="flex items-center gap-2">
              <span className="text-[#0f5132] font-bold">{b.icon}</span>
              {b.label === 'دعم 24/7' ? (
                <>دعم <span className="font-display">24/7</span></>
              ) : (
                b.label
              )}
            </span>
          ))}
        </div>
      </section>

      {/* شرح المنصة */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4 tracking-tight">كيف تعمل منصة صنعة؟</h2>
            <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto">
              في ثلاث خطوات بسيطة، احصل على أفضل المحترفين لخدمة منزلك
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8 relative">
            {[
              { step: '1', title: 'اختر الخدمة', desc: 'اختر نوع الخدمة التي تحتاجها من قائمة التخصصات المتوفرة على المنصة.', icon: '📋' },
              { step: '2', title: 'حدد موقعك', desc: 'أدخل عنوانك واحصل على اقتراحات فورية لأقرب المحترفين المتاحين.', icon: '📍' },
              { step: '3', title: 'اختر المحترف', desc: 'قارن التقييمات والمسافات واختر الأنسب لك. تأكيد الحجز يتم بنقرة واحدة.', icon: '🤝' },
            ].map((item, i) => (
              <div key={item.step} className="relative bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 text-center hover:shadow-xl hover:-translate-y-1 hover:border-[#0f5132]/30 transition-all duration-300 group">
                {i < 2 && (
                  <div className="hidden sm:block absolute -left-4 top-1/2 -translate-y-1/2 z-10 text-[#0f5132]/20 text-2xl">◀</div>
                )}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#eef6ef] to-[#dbeee0] flex items-center justify-center text-2xl mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0f5132] to-[#0a3822] text-white flex items-center justify-center font-display text-lg mx-auto mb-4 shadow-md">
                  {item.step}
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">{item.title}</h3>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* الخدمات */}
      <section className="bg-[#eef6ef] py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4 tracking-tight">استكشف خدماتنا</h2>
            <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto">
              اعثر على المحترف المناسب لأي مهمة، من الإصلاحات السريعة إلى التجديدات الكبرى
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
            {SERVICES.map((s) => (
              <Link
                key={s.name}
                href={`/requests/new?service=${encodeURIComponent(s.name)}`}
                className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 flex flex-col items-center gap-3 hover:border-[#0f5132]/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-[#0f5132] to-[#22c55e] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#f3f8f4] to-[#eef6ef] group-hover:from-[#eef6ef] group-hover:to-[#dbeee0] flex items-center justify-center text-2xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-md">
                  {s.icon}
                </div>
                <span className="font-bold text-gray-900 text-sm group-hover:text-[#0f5132] transition-colors duration-300">{s.name}</span>
                <span className="text-[10px] text-gray-400 text-center leading-relaxed hidden sm:block">{s.desc}</span>
                <div className="flex items-center gap-1 text-[10px] text-[#0f5132] font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                  <span>اطلب الخدمة</span>
                  <span>←</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-l from-[#0f5132] to-[#0a3822] rounded-3xl p-8 sm:p-12 text-center text-white shadow-xl">
            <h2 className="text-2xl sm:text-4xl font-black mb-4 tracking-tight">جاهز لتجربة خدمات احترافية؟</h2>
            <p className="text-sm sm:text-base text-white/70 max-w-lg mx-auto mb-8">
              انضم إلى آلاف العملاء والمحترفين الذين يثقون في منصة صنعة يومياً
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/requests/new"
                className="bg-white text-[#0f5132] font-bold text-sm px-6 py-3 rounded-full hover:bg-gray-50 transition-all shadow-lg"
              >
                ابدأ الآن
              </Link>
              <Link
                href="/register?role=craftsman"
                className="border border-white/40 text-white font-bold text-sm px-6 py-3 rounded-full hover:bg-white/10 transition-all"
              >
                انضم كحرفي
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* الفوتر */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-3 gap-8 pb-8 border-b border-gray-800">
            <div className="text-right">
              <h3 className="text-[#22c55e] font-black text-xl mb-4 tracking-tight">صنعة</h3>
              <p className="text-xs leading-relaxed max-w-xs">
                المنصة الأكثر موثوقية لخدمات المنازل الذكية في العالم العربي. نوصلّك بأفضل المحترفين المحليين الموثوقين.
              </p>
            </div>
            <div className="text-right">
              <h4 className="text-white font-bold mb-3 text-sm">روابط سريعة</h4>
              <div className="space-y-2 text-xs">
                <Link href="/requests/new" className="block hover:text-white transition-colors">طلب خدمة</Link>
                <Link href="/professionals" className="block hover:text-white transition-colors">المحترفون</Link>
                <Link href="/help" className="block hover:text-white transition-colors">المساعدة</Link>
              </div>
            </div>
            <div className="text-right">
              <h4 className="text-white font-bold mb-3 text-sm">الدعم</h4>
              <div className="space-y-2 text-xs">
                <a href="mailto:support@san3a.com" className="block hover:text-white transition-colors font-display tracking-wide">support@san3a.com</a>
                <a href="#" className="block hover:text-white transition-colors font-display tracking-wide">+20 100 000 0000</a>
                <a href="#" className="block hover:text-white transition-colors">شروط الخدمة</a>
                <a href="#" className="block hover:text-white transition-colors">سياسة الخصوصية</a>
              </div>
            </div>
          </div>
          <div className="text-center text-xs pt-6">
            © <span className="font-display">2026</span> صنعة لخدمات المنازل الذكية. جميع الحقوق محفوظة.
          </div>
        </div>
      </footer>
    </div>
  );
}
