import React, { useEffect, useState } from 'react';
import { Package, Plus, Search, Edit2, AlertTriangle, RefreshCw } from 'lucide-react';
import Modal from '../components/Modal';
import { api } from '../api/axiosClient';

export default function SpareParts() {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [formData, setFormData] = useState({ part_name: '', stock_quantity: 25, price: 1200 });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchParts = async () => {
    try {
      setLoading(true);
      setError('');
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await api.get(`/spare-parts${query}`);
      setParts(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load spare parts inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParts();
  }, [search]);

  const handleOpenAddModal = () => {
    setEditingPart(null);
    setFormData({ part_name: '', stock_quantity: 25, price: 1200 });
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (p) => {
    setEditingPart(p);
    setFormData({
      part_name: p.part_name || '',
      stock_quantity: p.stock_quantity ?? 0,
      price: parseFloat(p.price) || 0
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      if (editingPart) {
        await api.put(`/spare-parts/${editingPart.part_id}`, formData);
        setSuccess(`Spare part '${formData.part_name}' updated successfully.`);
      } else {
        await api.post('/spare-parts', formData);
        setSuccess(`Spare part '${formData.part_name}' added to inventory successfully.`);
      }
      setModalOpen(false);
      fetchParts();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
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
            placeholder="Search spare part name..."
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
          <span>Add Spare Part</span>
        </button>
      </div>

      {/* Alerts */}
      {success && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          {success}
        </div>
      )}
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchParts} className="underline">Retry</button>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-100 text-sm">Spare Parts Inventory</h4>
            <p className="text-xs text-slate-400">
              Stock automatically deducted by PostgreSQL trigger <code className="text-sky-400 font-mono">trg_update_spare_part_stock</code>
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">{parts.length} items listed</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
            <span>Loading inventory...</span>
          </div>
        ) : parts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No spare parts found matching search query.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">Part ID</th>
                <th className="p-4">Spare Part Name</th>
                <th className="p-4">Unit Price (₹)</th>
                <th className="p-4">Available Stock</th>
                <th className="p-4">Stock Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {parts.map((p) => {
                const isLowStock = p.stock_quantity < 20;
                return (
                  <tr key={p.part_id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-mono text-slate-400">#{p.part_id}</td>
                    <td className="p-4 font-semibold text-slate-100">{p.part_name}</td>
                    <td className="p-4 font-mono font-bold text-slate-200">₹{parseFloat(p.price).toFixed(2)}</td>
                    <td className="p-4 font-mono font-bold text-slate-100">{p.stock_quantity} units</td>
                    <td className="p-4">
                      {isLowStock ? (
                        <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold rounded-lg flex items-center gap-1.5 w-fit">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Low Stock (&lt; 20)
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold rounded-lg w-fit">
                          Sufficient Stock
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleOpenEditModal(p)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-sky-400 hover:bg-slate-700 transition"
                        title="Edit Part"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Spare Part Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPart ? 'Edit Spare Part' : 'Add New Spare Part'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Part Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Front Brake Pads"
              value={formData.part_name}
              onChange={(e) => setFormData({ ...formData, part_name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Stock Quantity *</label>
              <input
                type="number"
                min="0"
                required
                placeholder="25"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value, 10) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Unit Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="1200.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
              />
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
              disabled={formSubmitting}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-sky-500/20 disabled:opacity-50"
            >
              {formSubmitting ? 'Saving...' : editingPart ? 'Update Part' : 'Add Part'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
