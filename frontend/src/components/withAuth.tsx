'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function withAuth(Component: React.ComponentType, allowedRoles?: string[]) {
  return function AuthenticatedComponent(props: any) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
      const token = localStorage.getItem('token') || localStorage.getItem('user_token');
      const role = localStorage.getItem('user_role');

      if (!token) {
        router.push('/login');
        return;
      }

      if (allowedRoles && role && !allowedRoles.includes(role)) {
        router.push('/');
        return;
      }

      setIsAuthorized(true);
    }, []);

    if (!isAuthorized) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#0f5132] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 text-sm">جاري التحقق من صلاحية الوصول...</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
