'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

interface SidebarProps {
  items: NavItem[];
  role: string;
}

export default function Sidebar({ items, role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');
    toast.success('تم تسجيل الخروج بنجاح');
    router.push('/login');
  };

  const roleLabel = role === 'admin' ? 'المسؤول' : role === 'craftsman' ? 'حرفي' : 'عميل';

  return (
    <aside className="w-64 bg-white border-l border-gray-200 min-h-screen flex flex-col shrink-0">
      <div className="p-5 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-[#0f5132] flex items-center justify-center text-white text-sm">⌂</div>
          <span className="text-xl font-black text-gray-900 tracking-tight">صنعة</span>
        </Link>
        <p className="text-xs text-gray-400 mt-2 text-right">
          {roleLabel}
        </p>
      </div>

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
