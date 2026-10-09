import React, { useEffect, useState } from 'react';
import { Users, Plus, Search, Car, Edit2, Trash2, Phone, Mail, MapPin, RefreshCw, AlertCircle } from 'lucide-react';
import Modal from '../components/Modal';
import { api } from '../api/axiosClient';

export default function Customers({ setActiveTab }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // View Customer Drawer State
  const [viewCustomer, setViewCustomer] = useState(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError('');
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await api.get(`/customers${query}`);
      setCustomers(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load customers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', email: '', address: '' });
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (cust) => {
    setEditingCustomer(cust);
    setFormData({
      name: cust.name || '',
      phone: cust.phone || '',
      email: cust.email || '',
      address: cust.address || ''
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.customer_id}`, formData);
        setSuccess(`Customer '${formData.name}' updated successfully.`);
      } else {
        await api.post('/customers', formData);
        setSuccess(`Customer '${formData.name}' created successfully.`);
      }
      setModalOpen(false);
      fetchCustomers();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete customer '${name}'? This will also remove their linked vehicles.`)) return;

    try {
      await api.delete(`/customers/${id}`);
      setSuccess(`Customer '${name}' deleted successfully.`);
      fetchCustomers();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleViewCustomerDetails = async (cust) => {
    try {
      const res = await api.get(`/customers/${cust.customer_id}`);
      setViewCustomer(res.data);
    } catch (err) {
      alert(`Failed to load details: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search customer name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <button
          onClick={handleOpenAddModal}
          className="w-full sm:w-auto px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Alert Notifications */}
      {success && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          {success}
        </div>
      )}
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchCustomers} className="underline">Retry</button>
        </div>
      )}

      {/* Customers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
            <span>Loading customers...</span>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No customers found matching search query.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Customer Name</th>
                <th className="p-4">Phone Number</th>
                <th className="p-4">Email</th>
                <th className="p-4">Vehicles</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {customers.map((c) => (
                <tr key={c.customer_id} className="hover:bg-slate-800/40 transition">
                  <td className="p-4 font-mono text-slate-400">#{c.customer_id}</td>
                  <td className="p-4 font-semibold text-slate-100">{c.name}</td>
                  <td className="p-4 font-mono text-slate-300">{c.phone}</td>
                  <td className="p-4 text-slate-400">{c.email || '—'}</td>
                  <td className="p-4">
                    <button
                      onClick={() => handleViewCustomerDetails(c)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition border border-slate-700"
                    >
                      <Car className="w-3.5 h-3.5" />
                      <span>{c.vehicle_count} Vehicle{c.vehicle_count !== 1 ? 's' : ''}</span>
                    </button>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenEditModal(c)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-sky-400 hover:bg-slate-700 transition"
                      title="Edit Customer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.customer_id, c.name)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-rose-400 hover:bg-slate-700 transition"
                      title="Delete Customer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCustomer ? 'Edit Customer Information' : 'Add New Customer'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Tanish Pilly"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number *</label>
            <input
              type="text"
              required
              placeholder="e.g. 9876543210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              placeholder="e.g. tanish@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Address</label>
            <textarea
              rows={2}
              placeholder="e.g. Jubilee Hills, Hyderabad"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-sky-500/20 disabled:opacity-50"
            >
              {formSubmitting ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Create Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Customer Linked Vehicles Drawer Modal */}
      <Modal
        isOpen={!!viewCustomer}
        onClose={() => setViewCustomer(null)}
        title={`Customer: ${viewCustomer?.name}`}
      >
        {viewCustomer && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl space-y-1 text-slate-300 border border-slate-800">
              <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-sky-400" /> Phone: <span className="font-mono text-slate-100">{viewCustomer.phone}</span></p>
              <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-sky-400" /> Email: <span className="text-slate-100">{viewCustomer.email || 'N/A'}</span></p>
              <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-sky-400" /> Address: <span className="text-slate-100">{viewCustomer.address || 'N/A'}</span></p>
            </div>

            <div>
              <h4 className="font-bold text-slate-200 mb-2 text-sm flex items-center gap-2">
                <Car className="w-4 h-4 text-sky-400" />
                Linked Vehicles ({viewCustomer.vehicles?.length || 0})
              </h4>

              {viewCustomer.vehicles?.length === 0 ? (
                <p className="text-slate-500 italic">No vehicles registered under this customer yet.</p>
              ) : (
                <div className="space-y-2">
                  {viewCustomer.vehicles?.map((v) => (
                    <div key={v.vehicle_id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-bold font-mono text-sky-400">{v.registration_no}</p>
                        <p className="text-slate-300">{v.brand} {v.model} ({v.manufacturing_year || 'N/A'})</p>
                        <p className="text-[11px] text-slate-500">Fuel: {v.fuel_type} • Mileage: {v.mileage} km</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewCustomer(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
