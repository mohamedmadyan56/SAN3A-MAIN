export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token') || localStorage.getItem('user_token') || ''}`,
  'Content-Type': 'application/json',
});

export function extractTextContent(error: unknown, fallback = 'حدث خطأ غير متوقع'): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const maybeAxios = error as {
      response?: { data?: { message?: unknown; error?: unknown } };
      message?: unknown;
    };
    const message = maybeAxios.response?.data?.message ?? maybeAxios.response?.data?.error ?? maybeAxios.message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}
