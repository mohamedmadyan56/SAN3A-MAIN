"use client";
import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

// تعريف الـ Interface للخدمة القادمة من الباك إند
interface IService {
  _id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  icon?: string;
}

type TimingOption = "NOW" | "SCHEDULE";

// الـ Component الخاص بالأيقونات بناءً على الـ slug الراجع من الداتا بيز
function ServiceIcon({ name, active }: { name: string; active: boolean }) {
  const stroke = active ? "#0f5132" : "#374151";
  const common = {
    width: 28,
    height: 28,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  // المقارنة هنا بالـ slug الراجع من الباك إند
  switch (name) {
    case "cleaning":
      return (
        <svg {...common}>
          <path d="M19 3 9 13" />
          <path d="M14 4l6 6" />
          <path d="M9 13l-6 7 4 1 2-3" />
          <path d="M5 18l3 2" />
        </svg>
      );
    case "air-conditioning":
    case "ac":
      return (
        <svg {...common}>
          <path d="M12 2v20" />
          <path d="M4 7l16 10" />
          <path d="M20 7 4 17" />
        </svg>
      );
    case "electricity":
    case "electric":
      return (
        <svg {...common}>
          <path d="M9 7V3M15 7V3" />
          <path d="M6 7h12v4a6 6 0 0 1-12 0V7z" />
          <path d="M9 17v2a3 3 0 0 0 6 0v-2" />
        </svg>
      );
    case "plumbing":
    default:
      return (
        <svg {...common}>
          <path d="M21 7.5 16.5 12l-2-2L19 5.5a5 5 0 0 0-6.5 6.5L3 21l1.5 1.5L15 13a5 5 0 0 0 6-5.5z" />
        </svg>
      );
  }
}

const arabicStepNumber = (n: number) => ["١", "٢", "٣"][n - 1] ?? String(n);

export default function NewRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // الـ States الديناميكية
  const [services, setServices] = useState<IService[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [address, setAddress] = useState<string>("جاري جلب موقعك الحالي...");
  const [clientNotes, setClientNotes] = useState<string>("");
  const [timing, setTiming] = useState<TimingOption>("NOW");

  // 1️⃣ جلب الخدمات الحقيقية من الباك إند عند فتح الصفحة
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/v1/services",
        );
        if (response.data.status === "success") {
          const fetchedServices = response.data.data.services;
          setServices(fetchedServices);

          // تحديد أول خدمة تلقائياً كخيار افتراضي أول ما الداتا تيجي
          if (fetchedServices.length > 0) {
            setSelectedServiceId(fetchedServices[0]._id);
          }
        }
      } catch (err: any) {
        setError("فشل في تحميل الخدمات من السيرفر، تأكد من تشغيل الباك إند");
      }
    };

    // 2️⃣ جلب عنوان وموقع العميل الحالي الافتراضي المسجل في الـ Profile
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await axios.get(
          "http://localhost:5000/api/v1/users/profile",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.data.data?.user?.location?.address) {
          setAddress(response.data.data.user.location.address);
        } else {
          setAddress("القاهرة، وسط البلد");
        }
      } catch (err) {
        setAddress("القاهرة، وسط البلد");
      }
    };

    fetchServices();
    fetchUserProfile();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedServiceId) {
      setError("يرجى اختيار الخدمة المطلوبة أولاً");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        "http://localhost:5000/api/v1/requests",
        {
          service: selectedServiceId,
          address,
          coordinates: [31.2358, 30.0445],
          clientNotes,
          paymentMethod: "CASH",
          scheduling: timing,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.status === "success") {
        router.push(`/requests/matching/${response.data.data.request._id}`);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "فشل في إنشاء الطلب، يرجى المحاولة مرة أخرى",
      );
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, label: "تفاصيل الخدمة" },
    { number: 2, label: "الوصف" },
    { number: 3, label: "المراجعة" },
  ];

  return (
    <div className="min-h-screen bg-[#eef6ef]" dir="rtl">
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
            <a href="#" className="hover:text-gray-900">
              البحث عن خدمات
            </a>
            <a href="#" className="hover:text-gray-900">
              حجوزاتي
            </a>
            <a href="#" className="hover:text-gray-900">
              محترفون معتمدون
            </a>
            <a href="#" className="hover:text-gray-900">
              المساعدة
            </a>
          </nav>

          <button
            type="button"
            className="bg-gray-900 text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-black transition-colors"
          >
            لوحة التحكم
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* العنوان */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">
            طلب خدمة
          </h1>
          <p className="text-gray-500 font-light leading-relaxed">
            أخبرنا بما تحتاجه، وسنجد لك المحترف المناسب للمهمة.
          </p>
        </div>

        {/* الستيبر */}
        <div className="flex items-center justify-between mb-8 px-2">
          {steps.map((step, idx) => {
            const isActive = step.number === 1;
            return (
              <div
                key={step.number}
                className="flex items-center flex-1 last:flex-none"
              >
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                      isActive
                        ? "bg-[#0f5132] text-white"
                        : "bg-white border border-gray-300 text-gray-500"
                    }`}
                  >
                    {arabicStepNumber(step.number)}
                  </div>
                  <span
                    className={`text-sm whitespace-nowrap ${isActive ? "text-gray-900 font-medium" : "text-gray-400"}`}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-[2px] mx-3 mb-6 ${idx === 0 ? "bg-[#0f5132]" : "bg-gray-200"}`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* الفورم */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-8">
            {error && (
              <div className="bg-red-50 border-r-4 border-red-400 p-4 text-sm text-red-700 rounded">
                {error}
              </div>
            )}

            {/* اختيار نوع الخدمة - الـ Grid المرن المعدل */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-right">
                بماذا تحتاج للمساعدة؟
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 justify-center">
                {services.map((service) => {
                  const active = selectedServiceId === service._id;
                  return (
                    <button
                      key={service._id}
                      type="button"
                      onClick={() => setSelectedServiceId(service._id)}
                      className={`relative flex flex-col items-center justify-center gap-3 py-6 px-4 rounded-2xl border-2 transition-all duration-200 min-w-[140px] ${
                        active
                          ? "border-[#0f5132] bg-[#eef6ef] shadow-sm scale-[1.02]"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                      }`}
                    >
                      {active && (
                        <span className="absolute top-2 left-2 w-5 h-5 rounded-full bg-[#0f5132] flex items-center justify-center text-white text-[10px] font-bold">
                          ✓
                        </span>
                      )}
                      <ServiceIcon name={service.slug} active={active} />
                      <span
                        className={`text-sm font-medium leading-relaxed ${active ? "text-[#0f5132]" : "text-gray-700"}`}
                      >
                        {service.nameAr}
                      </span>
                    </button>
                  );
                })}
              </div>
              {services.length === 0 && !error && (
                <p className="text-center text-gray-400 text-sm py-4">
                  جاري تحميل الخدمات من الكتالوج...
                </p>
              )}
            </div>

            {/* موقع الخدمة */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3 text-right">
                موقع الخدمة
              </label>
              <div className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 bg-white">
                <div className="flex items-center gap-2 text-gray-800">
                  <span>📍</span>
                  <span>{address}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = prompt("عدّل العنوان", address);
                    if (next) setAddress(next);
                  }}
                  className="text-[#0f5132] text-sm font-medium hover:underline"
                >
                  تعديل
                </button>
              </div>
            </div>

            {/* ملاحظات العميل */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2 text-right">
                ملاحظاتك للفني
              </label>
              <textarea
                rows={3}
                placeholder="اكتب هنا إيه المشكلة بالظبط (مثلاً: تسريب مياه في المطبخ)"
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0f5132]/30 focus:border-[#0f5132] text-gray-900 text-sm"
              />
            </div>

            {/* متى تحتاج الخدمة */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3 text-right">
                متى تحتاج الخدمة؟
              </h3>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setTiming("NOW")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
                    timing === "NOW"
                      ? "bg-[#0f5132] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <span>⚡</span>
                  الآن
                </button>
                <button
                  type="button"
                  onClick={() => setTiming("SCHEDULE")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
                    timing === "SCHEDULE"
                      ? "bg-[#0f5132] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <span>📅</span>
                  جدولة
                </button>
              </div>
              {timing === "NOW" && (
                <p className="text-xs text-gray-400 mt-2 text-right">
                  ⓘ قد يتم تطبيق رسوم خدمة طوارئ
                </p>
              )}
            </div>
          </div>

          {/* أزرار التنقل */}
          <div className="flex items-center justify-between mt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-sm font-medium text-gray-600 px-6 py-3 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors order-2"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-[#0f5132] text-white text-sm font-medium px-6 py-3 rounded-full hover:bg-[#0c3f27] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0f5132] disabled:bg-gray-400 transition-colors order-1"
            >
              {loading ? (
                "جاري إرسال الطلب وحساب التكلفة..."
              ) : (
                <>
                  <span>←</span>المتابعة للوصف
                </>
              )}
            </button>
          </div>
        </form>
      </main>

      {/* الفوتر */}
      <footer className="bg-gray-900 text-gray-300 mt-16">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <span className="text-[#22c55e] font-bold text-lg">صنعة</span>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white">
              اتصل بالدعم
            </a>
            <a href="#" className="hover:text-white">
              كن شريكاً
            </a>
            <a href="#" className="hover:text-white">
              شروط الخدمة
            </a>
            <a href="#" className="hover:text-white">
              سياسة الخصوصية
            </a>
          </div>
          <span className="text-gray-500">
            © ٢٠٢٦ صنعة لخدمات المنازل الذكية. جميع الحقوق محفوظة.
          </span>
        </div>
      </footer>
    </div>
  );
}
