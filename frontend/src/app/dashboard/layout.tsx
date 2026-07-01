'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('user_token');
    const role = localStorage.getItem('user_role');

    if (!token) {
      router.push('/login');
      return;
    }

    const requiredRole = getRequiredRole(pathname);
    if (requiredRole && role !== requiredRole) {
      router.push('/');
      return;
    }

    setAuthorized(true);
  }, [pathname]);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#0f5132] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">جاري التحقق من الصلاحية...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function getRequiredRole(path: string): string | null {
  if (path.startsWith('/dashboard/admin')) return 'admin';
  if (path.startsWith('/dashboard/craftsman')) return 'craftsman';
  if (path.startsWith('/dashboard/customer')) return 'customer';
  return null;
}
