import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast"; // 1) استيراد الـ Toaster

export const metadata: Metadata = {
  title: "منصة صنعة 🛠️",
  description: "المنصة الأكثر موثوقية لخدمات المنازل الذكية الاحترافية",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased">
        {/* 2) لازم تحط الـ Toaster هنا فوق الـ children */}
        <Toaster position="top-center" reverseOrder={false} />
        {children}
      </body>
    </html>
  );
}