import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Car, 
  Wrench, 
  Package, 
  AlertTriangle, 
  IndianRupee, 
  ArrowRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { api } from '../api/axiosClient';

export default function Dashboard({ setActiveTab, onSelectHistoryReg }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 gap-3">
        <RefreshCw className="w-5 h-5 animate-spin text-sky-400" />
        <span>Fetching live database stats...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
        <button onClick={fetchStats} className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg text-xs font-semibold">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Overview Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Customers"
          value={stats?.totalCustomers || 0}
          subtitle="Registered owners"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Total Vehicles"
          value={stats?.totalVehicles || 0}
          subtitle="Active vehicle records"
          icon={Car}
          color="indigo"
        />
        <StatCard
          title="Pending Services"
          value={stats?.bookings?.Pending || 0}
          subtitle={`${stats?.bookings?.['In Progress'] || 0} In Progress`}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Total Revenue"
          value={`₹${(stats?.revenue?.total_revenue || 0).toLocaleString()}`}
          subtitle={`Avg ₹${(stats?.revenue?.avg_cost || 0).toLocaleString()} per service`}
          icon={IndianRupee}
          color="emerald"
        />
      </div>

      {/* Secondary Metrics & Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Service History Search Widget */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-100">Vehicle Service History Search</h3>
                <p className="text-xs text-slate-400">Execute PostgreSQL stored function <code className="text-sky-400 font-mono">get_vehicle_service_history()</code></p>
              </div>
              <span className="px-2.5 py-1 bg-sky-500/10 text-sky-400 text-xs font-semibold rounded-full border border-sky-500/20">
                Core Feature
              </span>
            </div>
            <p className="text-sm text-slate-300 mb-4">
              Lookup complete past service timeline, mechanic assignments, odometer readings, replaced parts, and invoices for any registered vehicle.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('history')}
              className="flex-1 py-3 px-4 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20"
            >
              <span>Open History Search Page</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-xl transition flex items-center gap-2"
            >
              <Wrench className="w-4 h-4 text-amber-400" />
              <span>Record New Service</span>
            </button>
          </div>
        </div>

        {/* Low Stock Alerts Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-slate-100">Low Stock Inventory</h3>
            </div>
            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-xs font-bold rounded border border-amber-500/20">
              {stats?.lowStockCount || 0} Parts
            </span>
          </div>

          {stats?.lowStockAlerts?.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-sm">
              All spare part stock levels are sufficient (≥ 20).
            </div>
          ) : (
            <div className="space-y-3">
              {stats?.lowStockAlerts?.map((part) => (
                <div key={part.part_id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div>
                    <p className="text-xs font-semibold text-slate-200">{part.part_name}</p>
                    <p className="text-[11px] text-slate-400">₹{parseFloat(part.price).toFixed(2)} each</p>
                  </div>
                  <span className="px-2 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold rounded-lg">
                    {part.stock_quantity} left
                  </span>
                </div>
              ))}
              <button
                onClick={() => setActiveTab('parts')}
                className="w-full text-center text-xs font-semibold text-sky-400 hover:text-sky-300 pt-1"
              >
                View full spare parts inventory →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recent Service Bookings */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100">Recent Service Bookings</h3>
            <p className="text-xs text-slate-400">Latest active bookings from PostgreSQL</p>
          </div>
          <button
            onClick={() => setActiveTab('bookings')}
            className="text-xs font-semibold text-sky-400 hover:text-sky-300"
          >
            View all bookings →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Booking ID</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Vehicle</th>
                <th className="p-3">Service Type</th>
                <th className="p-3">Booking Date</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {stats?.recentBookings?.map((b) => (
                <tr key={b.booking_id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3 font-mono text-slate-400">#{b.booking_id}</td>
                  <td className="p-3 font-medium text-slate-100">{b.customer_name}</td>
                  <td className="p-3 font-mono text-sky-400">{b.registration_no} <span className="text-slate-400">({b.brand} {b.model})</span></td>
                  <td className="p-3">{b.service_type}</td>
                  <td className="p-3">{new Date(b.booking_date).toLocaleDateString()}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                      b.status === 'Completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : b.status === 'In Progress'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => {
                        if (onSelectHistoryReg) onSelectHistoryReg(b.registration_no);
                        setActiveTab('history');
                      }}
                      className="text-xs font-semibold text-sky-400 hover:text-sky-300 underline"
                    >
                      History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
