'use client';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

const faqs = [
  {
    q: 'كيف يمكنني طلب خدمة؟',
    a: 'تسجيل الدخول إلى حسابك، اضغط على "طلب خدمة"، اختر الخدمة المناسبة، حدد موقعك، ثم انتظر حتى نجد لك أفضل المحترفين المتاحين.',
  },
  {
    q: 'كم من الوقت يستغرق العثور على فني؟',
    a: 'عادةً ما نجد فنيين متاحين في غضون ثوانٍ. في حال عدم وجود فنيين قريبين، يمكنك توسيع نطاق البحث.',
  },
  {
    q: 'كيف يتم حساب تكلفة الخدمة؟',
    a: 'يتم الاتفاق على التكلفة مباشرة مع الفني بعد قبول الطلب. نحن نوفر لك قائمة بالمحترفين مع تقييماتهم لتختار الأنسب.',
  },
  {
    q: 'هل يمكنني إلغاء طلب بعد إرساله؟',
    a: 'نعم، يمكنك إلغاء الطلب من صفحة المتابعة قبل أن يؤكده أي فني.',
  },
  {
    q: 'كيف يتم اختيار الفني المناسب؟',
    a: 'يتم اقتراح المحترفين بناءً على عدة عوامل: المسافة من موقعك، التقييم، سرعة الاستجابة، والتعاملات السابقة مع العملاء.',
  },
  {
    q: 'هل المحترفون موثوقون؟',
    a: 'جميع المحترفين المسجلين في منصتنا يخضعون للتحقق من الهوية ولديهم سجل من التقييمات من عملاء سابقين.',
  },
  {
    q: 'ماذا لو لم أكن راضياً عن الخدمة؟',
    a: 'نشجعك على التواصل مع دعم العملاء لدينا. يمكنك أيضاً تقديم تقييمك للفني ليساعد الآخرين في اتخاذ القرار.',
  },
  {
    q: 'هل يمكنني أن أصبح فني على المنصة؟',
    a: 'بالتأكيد! سجل كحرفي من صفحة إنشاء الحساب، واملأ بياناتك، وابدأ في استقبال طلبات الخدمات القريبة منك.',
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0f7f2] to-[#e8f1eb]" dir="rtl">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0f5132]/10 mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0f5132" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3 tracking-tight">المساعدة والدعم</h1>
          <p className="text-gray-500 text-sm sm:text-base max-w-lg mx-auto">
            إجابات لأكثر الأسئلة شيوعاً حول منصة صنعة. لم تجد ما تبحث عنه؟ تواصل معنا مباشرة.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <details
              key={idx}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm shadow-gray-200/30 open:shadow-md open:border-[#0f5132]/20 transition-all"
            >
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none text-sm font-bold text-gray-900 hover:text-[#0f5132] transition-colors">
                {faq.q}
                <svg className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </summary>
              <div className="px-5 pb-4 text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
                {faq.a}
              </div>
            </details>
          ))}
        </div>

        <div className="mt-10 text-center bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-2">لم تجد إجابة لسؤالك؟</h2>
          <p className="text-sm text-gray-500 mb-4">فريق الدعم لدينا جاهز لمساعدتك على مدار الساعة</p>
          <a
            href="mailto:support@san3a.com"
            className="inline-flex items-center gap-2 bg-[#0f5132] text-white text-sm font-bold px-6 py-3 rounded-2xl hover:bg-[#0c3f27] transition-all shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            تواصل مع الدعم
          </a>
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
