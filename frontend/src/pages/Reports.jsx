import React, { useEffect, useState } from 'react';
import { BarChart3, Database, RefreshCw, AlertTriangle, CheckCircle2, PieChart } from 'lucide-react';
import { api } from '../api/axiosClient';

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/reports/analytics');
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load analytics report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 gap-3">
        <RefreshCw className="w-5 h-5 animate-spin text-sky-400" />
        <span>Executing PostgreSQL DBMS aggregation queries...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center justify-between">
        <span>{error}</span>
        <button onClick={fetchAnalytics} className="underline">Retry</button>
      </div>
    );
  }

  const { metrics, serviceTypes, partUsage, lowStock } = data || {};

  return (
    <div className="space-y-6">
      {/* Viva Explanation Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-2">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-sky-400" />
          <h3 className="text-base font-bold text-slate-100">DBMS Review & Evaluation Report</h3>
        </div>
        <p className="text-xs text-slate-300">
          This page demonstrates live PostgreSQL DBMS capabilities including <code className="text-sky-400 font-mono">COUNT()</code>, <code className="text-sky-400 font-mono">SUM()</code>, <code className="text-sky-400 font-mono">AVG()</code>, <code className="text-sky-400 font-mono">MIN()</code>, <code className="text-sky-400 font-mono">MAX()</code>, multi-table <code className="text-sky-400 font-mono">JOINs</code>, and <code className="text-sky-400 font-mono">GROUP BY</code> queries. All displayed data is calculated dynamically from <code className="text-sky-400 font-mono">vehicle_service_db</code>.
        </p>
      </div>

      {/* 1. Aggregate Query Results Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h4 className="font-bold text-slate-100 text-sm">1. Service Revenue Aggregation Metrics</h4>
            <p className="text-xs text-slate-400">PostgreSQL Aggregate Functions Evaluation</p>
          </div>
          <code className="text-[11px] bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 text-sky-400 font-mono">
            SELECT COUNT(*), SUM(total_cost), AVG(total_cost), MIN(total_cost), MAX(total_cost) FROM service_records
          </code>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center font-mono">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] uppercase font-sans font-semibold text-slate-400 block mb-1">COUNT(*)</span>
            <span className="text-xl font-bold text-slate-100">{metrics?.total_services || 0} Services</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] uppercase font-sans font-semibold text-slate-400 block mb-1">SUM(total_cost)</span>
            <span className="text-xl font-bold text-emerald-400">₹{parseFloat(metrics?.total_revenue || 0).toLocaleString()}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] uppercase font-sans font-semibold text-slate-400 block mb-1">AVG(total_cost)</span>
            <span className="text-xl font-bold text-sky-400">₹{parseFloat(metrics?.avg_service_cost || 0).toLocaleString()}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] uppercase font-sans font-semibold text-slate-400 block mb-1">MIN(total_cost)</span>
            <span className="text-xl font-bold text-amber-400">₹{parseFloat(metrics?.min_service_cost || 0).toLocaleString()}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] uppercase font-sans font-semibold text-slate-400 block mb-1">MAX(total_cost)</span>
            <span className="text-xl font-bold text-indigo-400">₹{parseFloat(metrics?.max_service_cost || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* 2. GROUP BY Service Type Analytics */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h4 className="font-bold text-slate-100 text-sm">2. Service Type Distribution Analytics</h4>
            <p className="text-xs text-slate-400">GROUP BY service_type with COUNT and SUM</p>
          </div>
          <code className="text-[11px] bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 text-sky-400 font-mono">
            SELECT service_type, COUNT(*), SUM(total_cost) FROM service_bookings JOIN service_records GROUP BY service_type
          </code>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Service Type</th>
                <th className="p-3 text-center">Completed Count</th>
                <th className="p-3 text-right">Average Cost</th>
                <th className="p-3 text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {serviceTypes?.map((st, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 font-mono">
                  <td className="p-3 font-sans font-semibold text-slate-100">{st.service_type}</td>
                  <td className="p-3 text-center font-bold text-sky-400">{st.service_count}</td>
                  <td className="p-3 text-right">₹{parseFloat(st.avg_cost).toFixed(2)}</td>
                  <td className="p-3 text-right font-bold text-emerald-400">₹{parseFloat(st.total_revenue).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Spare Parts Usage Analysis (JOIN + SUM + GROUP BY) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h4 className="font-bold text-slate-100 text-sm">3. Spare Parts Consumption Analysis</h4>
            <p className="text-xs text-slate-400">JOIN parts_used and spare_parts with SUM(quantity) GROUP BY part_id</p>
          </div>
          <code className="text-[11px] bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 text-sky-400 font-mono">
            SELECT sp.part_name, SUM(pu.quantity), SUM(pu.quantity * sp.price) FROM parts_used GROUP BY sp.part_id
          </code>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Spare Part Name</th>
                <th className="p-3 text-right">Unit Price</th>
                <th className="p-3 text-center">Total Quantity Used</th>
                <th className="p-3 text-[11px] text-right">Available Stock</th>
                <th className="p-3 text-right">Total Revenue Contribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
              {partUsage?.map((p) => (
                <tr key={p.part_id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-sans font-semibold text-slate-100">{p.part_name}</td>
                  <td className="p-3 text-right">₹{parseFloat(p.price).toFixed(2)}</td>
                  <td className="p-3 text-center font-bold text-sky-400">{p.total_quantity_used} units</td>
                  <td className="p-3 text-right">
                    <span className={p.current_stock < 20 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                      {p.current_stock} units
                    </span>
                  </td>
                  <td className="p-3 text-right font-bold text-emerald-400">₹{parseFloat(p.total_part_revenue).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
