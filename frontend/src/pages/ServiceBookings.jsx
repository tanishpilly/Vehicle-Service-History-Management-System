import React, { useEffect, useState } from 'react';
import { CalendarCheck, Plus, Search, RefreshCw, CheckCircle2, Clock, Wrench, User, Car, UserPlus } from 'lucide-react';
import Modal from '../components/Modal';
import { api } from '../api/axiosClient';

export default function ServiceBookings({ setActiveTab, onSelectBookingForRecord }) {
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal Mode: 'existing' (Select Existing Vehicle) or 'new' (Register New Customer & Vehicle)
  const [bookingMode, setBookingMode] = useState('existing');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    // Existing Vehicle Mode
    vehicle_id: '',
    
    // New Customer & Vehicle Mode
    new_customer_name: '',
    new_customer_phone: '',
    new_customer_email: '',
    new_customer_address: '',
    new_registration_no: '',
    new_brand: '',
    new_model: '',
    new_manufacturing_year: 2024,
    new_fuel_type: 'Petrol',
    new_mileage: 10000,

    // Common Booking Fields
    booking_date: new Date().toISOString().split('T')[0],
    service_type: 'Periodic Service',
    problem_description: ''
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');
      let url = '/bookings';
      const params = [];
      if (statusFilter) params.push(`status=${encodeURIComponent(statusFilter)}`);
      if (search) params.push(`search=${encodeURIComponent(search)}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const res = await api.get(url);
      setBookings(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  const fetchVehiclesList = async () => {
    try {
      const res = await api.get('/vehicles');
      setVehicles(res.data);
    } catch (err) {
      console.error('Error loading vehicles for booking:', err);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchVehiclesList();
  }, [statusFilter, search]);

  const handleOpenModal = () => {
    setBookingMode('existing');
    setFormData({
      vehicle_id: vehicles.length > 0 ? vehicles[0].vehicle_id : '',
      new_customer_name: '',
      new_customer_phone: '',
      new_customer_email: '',
      new_customer_address: '',
      new_registration_no: '',
      new_brand: '',
      new_model: '',
      new_manufacturing_year: 2024,
      new_fuel_type: 'Petrol',
      new_mileage: 10000,
      booking_date: new Date().toISOString().split('T')[0],
      service_type: 'Periodic Service',
      problem_description: ''
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSaveBooking = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      let finalVehicleId = formData.vehicle_id;

      if (bookingMode === 'new') {
        // Step 1: Create New Customer
        if (!formData.new_customer_name || !formData.new_customer_phone) {
          throw new Error('New customer name and phone number are required.');
        }
        if (!formData.new_registration_no || !formData.new_brand || !formData.new_model) {
          throw new Error('Vehicle registration number, brand, and model are required.');
        }

        const custRes = await api.post('/customers', {
          name: formData.new_customer_name,
          phone: formData.new_customer_phone,
          email: formData.new_customer_email || null,
          address: formData.new_customer_address || null
        });

        const newCustId = custRes.data.customer_id;

        // Step 2: Register New Vehicle
        const vehRes = await api.post('/vehicles', {
          customer_id: newCustId,
          registration_no: formData.new_registration_no.toUpperCase(),
          brand: formData.new_brand,
          model: formData.new_model,
          manufacturing_year: parseInt(formData.new_manufacturing_year, 10) || null,
          fuel_type: formData.new_fuel_type || 'Petrol',
          mileage: parseInt(formData.new_mileage, 10) || 0
        });

        finalVehicleId = vehRes.data.vehicle_id;
      }

      if (!finalVehicleId) {
        throw new Error('Please select or register a vehicle.');
      }

      // Step 3: Create Service Booking
      await api.post('/bookings', {
        vehicle_id: finalVehicleId,
        booking_date: formData.booking_date,
        service_type: formData.service_type,
        problem_description: formData.problem_description || null
      });

      setSuccess(
        bookingMode === 'new'
          ? `Registered new customer '${formData.new_customer_name}', vehicle '${formData.new_registration_no.toUpperCase()}', and created service booking successfully!`
          : 'Service booking created successfully.'
      );
      setModalOpen(false);
      fetchVehiclesList();
      fetchBookings();
      setTimeout(() => setSuccess(''), 5000);

    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await api.put(`/bookings/${bookingId}`, { status: newStatus });
      setSuccess(`Booking #${bookingId} status updated to '${newStatus}'.`);
      fetchBookings();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar with Filter & Add Button */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {['', 'Pending', 'In Progress', 'Completed', 'Cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {st || 'All Bookings'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search booking..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <button
            onClick={handleOpenModal}
            className="px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm rounded-xl transition flex items-center gap-2 shadow-lg shadow-sky-500/20 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Create Booking</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          {success}
        </div>
      )}
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchBookings} className="underline">Retry</button>
        </div>
      )}

      {/* Bookings Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
            <span>Loading service bookings...</span>
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No service bookings found matching status/search.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Vehicle</th>
                <th className="p-4">Service Type</th>
                <th className="p-4">Booking Date</th>
                <th className="p-4">Problem Description</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Workflow Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {bookings.map((b) => (
                <tr key={b.booking_id} className="hover:bg-slate-800/40 transition">
                  <td className="p-4 font-mono text-slate-400">#{b.booking_id}</td>
                  <td className="p-4 font-semibold text-slate-100">{b.customer_name}</td>
                  <td className="p-4 font-mono text-sky-400">
                    {b.registration_no} <span className="text-slate-400 font-sans">({b.brand} {b.model})</span>
                  </td>
                  <td className="p-4 font-medium text-slate-200">{b.service_type}</td>
                  <td className="p-4">{new Date(b.booking_date).toLocaleDateString()}</td>
                  <td className="p-4 max-w-xs truncate text-slate-400" title={b.problem_description || ''}>
                    {b.problem_description || 'Standard service check'}
                  </td>
                  <td className="p-4">
                    <select
                      value={b.status}
                      onChange={(e) => handleStatusChange(b.booking_id, e.target.value)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border bg-slate-950 focus:outline-none cursor-pointer ${
                        b.status === 'Completed'
                          ? 'text-emerald-400 border-emerald-500/30'
                          : b.status === 'In Progress'
                          ? 'text-amber-400 border-amber-500/30'
                          : b.status === 'Cancelled'
                          ? 'text-rose-400 border-rose-500/30'
                          : 'text-sky-400 border-sky-500/30'
                      }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="p-4 text-right">
                    {b.status !== 'Completed' ? (
                      <button
                        onClick={() => {
                          if (onSelectBookingForRecord) onSelectBookingForRecord(b);
                          setActiveTab('records');
                        }}
                        className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-semibold flex items-center gap-1.5 ml-auto"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Perform Service</span>
                      </button>
                    ) : (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1 justify-end">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Service Record Done
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* New Booking Modal with Mode Toggle (Existing Vehicle vs New Customer & Vehicle) */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create New Service Booking"
      >
        <form onSubmit={handleSaveBooking} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-semibold">
              {formError}
            </div>
          )}

          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setBookingMode('existing')}
              className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
                bookingMode === 'existing'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>Select Existing Vehicle</span>
            </button>

            <button
              type="button"
              onClick={() => setBookingMode('new')}
              className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
                bookingMode === 'new'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Register New Customer & Vehicle</span>
            </button>
          </div>

          {/* Mode 1: Select Existing Vehicle */}
          {bookingMode === 'existing' && (
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Select Existing Vehicle *</label>
              <select
                required
                value={formData.vehicle_id}
                onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              >
                <option value="" disabled>Select vehicle...</option>
                {vehicles.map((v) => (
                  <option key={v.vehicle_id} value={v.vehicle_id}>
                    {v.registration_no} - {v.brand} {v.model} (Owner: {v.customer_name})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Mode 2: Register New Customer & Vehicle */}
          {bookingMode === 'new' && (
            <div className="space-y-4 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
              <div className="space-y-3">
                <h4 className="font-bold text-sky-400 text-xs flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                  <User className="w-3.5 h-3.5" /> 1. New Customer Information
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Manikanta G"
                      value={formData.new_customer_name}
                      onChange={(e) => setFormData({ ...formData, new_customer_name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Phone Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 9876543210"
                      value={formData.new_customer_phone}
                      onChange={(e) => setFormData({ ...formData, new_customer_phone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. customer@example.com"
                      value={formData.new_customer_email}
                      onChange={(e) => setFormData({ ...formData, new_customer_email: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Address</label>
                    <input
                      type="text"
                      placeholder="e.g. Guntur"
                      value={formData.new_customer_address}
                      onChange={(e) => setFormData({ ...formData, new_customer_address: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-sky-400 text-xs flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                  <Car className="w-3.5 h-3.5" /> 2. New Vehicle Registration
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Reg. Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. TS09AB9999"
                      value={formData.new_registration_no}
                      onChange={(e) => setFormData({ ...formData, new_registration_no: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Brand *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Toyota"
                      value={formData.new_brand}
                      onChange={(e) => setFormData({ ...formData, new_brand: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Model *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Fortuner"
                      value={formData.new_model}
                      onChange={(e) => setFormData({ ...formData, new_model: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Year</label>
                    <input
                      type="number"
                      placeholder="2024"
                      value={formData.new_manufacturing_year}
                      onChange={(e) => setFormData({ ...formData, new_manufacturing_year: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Fuel Type</label>
                    <select
                      value={formData.new_fuel_type}
                      onChange={(e) => setFormData({ ...formData, new_fuel_type: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    >
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="CNG">CNG</option>
                      <option value="Electric">Electric</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Mileage (km)</label>
                    <input
                      type="number"
                      placeholder="10000"
                      value={formData.new_mileage}
                      onChange={(e) => setFormData({ ...formData, new_mileage: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Service Booking Information */}
          <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Booking Date *</label>
              <input
                type="date"
                required
                value={formData.booking_date}
                onChange={(e) => setFormData({ ...formData, booking_date: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Service Type *</label>
              <select
                value={formData.service_type}
                onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              >
                <option value="Periodic Service">Periodic Service</option>
                <option value="General Service">General Service</option>
                <option value="Brake Overhaul">Brake Overhaul</option>
                <option value="Clutch Service">Clutch Service</option>
                <option value="Electrical Service">Electrical Service</option>
                <option value="Transmission Service">Transmission Service</option>
                <option value="Engine Repair">Engine Repair</option>
                <option value="AC Maintenance">AC Maintenance</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Problem Description</label>
            <textarea
              rows={2}
              placeholder="Describe customer reported issues or requested services..."
              value={formData.problem_description}
              onChange={(e) => setFormData({ ...formData, problem_description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
            />
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
              disabled={formSubmitting}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-sky-500/20 disabled:opacity-50"
            >
              {formSubmitting
                ? 'Processing...'
                : bookingMode === 'new'
                ? 'Register Customer, Vehicle & Booking'
                : 'Create Booking'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
