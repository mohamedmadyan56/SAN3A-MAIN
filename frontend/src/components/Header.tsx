'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setUserName(localStorage.getItem('user_name'));
    setUserRole(localStorage.getItem('user_role'));
    setMounted(true);
  }, []);

  if (!mounted) return <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-50"><div className="max-w-6xl mx-auto px-4 sm:px-6"><div className="flex items-center justify-between h-16"><div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0f5132] to-[#0a3822] flex items-center justify-center text-white text-sm shadow-sm">⌂</div><span className="text-lg font-bold text-gray-900">صنعة</span></div><div className="h-8 w-24 bg-gray-100 rounded-full animate-pulse" /></div></div></header>;

  const dashboardLink = userRole === 'craftsman' ? '/dashboard/craftsman' :
    userRole === 'admin' ? '/dashboard/admin' :
    userRole === 'customer' ? '/dashboard/customer' : null;

  const handleLogout = () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');
    setUserName(null);
    setUserRole(null);
    window.location.href = '/';
  };

  const isActive = (path: string) => pathname === path ? 'text-[#0f5132] font-bold border-b-2 border-[#0f5132]' : 'text-gray-600 hover:text-gray-900';

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* اللوجو */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0f5132] to-[#0a3822] flex items-center justify-center text-white text-sm shadow-sm">
              ⌂
            </div>
            <span className="text-lg font-bold text-gray-900">صنعة</span>
          </Link>

          {/* الروابط - ديسكتوب */}
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <Link href="/" className={`transition-colors pb-1 ${isActive('/')}`}>
              الرئيسية
            </Link>
            <Link href="/requests/new" className={`transition-colors pb-1 ${pathname.startsWith('/requests') ? 'text-[#0f5132] font-bold border-b-2 border-[#0f5132]' : 'text-gray-600 hover:text-gray-900'}`}>
              طلب خدمة
            </Link>
            <Link href="/professionals" className={`transition-colors pb-1 ${isActive('/professionals')}`}>
              المحترفون
            </Link>
            <Link href="/help" className={`transition-colors pb-1 ${isActive('/help')}`}>
              المساعدة
            </Link>
          </nav>

            {/* الزر - ديسكتوب */}
          <div className="hidden md:flex items-center gap-3">
            {userName ? (
              <>
                <Link
                  href={dashboardLink || '/'}
                  className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-gray-800 transition-all shadow-sm"
                >
                  {userName}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-400 hover:text-red-500 transition-colors"
                >
                  خروج
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-[#0f5132] text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-[#0c3f27] transition-all shadow-sm"
              >
                تسجيل الدخول
              </Link>
            )}
          </div>

          {/* زر القائمة - موبايل */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {menuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* القائمة المنسدلة - موبايل */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white shadow-lg">
          <div className="px-4 py-4 space-y-2">
            <Link href="/" onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">الرئيسية</Link>
            <Link href="/requests/new" onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">طلب خدمة</Link>
            <Link href="/professionals" onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">المحترفون</Link>
            <Link href="/help" onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">المساعدة</Link>
            <hr className="my-2 border-gray-100" />
            {userName ? (
              <>
                <Link href={dashboardLink || '/'} onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-bold text-[#0f5132] hover:bg-gray-50 transition-colors">{userName}</Link>
                <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="block w-full text-right px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">تسجيل الخروج</button>
              </>
            ) : (
              <Link href="/login" onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-bold text-white bg-[#0f5132] hover:bg-[#0c3f27] transition-colors text-center">تسجيل الدخول</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
