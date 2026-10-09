import React, { useEffect, useState, useRef } from 'react';
import { Car, Plus, Search, Edit2, Trash2, History, RefreshCw, QrCode, Download, Printer, ExternalLink, Globe, Laptop } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Modal from '../components/Modal';
import { api } from '../api/axiosClient';

export default function Vehicles({ setActiveTab, onSelectHistoryReg }) {
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // LAN IP Network Info
  const [lanIp, setLanIp] = useState('');
  const [qrUrlMode, setQrUrlMode] = useState('lan'); // 'lan' or 'localhost'

  // Vehicle Form Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    registration_no: '',
    brand: '',
    model: '',
    manufacturing_year: new Date().getFullYear(),
    fuel_type: 'Petrol',
    mileage: 0
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // QR Code Modal State
  const [qrModalVehicle, setQrModalVehicle] = useState(null);
  const qrRef = useRef(null);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError('');
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await api.get(`/vehicles${query}`);
      setVehicles(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load vehicles.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomersList = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (err) {
      console.error('Error fetching customers dropdown:', err);
    }
  };

  const fetchNetworkInfo = async () => {
    try {
      const res = await api.get('/network-info');
      if (res.lanIp && res.lanIp !== 'localhost') {
        setLanIp(res.lanIp);
      }
    } catch (err) {
      console.error('Error fetching network info:', err);
    }
  };

  useEffect(() => {
    fetchVehicles();
    fetchCustomersList();
    fetchNetworkInfo();
  }, [search]);

  const handleOpenAddModal = () => {
    setEditingVehicle(null);
    setFormData({
      customer_id: customers.length > 0 ? customers[0].customer_id : '',
      registration_no: '',
      brand: '',
      model: '',
      manufacturing_year: 2024,
      fuel_type: 'Petrol',
      mileage: 12000
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (v) => {
    setEditingVehicle(v);
    setFormData({
      customer_id: v.customer_id,
      registration_no: v.registration_no,
      brand: v.brand,
      model: v.model,
      manufacturing_year: v.manufacturing_year || 2023,
      fuel_type: v.fuel_type || 'Petrol',
      mileage: v.mileage || 0
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      if (editingVehicle) {
        await api.put(`/vehicles/${editingVehicle.vehicle_id}`, formData);
        setSuccess(`Vehicle '${formData.registration_no}' updated successfully.`);
      } else {
        await api.post('/vehicles', formData);
        setSuccess(`Vehicle '${formData.registration_no}' registered successfully.`);
      }
      setModalOpen(false);
      fetchVehicles();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id, reg) => {
    if (!window.confirm(`Are you sure you want to delete vehicle '${reg}'?`)) return;

    try {
      await api.delete(`/vehicles/${id}`);
      setSuccess(`Vehicle '${reg}' deleted successfully.`);
      fetchVehicles();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Download QR Code as PNG image
  const handleDownloadQR = () => {
    if (!qrRef.current) return;
    const svgElement = qrRef.current.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;

      // Draw background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw QR image
      ctx.drawImage(img, 20, 20);

      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `${qrModalVehicle?.registration_no}_Service_QR.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handlePrintQRTag = () => {
    window.print();
  };

  // Generate QR Code URL (LAN IP or Localhost)
  const getVehicleQrUrl = (regNo) => {
    const port = window.location.port || '5173';
    const protocol = window.location.protocol;

    if (qrUrlMode === 'lan' && lanIp) {
      return `${protocol}//${lanIp}:${port}/?reg=${encodeURIComponent(regNo)}`;
    }
    return `${protocol}//${window.location.host}/?reg=${encodeURIComponent(regNo)}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search reg. no (e.g. TS09AB1234), brand..."
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
          <span>Register New Vehicle</span>
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
          <button onClick={fetchVehicles} className="underline">Retry</button>
        </div>
      )}

      {/* Vehicles Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
            <span>Loading vehicle registry...</span>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No vehicles registered in PostgreSQL database matching search.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">Reg. Number</th>
                <th className="p-4">Brand & Model</th>
                <th className="p-4">Customer / Owner</th>
                <th className="p-4">Year</th>
                <th className="p-4">Fuel</th>
                <th className="p-4">Vehicle QR Code</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {vehicles.map((v) => (
                <tr key={v.vehicle_id} className="hover:bg-slate-800/40 transition">
                  <td className="p-4 font-mono font-bold text-sky-400">{v.registration_no}</td>
                  <td className="p-4 font-medium text-slate-100">{v.brand} {v.model}</td>
                  <td className="p-4 text-slate-300">{v.customer_name} <span className="text-slate-500">({v.customer_phone})</span></td>
                  <td className="p-4 text-slate-400">{v.manufacturing_year || '—'}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-md text-[11px]">
                      {v.fuel_type || 'Petrol'}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => setQrModalVehicle(v)}
                      className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>View QR Code</span>
                    </button>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        if (onSelectHistoryReg) onSelectHistoryReg(v.registration_no);
                        setActiveTab('history');
                      }}
                      className="px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 rounded-lg text-xs font-semibold"
                      title="View Service History"
                    >
                      History
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(v)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-sky-400 hover:bg-slate-700 transition"
                      title="Edit Vehicle"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(v.vehicle_id, v.registration_no)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-rose-400 hover:bg-slate-700 transition"
                      title="Delete Vehicle"
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

      {/* Add / Edit Vehicle Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingVehicle ? 'Edit Vehicle Details' : 'Register New Vehicle'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Customer / Owner *</label>
            <select
              required
              value={formData.customer_id}
              onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
            >
              <option value="" disabled>Select a customer...</option>
              {customers.map((c) => (
                <option key={c.customer_id} value={c.customer_id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Registration Number *</label>
            <input
              type="text"
              required
              placeholder="e.g. TS09AB1234"
              value={formData.registration_no}
              onChange={(e) => setFormData({ ...formData, registration_no: e.target.value.toUpperCase() })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Brand *</label>
              <input
                type="text"
                required
                placeholder="e.g. Mahindra"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Model *</label>
              <input
                type="text"
                required
                placeholder="e.g. Thar"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Manufacturing Year</label>
              <input
                type="number"
                placeholder="2024"
                value={formData.manufacturing_year}
                onChange={(e) => setFormData({ ...formData, manufacturing_year: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Fuel Type</label>
              <select
                value={formData.fuel_type}
                onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              >
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="CNG">CNG</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Mileage (km)</label>
              <input
                type="number"
                placeholder="12000"
                value={formData.mileage}
                onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
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
              {formSubmitting ? 'Saving...' : editingVehicle ? 'Update Vehicle' : 'Register Vehicle'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Vehicle QR Code Modal */}
      <Modal
        isOpen={!!qrModalVehicle}
        onClose={() => setQrModalVehicle(null)}
        title={qrModalVehicle ? `Vehicle QR Code: ${qrModalVehicle.registration_no}` : 'Vehicle QR Code'}
      >
        {qrModalVehicle && (
          <div className="space-y-6 text-xs text-center">
            {/* Vehicle Card Header */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Service History Tag</span>
              <h3 className="text-xl font-extrabold font-mono text-sky-400">{qrModalVehicle.registration_no}</h3>
              <p className="font-semibold text-slate-200">{qrModalVehicle.brand} {qrModalVehicle.model} ({qrModalVehicle.fuel_type})</p>
              <p className="text-slate-400">Owner: <span className="text-slate-200 font-medium">{qrModalVehicle.customer_name}</span> ({qrModalVehicle.customer_phone})</p>
            </div>

            {/* URL Mode Switcher Toggle (Wi-Fi LAN IP for Mobile Phones vs Localhost for Laptop) */}
            {lanIp && (
              <div className="flex items-center justify-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 w-fit mx-auto">
                <button
                  onClick={() => setQrUrlMode('lan')}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                    qrUrlMode === 'lan'
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Wi-Fi Network URL ({lanIp})</span>
                </button>

                <button
                  onClick={() => setQrUrlMode('localhost')}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                    qrUrlMode === 'localhost'
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>Localhost</span>
                </button>
              </div>
            )}

            {/* QR Code Graphic Box */}
            <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border-4 border-amber-500/30 w-fit mx-auto shadow-2xl" ref={qrRef}>
              <QRCodeSVG
                value={getVehicleQrUrl(qrModalVehicle.registration_no)}
                size={210}
                level="H"
                includeMargin={true}
              />
              <p className="text-[11px] font-mono text-slate-800 mt-2 font-bold tracking-tight">
                SCAN TO VIEW SERVICE HISTORY
              </p>
              <p className="text-[10px] font-mono text-slate-500 truncate max-w-[220px]">
                {getVehicleQrUrl(qrModalVehicle.registration_no)}
              </p>
            </div>

            {/* Explanatory Note */}
            <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl text-left text-sky-300 text-xs">
              <p className="font-bold flex items-center gap-1.5 mb-0.5">
                <QrCode className="w-4 h-4" /> Live PostgreSQL Integration:
              </p>
              <p className="text-[11px] text-slate-300">
                Scanning this QR code opens the vehicle's Service History page, executing <code className="text-sky-400 font-mono">get_vehicle_service_history('{qrModalVehicle.registration_no}')</code> against PostgreSQL to render real-time history.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
              <button
                onClick={handleDownloadQR}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>Download PNG</span>
              </button>

              <button
                onClick={handlePrintQRTag}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Print QR Tag</span>
              </button>

              <button
                onClick={() => {
                  if (onSelectHistoryReg) onSelectHistoryReg(qrModalVehicle.registration_no);
                  setQrModalVehicle(null);
                  setActiveTab('history');
                }}
                className="px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-sky-500/20 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open History</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
