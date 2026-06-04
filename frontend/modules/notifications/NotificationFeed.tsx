'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api/axios';

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  is_read: boolean;
  created_at: string;
};

export default function NotificationFeed() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await api.get('/notifications', { params: { limit: 50 } });
        setNotifications(response.data);
      } catch (err: any) {
        console.error('Unable to load notifications', err);
        setError(err.response?.data?.detail || 'Unable to load notifications.');
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();
  }, []);

  const toggleRead = async (notificationId: string, currentState: boolean) => {
    try {
      await api.patch(`/notifications/${notificationId}`, { is_read: !currentState });
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId ? { ...notification, is_read: !currentState } : notification
        )
      );
    } catch (err) {
      console.error('Unable to update notification status', err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((notification) => ({ ...notification, is_read: true })));
    } catch (err) {
      console.error('Unable to mark notifications read', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Activity Notifications</h2>
          <p className="text-sm text-gray-500">Review your latest system alerts and keep your dashboard up to date.</p>
        </div>
        <button
          type="button"
          onClick={markAllRead}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Mark all read
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">Loading notifications...</div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
      ) : notifications.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">No notifications available.</div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-2xl border p-5 shadow-sm transition-all ${
                notification.is_read ? 'border-slate-200 bg-slate-50' : 'border-blue-300 bg-white'
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-900">{notification.title}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs uppercase ${
                        notification.type === 'ERROR'
                          ? 'bg-red-100 text-red-700'
                          : notification.type === 'WARNING'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {notification.type}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{notification.message}</p>
                </div>

                <div className="flex flex-col gap-2 sm:items-end">
                  <span className="text-xs text-slate-400">{new Date(notification.created_at).toLocaleString()}</span>
                  <div className="flex gap-2">
                    {notification.link ? (
                      <a
                        href={notification.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        View details
                      </a>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => toggleRead(notification.id, notification.is_read)}
                      className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      {notification.is_read ? 'Mark unread' : 'Mark read'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
