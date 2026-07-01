'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';

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

  const handleLogout = () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');
    setUserName('');
    toast.success('تم تسجيل الخروج بنجاح');
    router.push('/login');
  };

  const roleLabel = role === 'admin' ? 'مسؤول' : role === 'craftsman' ? 'حرفي' : 'عميل';

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-l border-gray-200 min-h-screen shrink-0">
      {/* البروفايل */}
      <div className="p-6 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0f5132] to-[#0a3822] flex items-center justify-center text-white text-sm shadow-sm">
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
          <p className="text-xs text-gray-400">{roleLabel}</p>
        </div>
      </div>

      {/* القائمة */}
      <nav className="flex-1 p-4 space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#eef6ef] text-[#0f5132] font-bold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* الأزرار السفلية */}
      <div className="p-4 border-t border-gray-100 space-y-2">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
        >
          <span className="text-lg">🏠</span>
          العودة للموقع
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
        >
          <span className="text-lg">🚪</span>
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
