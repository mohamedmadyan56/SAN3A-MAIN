'use client';

import Link from 'next/link';
import Image from 'next/image';
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
  const [scrolled, setScrolled] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setUserName(localStorage.getItem('user_name'));
    setUserRole(localStorage.getItem('user_role'));
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const dashboardLink = userRole === 'craftsman' ? '/dashboard/craftsman' : userRole === 'admin' ? '/dashboard/admin' : '/dashboard/customer';
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const logout = () => {
    ['token', 'user_token', 'user_role', 'user_name', 'user_avatar', 'user_id'].forEach((key) => localStorage.removeItem(key));
    setUserName(null);
    window.location.href = '/';
  };

  return (
    <header
      dir="rtl"
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-lg shadow-sm border-b border-gray-100/80'
          : 'bg-[#eef6ef]/95 backdrop-blur-sm border-b border-gray-200/70'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="h-16 md:h-18 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <Image src="/logo.png" alt="صنعة" width={110} height={36} priority className="object-contain transition-transform duration-300 group-hover:scale-[1.02]" />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                  isActive(link.href)
                    ? 'text-[#0f5132] bg-[#eef6ef]'
                    : 'text-gray-600 hover:text-[#0f5132] hover:bg-[#eef6ef]/50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {mounted && userName ? (
              <div className="relative group">
                <button className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1.5 shadow-sm hover:shadow-md hover:border-[#0f5132]/20 transition-all duration-200">
                  <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0f5132] to-[#0a3822] text-white flex items-center justify-center text-xs font-bold">
                    {userName.slice(0, 1)}
                  </span>
                  <span className="text-sm font-bold text-gray-800">{userName}</span>
                </button>
                <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-1 group-hover:translate-y-0">
                  <div className="w-44 bg-white rounded-2xl border border-gray-100 shadow-lg p-2">
                    <Link href={dashboardLink} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-[#eef6ef] transition-colors">
                      <span>📊</span>
                      لوحة التحكم
                    </Link>
                    <hr className="my-1 border-gray-50" />
                    <button onClick={logout} className="flex items-center gap-2 w-full text-right px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <span>🚪</span>
                      تسجيل الخروج
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 bg-gradient-to-l from-[#0f5132] to-[#0a3822] text-white rounded-full font-bold text-sm px-5 py-2 hover:shadow-lg hover:shadow-[#0f5132]/20 hover:scale-[1.02] transition-all duration-200"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                تسجيل الدخول
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="md:hidden w-10 h-10 rounded-xl border border-[#0f5132]/30 text-[#0f5132] flex items-center justify-center hover:bg-[#eef6ef] transition-colors"
            aria-label="فتح القائمة"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          menuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-white border-t border-gray-100 shadow-inner">
          <div className="px-4 py-3 space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block rounded-xl px-4 py-3 text-sm transition-colors ${
                  isActive(link.href) ? 'bg-[#eef6ef] text-[#0f5132] font-bold' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <hr className="my-2 border-gray-100" />
            {mounted && userName ? (
              <>
                <Link href={dashboardLink} onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <span>📊</span>
                  لوحة التحكم
                </Link>
                <button onClick={() => { logout(); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full text-right rounded-xl px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  <span>🚪</span>
                  تسجيل الخروج
                </button>
              </>
            ) : (
              <Link href="/login" onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 bg-gradient-to-l from-[#0f5132] to-[#0a3822] text-white rounded-full font-bold px-5 py-3 text-sm transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                تسجيل الدخول
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
