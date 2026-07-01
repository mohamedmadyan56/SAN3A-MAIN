'use client';

import { use } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function TrackingPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = use(params);

  return (
    <div className="min-h-screen bg-[#eef6ef]" dir="rtl">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="rounded-2xl border border-gray-100 shadow-sm bg-white p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-[#0f5132] text-white flex items-center justify-center mx-auto mb-4 font-bold">✓</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">تم تأكيد الحجز</h1>
          <p className="text-gray-500 text-sm mb-6">يمكنك متابعة حالة الطلب رقم {requestId} من هنا.</p>
          <Link href="/dashboard/customer" className="inline-flex bg-[#0f5132] text-white rounded-full font-bold hover:bg-[#0c3f27] transition-colors px-6 py-3">
            عرض حجوزاتي
          </Link>
        </div>
      </main>
    </div>
  );
}
