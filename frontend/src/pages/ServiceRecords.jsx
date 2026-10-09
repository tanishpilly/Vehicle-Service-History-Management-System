import React, { useEffect, useState } from 'react';
import { Wrench, Plus, Trash2, CheckCircle2, AlertTriangle, IndianRupee, FileText, RefreshCw } from 'lucide-react';
import Modal from '../components/Modal';
import { api } from '../api/axiosClient';

export default function ServiceRecords({ selectedBookingForRecord, setActiveTab, onSelectInvoice }) {
  const [serviceRecords, setServiceRecords] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [spareParts, setSpareParts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Workflow Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    booking_id: '',
    mechanic_id: '',
    service_date: new Date().toISOString().split('T')[0],
    odometer_reading: '',
    description: '',
    labour_cost: 1500,
  });

  // Selected Spare Parts List: [{ part_id, quantity }]
  const [selectedParts, setSelectedParts] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recRes, bookRes, mechRes, partsRes] = await Promise.all([
        api.get('/service-records'),
        api.get('/bookings?status=Pending'),
        api.get('/mechanics'),
        api.get('/spare-parts')
      ]);

      setServiceRecords(recRes.data);

      // Combine Pending and In Progress bookings for selection
      const activeBookingsRes = await api.get('/bookings');
      const activeBookings = activeBookingsRes.data.filter(b => b.status === 'Pending' || b.status === 'In Progress');
      setBookings(activeBookings);

      setMechanics(mechRes.data);
      setSpareParts(partsRes.data);
    } catch (err) {
      console.error('Error fetching service workflow data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedBookingForRecord) {
      handleOpenCreateModal(selectedBookingForRecord);
    }
  }, [selectedBookingForRecord]);

  const handleOpenCreateModal = (bookingObj = null) => {
    const defaultBooking = bookingObj || (bookings.length > 0 ? bookings[0] : null);
    setFormData({
      booking_id: defaultBooking ? defaultBooking.booking_id : '',
      mechanic_id: mechanics.length > 0 ? mechanics[0].mechanic_id : '',
      service_date: new Date().toISOString().split('T')[0],
      odometer_reading: defaultBooking?.mileage ? defaultBooking.mileage + 500 : 45000,
      description: defaultBooking?.problem_description || 'Full maintenance and oil replacement',
      labour_cost: 1500,
    });
    setSelectedParts([]);
    setFormError('');
    setModalOpen(true);
  };

  // Add a spare part row
  const handleAddPartRow = () => {
    if (spareParts.length === 0) return;
    const defaultPart = spareParts[0];
    setSelectedParts([...selectedParts, { part_id: defaultPart.part_id, quantity: 1 }]);
  };

  // Update a spare part row
  const handlePartChange = (index, field, value) => {
    const updated = [...selectedParts];
    updated[index][field] = value;
    setSelectedParts(updated);
  };

  // Remove a spare part row
  const handleRemovePartRow = (index) => {
    setSelectedParts(selectedParts.filter((_, i) => i !== index));
  };

  // Calculate live costs
  const calculateCosts = () => {
    const labour = parseFloat(formData.labour_cost) || 0;
    let partsTotal = 0;

    selectedParts.forEach(item => {
      const part = spareParts.find(p => p.part_id === parseInt(item.part_id, 10));
      if (part) {
        partsTotal += parseFloat(part.price) * (parseInt(item.quantity, 10) || 0);
      }
    });

    const subtotal = labour + partsTotal;
    const gst = subtotal * 0.18;
    const grandTotal = subtotal + gst;

    return { labour, partsTotal, subtotal, gst, grandTotal };
  };

  const costs = calculateCosts();

  // Submit complete service record
  const handleSubmitService = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        labour_cost: parseFloat(formData.labour_cost) || 0,
        parts_used: selectedParts.map(p => ({
          part_id: parseInt(p.part_id, 10),
          quantity: parseInt(p.quantity, 10)
        }))
      };

      const res = await api.post('/service-records', payload);
      setSuccess('Service record completed successfully! PostgreSQL trigger automatically updated spare part inventory.');
      setModalOpen(false);
      fetchData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-400" />
            Service Record Creation Workflow
          </h3>
          <p className="text-xs text-slate-400">
            Executes a <code className="text-sky-400 font-mono">PostgreSQL Transaction</code>: inserts service record & parts used (trigger auto-deducts stock), completes booking, and generates invoice with 18% GST.
          </p>
        </div>

        <button
          onClick={() => handleOpenCreateModal()}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-xl transition flex items-center gap-2 shadow-lg shadow-amber-500/20 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Service</span>
        </button>
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{success}</span>
        </div>
      )}

      {/* Completed Service Records Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h4 className="font-bold text-slate-100 text-sm">Completed Service Records History</h4>
          <span className="text-xs text-slate-400">{serviceRecords.length} records</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
            <span>Loading service records...</span>
          </div>
        ) : serviceRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No service records completed yet. Click 'Record New Service' above to start!
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">Service ID</th>
                <th className="p-4">Date</th>
                <th className="p-4">Customer & Vehicle</th>
                <th className="p-4">Assigned Mechanic</th>
                <th className="p-4">Labour Cost</th>
                <th className="p-4">Parts Cost</th>
                <th className="p-4">Total Cost</th>
                <th className="p-4 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {serviceRecords.map((r) => (
                <tr key={r.service_id} className="hover:bg-slate-800/40 transition">
                  <td className="p-4 font-mono text-slate-400">#{r.service_id}</td>
                  <td className="p-4">{new Date(r.service_date).toLocaleDateString()}</td>
                  <td className="p-4">
                    <p className="font-bold text-slate-100">{r.customer_name}</p>
                    <p className="font-mono text-sky-400">{r.registration_no} ({r.brand} {r.model})</p>
                  </td>
                  <td className="p-4 text-slate-300 font-medium">{r.mechanic_name}</td>
                  <td className="p-4 font-mono">₹{parseFloat(r.labour_cost).toFixed(2)}</td>
                  <td className="p-4 font-mono">₹{parseFloat(r.parts_cost).toFixed(2)}</td>
                  <td className="p-4 font-mono font-bold text-emerald-400">₹{parseFloat(r.total_cost).toFixed(2)}</td>
                  <td className="p-4 text-right">
                    {r.invoice_id ? (
                      <button
                        onClick={() => {
                          if (onSelectInvoice) onSelectInvoice(r.invoice_id);
                          setActiveTab('invoices');
                        }}
                        className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg font-semibold inline-flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Invoice #{r.invoice_id}</span>
                      </button>
                    ) : (
                      <span className="text-slate-500 italic">No Invoice</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Complete Service Workflow Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Complete Service Record Workflow"
      >
        <form onSubmit={handleSubmitService} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-semibold space-y-1">
              <p className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> Error / Validation Trigger Failure:
              </p>
              <p>{formError}</p>
            </div>
          )}

          {/* Select Booking */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Select Service Booking *</label>
            {bookings.length === 0 ? (
              <p className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
                No pending or in-progress bookings available. Create a booking first!
              </p>
            ) : (
              <select
                required
                value={formData.booking_id}
                onChange={(e) => setFormData({ ...formData, booking_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              >
                <option value="" disabled>Select booking...</option>
                {bookings.map((b) => (
                  <option key={b.booking_id} value={b.booking_id}>
                    Booking #{b.booking_id} - {b.registration_no} ({b.customer_name}) [{b.service_type}]
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Assign Mechanic *</label>
              <select
                required
                value={formData.mechanic_id}
                onChange={(e) => setFormData({ ...formData, mechanic_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              >
                <option value="" disabled>Select mechanic...</option>
                {mechanics.map((m) => (
                  <option key={m.mechanic_id} value={m.mechanic_id}>
                    {m.name} ({m.specialization})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Service Completion Date *</label>
              <input
                type="date"
                required
                value={formData.service_date}
                onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Odometer Reading (km)</label>
              <input
                type="number"
                placeholder="42500"
                value={formData.odometer_reading}
                onChange={(e) => setFormData({ ...formData, odometer_reading: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Labour Charge (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.labour_cost}
                onChange={(e) => setFormData({ ...formData, labour_cost: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Service Description & Work Performed</label>
            <textarea
              rows={2}
              placeholder="Describe work completed, diagnostics, and checks..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Spare Parts Selection Section */}
          <div className="border-t border-slate-800 pt-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-bold text-slate-200">Spare Parts Used</h4>
                <p className="text-[11px] text-slate-400">PostgreSQL trigger <code className="text-sky-400">trg_update_spare_part_stock</code> will check and deduct stock.</p>
              </div>
              <button
                type="button"
                onClick={handleAddPartRow}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-400 font-semibold rounded-lg flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Spare Part
              </button>
            </div>

            {selectedParts.length === 0 ? (
              <p className="text-slate-500 italic py-2">No spare parts selected for this service.</p>
            ) : (
              <div className="space-y-2">
                {selectedParts.map((item, index) => {
                  const partObj = spareParts.find(p => p.part_id === parseInt(item.part_id, 10));
                  return (
                    <div key={index} className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <select
                        value={item.part_id}
                        onChange={(e) => handlePartChange(index, 'part_id', e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                      >
                        {spareParts.map((p) => (
                          <option key={p.part_id} value={p.part_id}>
                            {p.part_name} - ₹{parseFloat(p.price).toFixed(2)} (Stock: {p.stock_quantity})
                          </option>
                        ))}
                      </select>

                      <div className="w-24">
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => handlePartChange(index, 'quantity', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono text-center"
                        />
                      </div>

                      <div className="w-24 text-right font-mono text-emerald-400 font-bold">
                        ₹{(partObj ? parseFloat(partObj.price) * (parseInt(item.quantity, 10) || 0) : 0).toFixed(2)}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemovePartRow(index)}
                        className="p-1.5 text-slate-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cost Summary Box */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-slate-300 font-mono">
            <div className="flex justify-between"><span>Labour Cost:</span><span>₹{costs.labour.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Parts Total:</span><span>₹{costs.partsTotal.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-slate-100"><span>Subtotal:</span><span>₹{costs.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-slate-400"><span>GST (18%):</span><span>₹{costs.gst.toFixed(2)}</span></div>
            <div className="flex justify-between font-extrabold text-emerald-400 text-sm border-t border-slate-800 pt-1">
              <span>Grand Total (Invoice):</span>
              <span>₹{costs.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || bookings.length === 0}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {submitting ? 'Executing PostgreSQL Transaction...' : 'Complete Service & Generate Invoice'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
