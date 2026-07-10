'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { logoutSession } from '@/lib/auth';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

interface SidebarProps {
  items: NavItem[];
  role: string;
}

function getInitials(name: string): string {
  return name?.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase() || '?';
}

function getAvatarColor(name: string): string {
  const colors = [
    'from-[#0f5132] to-[#0a3822]',
    'from-[#dc2626] to-[#991b1b]',
    'from-[#2563eb] to-[#1e40af]',
    'from-[#7c3aed] to-[#5b21b6]',
    'from-[#d97706] to-[#92400e]',
    'from-[#0891b2] to-[#155e75]',
  ];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function Sidebar({ items, role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setUserName(localStorage.getItem('user_name') || '');
      const stored = localStorage.getItem('user_avatar') || '';
      setUserAvatar(stored !== 'default.png' ? stored : '');
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const handleLogout = async () => {
    await logoutSession();
    setUserName('');
    toast.success('تم تسجيل الخروج بنجاح');
    router.replace('/login');
    router.refresh();
  };

  const roleLabel = role === 'admin' ? 'مسؤول' : role === 'craftsman' ? 'حرفي' : 'عميل';

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-l border-gray-200 min-h-screen shrink-0">
      {/* البروفايل */}
      <div className="p-6 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand-dark)] flex items-center justify-center text-white text-sm shadow-sm">
            ⌂
          </div>
          <span className="text-xl font-black text-gray-900 tracking-tight">صنعة</span>
        </Link>
        <div className="flex flex-col items-center text-center">
          {userAvatar && !avatarError ? (
            <img src={userAvatar} alt="Profile" className="w-16 h-16 rounded-2xl object-cover shadow-sm mb-3 border border-gray-100" onError={() => setAvatarError(true)} />
          ) : (
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getAvatarColor(userName)} flex items-center justify-center text-white text-xl font-bold shadow-sm mb-3`}>
              {getInitials(userName)}
            </div>
          )}
          <h3 className="font-bold text-gray-900 text-sm">{userName || 'مستخدم'}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{roleLabel}</p>
        </div>
      </div>

      {/* القائمة */}
      <nav className="flex-1 p-3 space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-[var(--brand-light)] text-[var(--brand)] font-bold'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* الأزرار السفلية */}
      <div className="p-3 border-t border-gray-100 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
        >
          <span className="text-lg">🏠</span>
          العودة للموقع
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger-light)] transition-all duration-200"
        >
          <span className="text-lg">🚪</span>
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
