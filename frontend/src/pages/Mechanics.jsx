import React, { useEffect, useState } from 'react';
import { UserCheck, Plus, Edit2, Phone, Award, Wrench, RefreshCw } from 'lucide-react';
import Modal from '../components/Modal';
import { api } from '../api/axiosClient';

export default function Mechanics() {
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMechanic, setEditingMechanic] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', specialization: 'General Service', experience_years: 3 });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchMechanics = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/mechanics');
      setMechanics(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load mechanics roster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMechanics();
  }, []);

  const handleOpenAddModal = () => {
    setEditingMechanic(null);
    setFormData({ name: '', phone: '', specialization: 'General Service', experience_years: 3 });
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (m) => {
    setEditingMechanic(m);
    setFormData({
      name: m.name || '',
      phone: m.phone || '',
      specialization: m.specialization || 'General Service',
      experience_years: m.experience_years || 0
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      if (editingMechanic) {
        await api.put(`/mechanics/${editingMechanic.mechanic_id}`, formData);
        setSuccess(`Mechanic '${formData.name}' updated successfully.`);
      } else {
        await api.post('/mechanics', formData);
        setSuccess(`Mechanic '${formData.name}' registered successfully.`);
      }
      setModalOpen(false);
      fetchMechanics();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-sky-400" />
            Mechanic Staff Roster
          </h3>
          <p className="text-xs text-slate-400">Manage qualified technicians assigned to vehicle services</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm rounded-xl transition flex items-center gap-2 shadow-lg shadow-sky-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Mechanic</span>
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
          <button onClick={fetchMechanics} className="underline">Retry</button>
        </div>
      )}

      {/* Mechanics Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
          <span>Loading mechanics roster...</span>
        </div>
      ) : mechanics.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-sm bg-slate-900 border border-slate-800 rounded-2xl">
          No mechanics registered yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mechanics.map((m) => (
            <div key={m.mechanic_id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    ID #{m.mechanic_id}
                  </span>
                  <button
                    onClick={() => handleOpenEditModal(m)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-sky-400 hover:bg-slate-700 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <h4 className="font-bold text-slate-100 text-base">{m.name}</h4>
                  <p className="text-xs font-semibold text-sky-400 flex items-center gap-1 mt-0.5">
                    <Wrench className="w-3 h-3" /> {m.specialization || 'General Service'}
                  </p>
                </div>

                <div className="space-y-1 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500" /> {m.phone || 'No contact provided'}
                  </p>
                  <p className="flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-slate-500" /> {m.experience_years || 0} Years Experience
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Completed Services:</span>
                <span className="font-bold font-mono text-emerald-400">{m.completed_services_count || 0} Services</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Mechanic Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingMechanic ? 'Edit Mechanic Details' : 'Add New Mechanic'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Mechanic Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Kumar"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
            <input
              type="text"
              placeholder="e.g. 9876543210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Specialization</label>
              <input
                type="text"
                placeholder="e.g. Engine & Transmission"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Experience (Years)</label>
              <input
                type="number"
                min="0"
                placeholder="5"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
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
              {formSubmitting ? 'Saving...' : editingMechanic ? 'Update Mechanic' : 'Add Mechanic'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
