import React, { useState, useEffect } from 'react';
import { Truck, Calendar, Clock, MapPin, Phone, User, FileText, CheckCircle2, AlertCircle, RefreshCw, ChevronDown, Download, Eye, Sparkles } from 'lucide-react';
import { api } from '../api/axiosClient';

export default function PickupRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Document Viewer Modal State
  const [viewDoc, setViewDoc] = useState(null);

  const fetchPickupRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/service-center-extra/pickup-requests');
      setRequests(data.pickup_requests || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch pickup requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPickupRequests();
  }, []);

  const handleUpdatePickupStatus = async (bookingId, newStatus) => {
    setError('');
    setSuccessMsg('');
    try {
      const data = await api.put(`/appointments/${bookingId}/pickup-status`, { pickup_status: newStatus });
      setSuccessMsg(`Pickup status updated to '${newStatus}'!`);
      fetchPickupRequests();
    } catch (err) {
      setError(err.message || 'Failed to update pickup status.');
    }
  };

  const handleUpdateServiceStatus = async (bookingId, newStatus) => {
    setError('');
    setSuccessMsg('');
    try {
      const data = await api.put(`/appointments/${bookingId}/status`, { status: newStatus });
      setSuccessMsg(`Service status updated to '${newStatus}'!`);
      fetchPickupRequests();
    } catch (err) {
      setError(err.message || 'Failed to update service status.');
    }
  };

  const filteredRequests = statusFilter === 'All' 
    ? requests 
    : requests.filter(r => r.pickup_status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Vehicle Pickup Requests</h1>
            <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
              <Truck className="w-3.5 h-3.5" /> Service Center Dispatch
            </span>
          </div>
          <p className="text-xs text-slate-400">Manage door-step vehicle pickup requests, schedule dispatches, and inspect insurance documents</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            {['All', 'Requested', 'Accepted', 'Pickup Scheduled', 'Picked Up'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 font-semibold rounded-lg transition-colors ${
                  statusFilter === st
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={fetchPickupRequests}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/50 border border-slate-800">
          <Truck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Pickup Requests Found</h3>
          <p className="text-xs text-slate-400">Customer vehicle pickup requests will appear here in real time.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredRequests.map(req => {
            const isPickedUp = req.pickup_status === 'Picked Up';
            const isScheduled = req.pickup_status === 'Pickup Scheduled';

            return (
              <div
                key={req.pickup_id}
                className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 hover:border-slate-700 transition-all shadow-xl"
              >
                {/* Top Banner Badge */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          VEHICLE PICKUP REQUIRED
                        </span>
                        <span className="text-xs text-slate-400 font-mono">Booking #BK{String(req.booking_id).padStart(4, '0')}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white mt-0.5">
                        {req.brand} {req.model} (<span className="font-mono text-cyan-400">{req.registration_no}</span>)
                      </h3>
                    </div>
                  </div>

                  {/* Dual Status Badge Displays */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Pickup Status</p>
                      <span className={`px-3 py-1 text-xs font-extrabold rounded-full border inline-block mt-0.5 ${
                        req.pickup_status === 'Picked Up'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : req.pickup_status === 'Accepted' || req.pickup_status === 'Pickup Scheduled'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}>
                        ● {req.pickup_status}
                      </span>
                    </div>

                    <div className="text-right border-l border-slate-800 pl-3">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Service Status</p>
                      <span className="px-3 py-1 text-xs font-bold rounded-full border bg-slate-800 text-slate-200 border-slate-700 inline-block mt-0.5">
                        {req.service_status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Main Details Grid */}
                <div className="grid md:grid-cols-3 gap-6 text-xs text-slate-300">
                  
                  {/* Column 1: Customer & Contact */}
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-amber-400" /> Customer Contact:
                    </p>
                    <p className="text-sm font-bold text-white">{req.customer_name}</p>
                    <div className="space-y-1 text-slate-300">
                      <p className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-cyan-300">{req.customer_phone}</span>
                      </p>
                      {req.customer_email && (
                        <p className="text-slate-400 truncate">{req.customer_email}</p>
                      )}
                    </div>
                  </div>

                  {/* Column 2: Pickup Location & Instructions */}
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" /> Door-Step Pickup Address:
                    </p>
                    <p className="text-white font-medium leading-relaxed">{req.full_address}</p>
                    {req.instructions && (
                      <div className="pt-2 border-t border-slate-800/80">
                        <p className="text-[11px] text-amber-300 italic">
                          "Instructions: {req.instructions}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Column 3: Service Schedule & Insurance Documents */}
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" /> Service Schedule:
                    </p>
                    <p className="text-white font-semibold">{req.service_type}</p>
                    <p className="text-slate-300">Date: <strong className="text-slate-100">{new Date(req.booking_date).toLocaleDateString()}</strong></p>
                    <p className="text-slate-300">Slot: <strong className="text-cyan-300">{req.preferred_time_slot}</strong></p>

                    {/* Insurance Document View Button */}
                    {req.insurance_documents && req.insurance_documents.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/80">
                        <p className="text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-cyan-400" /> Insurance Documents ({req.insurance_documents.length}):
                        </p>
                        <div className="space-y-1">
                          {req.insurance_documents.map((doc, idx) => (
                            <button
                              key={idx}
                              onClick={() => setViewDoc({ bookingId: req.booking_id, doc })}
                              className="w-full p-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded-lg border border-slate-800 text-[11px] font-medium flex items-center justify-between gap-1 transition-colors"
                            >
                              <span className="truncate">{doc.original_filename}</span>
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <Eye className="w-3 h-3 text-cyan-400" /> View
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* Status Action Bar */}
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Pickup Status Control */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Update Pickup Status:</label>
                      <select
                        value={req.pickup_status}
                        onChange={(e) => handleUpdatePickupStatus(req.booking_id, e.target.value)}
                        className="bg-slate-900 border border-amber-500/30 text-amber-300 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-amber-400"
                      >
                        <option value="Requested">Requested</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Pickup Scheduled">Pickup Scheduled</option>
                        <option value="Picked Up">Picked Up (Vehicle at Workshop)</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>

                    {/* Service Status Control */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Update Service Status:</label>
                      <select
                        value={req.service_status}
                        onChange={(e) => handleUpdateServiceStatus(req.booking_id, e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-cyan-500"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Requested on: {new Date(req.created_at).toLocaleString()}
                  </p>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* DOCUMENT VIEWER MODAL */}
      {viewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" /> Attached Insurance Document
              </h3>
              <button onClick={() => setViewDoc(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs text-slate-300">
              <p>Filename: <strong className="text-white">{viewDoc.doc.original_filename}</strong></p>
              <p>Type: <span className="text-cyan-300 font-mono">{viewDoc.doc.mime_type}</span></p>
              <p>Size: {(viewDoc.doc.file_size / 1024).toFixed(1)} KB</p>
            </div>

            <div className="flex gap-3 pt-2">
              <a
                href={`/api/appointments/${viewDoc.bookingId}/insurance/${viewDoc.doc.document_id}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl text-center flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" /> View / Open Document
              </a>

              <button
                onClick={() => setViewDoc(null)}
                className="py-3 px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
