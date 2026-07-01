'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '@/components/dashboard/Sidebar';
import { API_BASE, getAuthHeaders } from '@/lib/api';

interface Stats {
  totalUsers: number;
  activeWorkers: number;
  todayRevenue: number;
  openDisputes: number;
  totalRequests: number;
}

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  isAvailable: boolean;
  rating: number;
  createdAt: string;
}

interface Dispute {
  _id: string;
  client: { name: string; phone: string };
  craftsman: { name: string; phone: string };
  service: { nameAr: string };
  pricing: { totalAmount: number };
  clientNotes: string;
  status: string;
  createdAt: string;
}

interface Request {
  _id: string;
  client: { name: string };
  craftsman: { name: string };
  service: { nameAr: string };
  pricing: { totalAmount: number };
  status: string;
  createdAt: string;
}

const NAV_ITEMS = [
  { label: 'لوحة التحكم', href: '/dashboard/admin', icon: '📊' },
  { label: 'المستخدمين', href: '/dashboard/admin?tab=users', icon: '👥' },
  { label: 'النزاعات', href: '/dashboard/admin?tab=disputes', icon: '⚖️' },
  { label: 'الطلبات', href: '/dashboard/admin?tab=requests', icon: '📋' },
];

const API = `${API_BASE}/admin`;

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-3">
        <span className={`text-3xl ${color}`}>{icon}</span>
        <span className="text-3xl font-black text-gray-900 tracking-tight">{value}</span>
      </div>
      <p className="text-sm text-gray-500 font-light">{label}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState(() => {
    if (typeof window === 'undefined') return 'overview';
    return new URLSearchParams(window.location.search).get('tab') || 'overview';
  });
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);

  useEffect(() => {
    if (tab === 'overview') {
      axios.get(`${API}/dashboard`, { headers: getAuthHeaders() }).then((res) => {
        if (res.data.status === 'success') setStats(res.data.data.stats);
      }).catch(() => {}).finally(() => setLoading(false));
    }
  }, [tab]);

  useEffect(() => {
    if (tab === 'users') {
      axios.get(`${API}/users`, {
        headers: getAuthHeaders(),
        params: { search: userSearch, role: userRoleFilter, status: userStatusFilter, page: userPage },
      }).then((res) => {
        if (res.data.status === 'success') {
          setUsers(res.data.data.users);
          setUserTotalPages(res.data.data.pagination.totalPages);
        }
      }).catch(() => {}).finally(() => setLoading(false));
    }
  }, [tab, userSearch, userRoleFilter, userStatusFilter, userPage]);

  useEffect(() => {
    if (tab === 'disputes') {
      axios.get(`${API}/disputes`, { headers: getAuthHeaders() }).then((res) => {
        if (res.data.status === 'success') setDisputes(res.data.data.disputes);
      }).catch(() => {}).finally(() => setLoading(false));
    }
  }, [tab]);

  useEffect(() => {
    if (tab === 'requests') {
      axios.get(`${API}/requests`, { headers: getAuthHeaders() }).then((res) => {
        if (res.data.status === 'success') setRequests(res.data.data.requests);
      }).catch(() => {}).finally(() => setLoading(false));
    }
  }, [tab]);

  const handleResolveDispute = async (id: string, resolution: string) => {
    try {
      await axios.patch(`${API}/disputes/${id}/resolve`, { resolution }, { headers: getAuthHeaders() });
      setDisputes((prev) => prev.filter((d) => d._id !== id));
    } catch {}
  };

  const handleToggleUserStatus = async (id: string, currentStatus: boolean) => {
    try {
      await axios.patch(`${API}/users/${id}`, { isActive: !currentStatus }, { headers: getAuthHeaders() });
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, isActive: !currentStatus } : u)));
    } catch {}
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    try {
      await axios.delete(`${API}/users/${id}`, { headers: getAuthHeaders() });
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch {}
  };

  const updateUrl = (newTab: string) => {
    setTab(newTab);
    window.history.pushState({}, '', `/dashboard/admin${newTab !== 'overview' ? `?tab=${newTab}` : ''}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      <Sidebar items={NAV_ITEMS} role="admin" />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">لوحة التحكم</h1>
            <div className="flex gap-2">
              {['overview', 'users', 'disputes', 'requests'].map((t) => (
                <button
                  key={t}
                  onClick={() => updateUrl(t)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    tab === t ? 'bg-[#0f5132] text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {t === 'overview' ? '📊 نظرة عامة' : t === 'users' ? '👥 المستخدمين' : t === 'disputes' ? '⚖️ النزاعات' : '📋 الطلبات'}
                </button>
              ))}
            </div>
          </div>

          {tab === 'overview' && (
            <div>
              {loading ? (
                <div className="grid grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse h-28" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <StatCard label="إجمالي المستخدمين" value={stats?.totalUsers || 0} icon="👥" color="text-blue-500" />
                  <StatCard label="العمال النشطون" value={stats?.activeWorkers || 0} icon="🔧" color="text-green-500" />
                  <StatCard label="إيرادات اليوم" value={`$${stats?.todayRevenue || 0}`} icon="💰" color="text-amber-500" />
                  <StatCard label="النزاعات المفتوحة" value={stats?.openDisputes || 0} icon="⚖️" color="text-red-500" />
                </div>
              )}

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                <h2 className="font-black text-gray-900 mb-1 tracking-tight">خريطة العمليات المباشرة</h2>
                <p className="text-sm text-gray-500 font-light mb-4">النظام متصل — عرض جميع الكيانات في الوقت الفعلي</p>
                <div className="bg-[#eef6ef] rounded-xl h-64 flex items-center justify-center text-gray-500 text-sm border border-dashed border-gray-200">
                  🗺️ خريطة العمليات المباشرة — {stats?.activeWorkers || 0} عامل نشط
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="font-bold text-gray-900 mb-3">الطلبات النشطة</h3>
                  <div className="h-48 flex items-center justify-center text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
                    📈 رسم بياني للطلبات
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="font-bold text-gray-900 mb-3">توزيع الخدمات</h3>
                  <div className="h-48 flex items-center justify-center text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
                    🥧 رسم بياني دائري
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'users' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h2 className="font-black text-gray-900 tracking-tight">إدارة المستخدمين</h2>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="ابحث بالاسم، البريد أو المعرف..."
                    value={userSearch}
                    onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                    className="border border-gray-200 rounded-xl px-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#0f5132]/20"
                  />
                  <select value={userRoleFilter} onChange={(e) => { setUserRoleFilter(e.target.value); setUserPage(1); }}
                    className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5132]/20">
                    <option value="all">جميع الأدوار</option>
                    <option value="customer">عميل</option>
                    <option value="craftsman">حرفي</option>
                    <option value="admin">مسؤول</option>
                  </select>
                  <select value={userStatusFilter} onChange={(e) => { setUserStatusFilter(e.target.value); setUserPage(1); }}
                    className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5132]/20">
                    <option value="all">جميع الحالات</option>
                    <option value="active">نشط</option>
                    <option value="inactive">موقوف</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-right py-3 px-3 text-gray-500 font-medium">المستخدم</th>
                      <th className="text-right py-3 px-3 text-gray-500 font-medium">البريد الإلكتروني</th>
                      <th className="text-right py-3 px-3 text-gray-500 font-medium">الدور</th>
                      <th className="text-right py-3 px-3 text-gray-500 font-medium">الحالة</th>
                      <th className="text-right py-3 px-3 text-gray-500 font-medium">تاريخ الانضمام</th>
                      <th className="text-center py-3 px-3 text-gray-500 font-medium">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#eef6ef] text-[#0f5132] flex items-center justify-center text-sm font-bold">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{user.name}</p>
                              <p className="text-xs text-gray-400">{user.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-gray-600">{user.email}</td>
                        <td className="py-3 px-3">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                            user.role === 'craftsman' ? 'bg-blue-100 text-blue-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {user.role === 'admin' ? 'مسؤول' : user.role === 'craftsman' ? 'حرفي' : 'عميل'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                            user.isActive ? 'text-green-600' : 'text-red-600'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                            {user.isActive ? 'نشط' : 'موقوف'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-500 text-xs">
                          {new Date(user.createdAt).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
                                user.isActive ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}>
                              {user.isActive ? 'تعطيل' : 'تفعيل'}
                            </button>
                            <button onClick={() => handleDeleteUser(user._id)}
                              className="text-xs font-bold px-3 py-1.5 rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition-colors">
                              حذف
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-gray-400 text-sm">لا يوجد مستخدمين</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {userTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  {Array.from({ length: userTotalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => setUserPage(p)}
                      className={`w-8 h-8 rounded-full text-xs font-bold transition-colors ${
                        p === userPage ? 'bg-[#0f5132] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'disputes' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-black text-gray-900 mb-6 tracking-tight">إدارة النزاعات</h2>
              {disputes.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm bg-gray-50 rounded-xl">لا توجد نزاعات مفتوحة ✅</div>
              ) : (
                <div className="space-y-4">
                  {disputes.map((dispute) => (
                    <div key={dispute._id} className="border border-gray-100 rounded-2xl p-5 bg-gray-50">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full">نزاع مفتوح</span>
                          <span className="text-sm font-bold text-gray-900">{dispute.service?.nameAr || 'خدمة'}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">${dispute.pricing?.totalAmount || 0}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">العميل</p>
                          <p className="font-medium text-gray-900">{dispute.client?.name || 'غير معروف'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">الحرفي</p>
                          <p className="font-medium text-gray-900">{dispute.craftsman?.name || 'غير معروف'}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 bg-white rounded-xl p-3 border border-gray-100 mb-4">
                        {dispute.clientNotes || 'لا توجد ملاحظات'}
                      </p>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleResolveDispute(dispute._id, 'complete')}
                          className="px-4 py-2 bg-green-100 text-green-700 text-xs font-bold rounded-full hover:bg-green-200 transition-colors">
                          ✅ حل النزاع
                        </button>
                        <button onClick={() => handleResolveDispute(dispute._id, 'refund')}
                          className="px-4 py-2 bg-red-100 text-red-700 text-xs font-bold rounded-full hover:bg-red-200 transition-colors">
                          💰 إصدار استرداد
                        </button>
                        <span className="text-xs text-gray-400 mr-auto">
                          {new Date(dispute.createdAt).toLocaleDateString('ar-EG')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'requests' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-black text-gray-900 mb-6 tracking-tight">جميع الطلبات</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-right py-3 px-3 text-gray-500 font-medium">رقم الطلب</th>
                      <th className="text-right py-3 px-3 text-gray-500 font-medium">العميل</th>
                      <th className="text-right py-3 px-3 text-gray-500 font-medium">الحرفي</th>
                      <th className="text-right py-3 px-3 text-gray-500 font-medium">الخدمة</th>
                      <th className="text-right py-3 px-3 text-gray-500 font-medium">المبلغ</th>
                      <th className="text-right py-3 px-3 text-gray-500 font-medium">الحالة</th>
                      <th className="text-right py-3 px-3 text-gray-500 font-medium">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req) => (
                      <tr key={req._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="py-3 px-3 font-mono text-xs text-gray-600">#{req._id.slice(-6)}</td>
                        <td className="py-3 px-3 text-gray-900 font-medium">{req.client?.name || '-'}</td>
                        <td className="py-3 px-3 text-gray-600">{req.craftsman?.name || 'لم يتم التعيين'}</td>
                        <td className="py-3 px-3">{req.service?.nameAr || '-'}</td>
                        <td className="py-3 px-3 font-bold">${req.pricing?.totalAmount || 0}</td>
                        <td className="py-3 px-3">
                          <StatusBadge status={req.status} />
                        </td>
                        <td className="py-3 px-3 text-xs text-gray-400">
                          {new Date(req.createdAt).toLocaleDateString('ar-EG')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; classes: string }> = {
    PENDING_MATCHING: { label: 'قيد البحث', classes: 'bg-amber-100 text-amber-700' },
    ACCEPTED: { label: 'تم القبول', classes: 'bg-blue-100 text-blue-700' },
    ARRIVED: { label: 'في الطريق', classes: 'bg-indigo-100 text-indigo-700' },
    IN_PROGRESS: { label: 'قيد التنفيذ', classes: 'bg-purple-100 text-purple-700' },
    COMPLETED: { label: 'مكتمل', classes: 'bg-green-100 text-green-700' },
    CANCELLED: { label: 'ملغي', classes: 'bg-gray-100 text-gray-500' },
    DISPUTED: { label: 'نزاع', classes: 'bg-red-100 text-red-700' },
    REFUNDED: { label: 'مسترجع', classes: 'bg-rose-100 text-rose-700' },
  };
  const c = config[status] || { label: status, classes: 'bg-gray-100 text-gray-500' };
  return <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${c.classes}`}>{c.label}</span>;
}
