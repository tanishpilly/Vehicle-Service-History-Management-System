import React, { useEffect, useState } from 'react';
import { Database, CheckCircle2, AlertCircle, RefreshCw, Shield, LogOut, Bell, Truck, X, Check } from 'lucide-react';
import { api } from '../api/axiosClient';

export default function Navbar({ activeTab, user, onLogout }) {
  const [dbStatus, setDbStatus] = useState({ connected: false, dbName: '', loading: true });
  
  // Notification State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const checkDb = async () => {
    try {
      setDbStatus(prev => ({ ...prev, loading: true }));
      const data = await api.get('/health');
      setDbStatus({ connected: true, dbName: data.database || 'vehicle_service_db', loading: false });
    } catch {
      setDbStatus({ connected: false, dbName: 'vehicle_service_db', loading: false });
    }
  };

  const fetchNotifications = async () => {
    if (!user || user.role !== 'service_center') return;
    try {
      const data = await api.get('/service-center-extra/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch {
      // Ignore notification fetch errors gracefully
    }
  };

  useEffect(() => {
    checkDb();
    if (user && user.role === 'service_center') {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000); // Polling every 10s
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/service-center-extra/notifications/${id}/read`);
      fetchNotifications();
    } catch {
      // Ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/service-center-extra/notifications/read-all');
      fetchNotifications();
    } catch {
      // Ignore
    }
  };

  const titles = {
    dashboard: 'Service Center Administration Dashboard',
    pickup: 'Vehicle Pickup Requests & Dispatch',
    customers: 'Customer Directory',
    vehicles: 'Vehicle Registry',
    bookings: 'Service Bookings',
    records: 'Service Records & Workflow',
    history: 'Vehicle Service History Search',
    mechanics: 'Mechanics Roster',
    parts: 'Spare Parts Inventory',
    invoices: 'Billing & Invoices',
    reports: 'DBMS Reports & Aggregations'
  };

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h2 className="text-lg font-bold text-slate-100 tracking-tight">
          {titles[activeTab] || 'Vehicle Service History Management System'}
        </h2>
        <p className="text-xs text-slate-400">DBMS College Project • Service Center Interface</p>
      </div>

      <div className="flex items-center gap-3">
        {/* In-App Notifications Bell for Service Center Staff */}
        {user && user.role === 'service_center' && (
          <div className="relative">
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              title="Notifications"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 relative transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 md:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold text-white">In-App Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-bold">
                        {unreadCount} New
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-cyan-400 hover:underline font-semibold"
                      >
                        Mark All Read
                      </button>
                    )}
                    <button onClick={() => setShowNotifDropdown(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">No notifications yet.</p>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.notification_id}
                        className={`p-3 rounded-xl border text-xs space-y-1 transition-colors ${
                          n.is_read
                            ? 'bg-slate-950/50 border-slate-800/60 text-slate-400'
                            : 'bg-amber-500/10 border-amber-500/30 text-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="font-bold text-amber-300">{n.title}</p>
                          {!n.is_read && (
                            <button
                              onClick={() => handleMarkRead(n.notification_id)}
                              title="Mark as Read"
                              className="text-cyan-400 hover:text-cyan-300 text-[10px] font-bold"
                            >
                              ✓ Read
                            </button>
                          )}
                        </div>
                        <p className="text-slate-300 leading-snug">{n.message}</p>
                        <p className="text-[10px] text-slate-500 pt-1">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Role Badge */}
        {user && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>Staff ({user.username})</span>
          </div>
        )}

        {/* PostgreSQL Database Badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
          dbStatus.connected
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
        }`}>
          <Database className="w-3.5 h-3.5" />
          <span>{dbStatus.dbName}</span>
          {dbStatus.loading ? (
            <RefreshCw className="w-3 h-3 animate-spin text-slate-400" />
          ) : dbStatus.connected ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          )}
        </div>

        {/* Logout Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            title="Logout of Staff Portal"
            className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
