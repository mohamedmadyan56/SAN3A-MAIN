'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const links = [
  { href: '/requests/new', label: 'البحث عن خدمات' },
  { href: '/dashboard/customer', label: 'حجوزاتي' },
  { href: '/professionals', label: 'محترفون معتمدون' },
  { href: '/help', label: 'المساعدة' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setUserName(localStorage.getItem('user_name'));
      setUserRole(localStorage.getItem('user_role'));
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const dashboardLink = userRole === 'craftsman' ? '/dashboard/craftsman' : userRole === 'admin' ? '/dashboard/admin' : '/dashboard/customer';
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const logout = () => {
    ['token', 'user_token', 'user_role', 'user_name', 'user_avatar', 'user_id'].forEach((key) => localStorage.removeItem(key));
    setUserName(null);
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-50 bg-[#eef6ef]/95 backdrop-blur-sm border-b border-gray-200/70" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <span className="w-8 h-8 rounded-md bg-[#0f5132] text-white flex items-center justify-center font-bold">⌂</span>
            <span className="text-lg font-bold text-gray-900">صنعة</span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`pb-1 transition-colors ${
                  isActive(link.href)
                    ? 'text-[#0f5132] font-bold border-b-2 border-[#0f5132]'
                    : 'text-gray-600 hover:text-[#0f5132]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {userName ? (
              <div className="relative group">
                <button className="flex items-center gap-2 bg-white border border-gray-100 rounded-full px-3 py-2 shadow-sm">
                  <span className="w-7 h-7 rounded-full bg-[#0f5132] text-white flex items-center justify-center text-xs font-bold">
                    {userName.slice(0, 1)}
                  </span>
                  <span className="text-sm font-bold text-gray-800">{userName}</span>
                </button>
                <div className="absolute left-0 top-full pt-2 hidden group-hover:block">
                  <div className="w-44 bg-white rounded-2xl border border-gray-100 shadow-sm p-2">
                    <Link href={dashboardLink} className="block px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-[#eef6ef]">لوحة التحكم</Link>
                    <button onClick={logout} className="w-full text-right px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50">تسجيل الخروج</button>
                  </div>
                </div>
              </div>
            ) : (
              <Link href="/login" className="bg-[#0f5132] text-white rounded-full font-bold hover:bg-[#0c3f27] transition-colors px-5 py-2 text-sm">
                تسجيل الدخول
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="md:hidden w-10 h-10 rounded-full border border-[#0f5132] text-[#0f5132] flex items-center justify-center"
            aria-label="فتح القائمة"
          >
            {menuOpen ? '×' : '☰'}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-[#eef6ef] border-t border-gray-200/70">
          <div className="px-4 py-4 space-y-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block rounded-xl px-4 py-3 text-sm ${isActive(link.href) ? 'bg-white text-[#0f5132] font-bold' : 'text-gray-700'}`}
              >
                {link.label}
              </Link>
            ))}
            {userName ? (
              <button onClick={logout} className="w-full text-right rounded-xl px-4 py-3 text-sm text-red-600 bg-red-50">تسجيل الخروج</button>
            ) : (
              <Link href="/login" onClick={() => setMenuOpen(false)} className="block text-center bg-[#0f5132] text-white rounded-full font-bold px-5 py-3 text-sm">
                تسجيل الدخول
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
