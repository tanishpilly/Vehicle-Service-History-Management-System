import React, { useState, useEffect } from 'react';
import { 
  User, Car, Calendar, Clock, FileText, QrCode, Plus, CheckCircle2, 
  AlertCircle, RefreshCw, LogOut, Printer, Download, ChevronRight, ChevronLeft,
  Wrench, Shield, Sparkles, MapPin, Phone, Mail, DollarSign, PackageCheck,
  Truck, Upload, Trash2, Eye, File, Check
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api, BASE_URL } from '../api/axiosClient';

export default function CustomerDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('vehicles'); // 'vehicles' | 'book' | 'appointments' | 'history' | 'invoices' | 'profile'
  
  // Data States
  const [vehicles, setVehicles] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [history, setHistory] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Multi-Step Booking Form State
  const [bookingStep, setBookingStep] = useState(1);
  const [bookingForm, setBookingForm] = useState({
    vehicle_id: '',
    service_type: 'General Service',
    booking_date: new Date().toISOString().split('T')[0],
    preferred_time_slot: 'Morning (9:00 AM - 12:00 PM)',
    problem_description: '',
    odometer_reading: '',
    pickup_required: false,
    flat_building: '',
    street: '',
    area: '',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '',
    instructions: 'Please call 15 minutes before pickup.'
  });

  // Insurance Document Upload State
  const [insuranceFiles, setInsuranceFiles] = useState([]);
  const [fileError, setFileError] = useState('');

  // Post-Booking Confirmation Card Modal State
  const [bookingConfirmation, setBookingConfirmation] = useState(null);

  // New Vehicle Modal State
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    registration_no: '',
    brand: '',
    model: '',
    manufacturing_year: 2024,
    fuel_type: 'Petrol',
    mileage: 15000
  });

  // QR Modal State
  const [qrModalVehicle, setQrModalVehicle] = useState(null);

  // Invoice Print Modal State
  const [printInvoice, setPrintInvoice] = useState(null);

  // Profile Edit State
  const [editProfile, setEditProfile] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  // Fetch all customer data
  const loadCustomerData = async () => {
    setLoading(true);
    setError('');
    try {
      const [vehRes, apptRes, histRes, invRes, profRes] = await Promise.allSettled([
        api.get('/customer-portal/vehicles'),
        api.get('/appointments/my-appointments'),
        api.get('/customer-portal/history'),
        api.get('/customer-portal/invoices'),
        api.get('/customer-portal/profile')
      ]);

      if (vehRes.status === 'fulfilled') setVehicles(vehRes.value.vehicles || []);
      if (apptRes.status === 'fulfilled') setAppointments(apptRes.value.appointments || []);
      if (histRes.status === 'fulfilled') setHistory(histRes.value.history || []);
      if (invRes.status === 'fulfilled') setInvoices(invRes.value.invoices || []);
      if (profRes.status === 'fulfilled') {
        setProfile(profRes.value.customer);
        setEditProfile({
          name: profRes.value.customer?.name || '',
          phone: profRes.value.customer?.phone || '',
          email: profRes.value.customer?.email || '',
          address: profRes.value.customer?.address || ''
        });
      }
    } catch {
      setError('Failed to load customer dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerData();
  }, []);

  // Handle Register New Vehicle
  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      const data = await api.post('/customer-portal/vehicles', newVehicle);
      setSuccessMsg(data.message || 'Vehicle registered!');
      setNewVehicle({
        registration_no: '',
        brand: '',
        model: '',
        manufacturing_year: 2024,
        fuel_type: 'Petrol',
        mileage: 15000
      });
      setShowAddVehicleModal(false);
      loadCustomerData();
    } catch (err) {
      setError(err.message || 'Failed to add vehicle.');
    }
  };

  // Handle File Upload Selection
  const handleFileSelect = (e) => {
    setFileError('');
    const files = Array.from(e.target.files);
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const validFiles = [];

    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        setFileError(`Invalid file type '${file.name}'. Only PDF, JPG, JPEG, and PNG files are allowed.`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setFileError(`File '${file.name}' exceeds the maximum size limit of 10MB.`);
        return;
      }
      validFiles.push(file);
    }

    setInsuranceFiles(prev => [...prev, ...validFiles]);
  };

  const removeInsuranceFile = (index) => {
    setInsuranceFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Submit Multi-Step Service Appointment Request with Multer Upload
  const handleMultiStepSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('vehicle_id', bookingForm.vehicle_id);
      formData.append('service_type', bookingForm.service_type);
      formData.append('booking_date', bookingForm.booking_date);
      formData.append('preferred_time_slot', bookingForm.preferred_time_slot);
      formData.append('problem_description', bookingForm.problem_description);
      if (bookingForm.odometer_reading) formData.append('odometer_reading', bookingForm.odometer_reading);

      formData.append('pickup_required', bookingForm.pickup_required);
      if (bookingForm.pickup_required) {
        formData.append('flat_building', bookingForm.flat_building);
        formData.append('street', bookingForm.street);
        formData.append('area', bookingForm.area);
        formData.append('city', bookingForm.city);
        formData.append('state', bookingForm.state);
        formData.append('pincode', bookingForm.pincode);
        formData.append('instructions', bookingForm.instructions);
      }

      insuranceFiles.forEach(file => {
        formData.append('insurance_docs', file);
      });

      // Submit via fetch with Bearer token
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/appointments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Appointment submission failed');

      setBookingConfirmation(data.booking);
      setSuccessMsg('Service Appointment Requested Successfully!');

      // Reset form
      setBookingForm({
        vehicle_id: '',
        service_type: 'General Service',
        booking_date: new Date().toISOString().split('T')[0],
        preferred_time_slot: 'Morning (9:00 AM - 12:00 PM)',
        problem_description: '',
        odometer_reading: '',
        pickup_required: false,
        flat_building: '',
        street: '',
        area: '',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '',
        instructions: 'Please call 15 minutes before pickup.'
      });
      setInsuranceFiles([]);
      setBookingStep(1);

      loadCustomerData();
    } catch (err) {
      setError(err.message || 'Failed to submit appointment.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Update Profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      const data = await api.put('/customer-portal/profile', editProfile);
      setSuccessMsg('Profile updated successfully!');
      setProfile(data.customer);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    }
  };

  const getQrUrl = (regNo) => {
    const envAppUrl = import.meta.env.VITE_APP_URL;
    if (envAppUrl) {
      const base = envAppUrl.endsWith('/') ? envAppUrl.slice(0, -1) : envAppUrl;
      return `${base}/?reg=${encodeURIComponent(regNo)}`;
    }
    const host = window.location.host;
    return `${window.location.protocol}//${host}/?reg=${encodeURIComponent(regNo)}`;
  };

  const selectedVehicleObj = vehicles.find(v => String(v.vehicle_id) === String(bookingForm.vehicle_id));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      
      {/* Customer Header Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">Customer Portal</h1>
              <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full font-bold">
                PRIMARY INTERFACE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Welcome back, <strong className="text-slate-200">{user?.customerName || user?.username}</strong>
            </p>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-3">
          <button
            onClick={loadCustomerData}
            title="Refresh Data"
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
          
          <button
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200"
          >
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">My Profile</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-semibold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
        
        {/* Banner Quick Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{vehicles.length}</p>
              <p className="text-xs text-slate-400">My Vehicles</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{appointments.length}</p>
              <p className="text-xs text-slate-400">Appointments</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{history.length}</p>
              <p className="text-xs text-slate-400">Services Completed</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{invoices.length}</p>
              <p className="text-xs text-slate-400">Official Invoices</p>
            </div>
          </div>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 overflow-x-auto gap-2 pb-1">
          {[
            { id: 'vehicles', label: 'My Vehicles', icon: Car, count: vehicles.length },
            { id: 'book', label: 'Book Service & Pickup', icon: Calendar },
            { id: 'appointments', label: 'My Appointments & Pickup Status', icon: Truck, count: appointments.length },
            { id: 'history', label: 'Service History', icon: Wrench, count: history.length },
            { id: 'invoices', label: 'Invoices', icon: FileText, count: invoices.length },
            { id: 'profile', label: 'My Profile', icon: User },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs md:text-sm font-semibold rounded-t-xl transition-all shrink-0 ${
                  isActive
                    ? 'bg-slate-900 text-cyan-400 border-t-2 border-cyan-400 border-x border-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: MY VEHICLES */}
        {activeTab === 'vehicles' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">My Registered Vehicles</h2>
                <p className="text-xs text-slate-400">View your vehicles, generate QR code tags, and request service appointments</p>
              </div>

              <button
                onClick={() => setShowAddVehicleModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all"
              >
                <Plus className="w-4 h-4" /> Add New Vehicle
              </button>
            </div>

            {vehicles.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-slate-900/50 border border-slate-800">
                <Car className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">No Vehicles Registered Yet</h3>
                <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
                  Add your vehicle registration number, brand, and model to book service appointments and generate QR codes.
                </p>
                <button
                  onClick={() => setShowAddVehicleModal(true)}
                  className="px-4 py-2 bg-cyan-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-cyan-400 transition-colors"
                >
                  + Add Your First Vehicle
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vehicles.map(veh => (
                  <div
                    key={veh.vehicle_id}
                    className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            {veh.fuel_type || 'Petrol'}
                          </span>
                          <h3 className="text-lg font-bold text-white mt-1">
                            {veh.brand} {veh.model}
                          </h3>
                        </div>

                        {/* QR Code Tag Button */}
                        <button
                          onClick={() => setQrModalVehicle(veh)}
                          title="Generate QR Code"
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl border border-slate-700 transition-colors"
                        >
                          <QrCode className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-2 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Registration No:</span>
                          <span className="font-mono font-bold text-cyan-300">{veh.registration_no}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Manufacturing Year:</span>
                          <span className="font-medium text-slate-200">{veh.manufacturing_year}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Current Mileage:</span>
                          <span className="font-medium text-slate-200">{veh.mileage?.toLocaleString()} km</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setBookingForm(prev => ({ ...prev, vehicle_id: veh.vehicle_id }));
                          setActiveTab('book');
                        }}
                        className="w-full py-2 bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Calendar className="w-3.5 h-3.5" /> Book Appointment
                      </button>

                      <button
                        onClick={() => setQrModalVehicle(veh)}
                        className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center gap-1"
                      >
                        <QrCode className="w-3.5 h-3.5 text-cyan-400" /> Tag
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MULTI-STEP BOOK SERVICE & VEHICLE PICKUP WORKFLOW */}
        {activeTab === 'book' && (
          <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
            
            {/* Form Header */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Step {bookingStep} of 5
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Service Appointment & Vehicle Pickup Request
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">Book maintenance, request doorstep pickup, and attach insurance documents</p>
            </div>

            {/* Stepper Progress Header */}
            <div className="grid grid-cols-5 text-center text-[11px] font-semibold text-slate-400 border-b border-slate-800 pb-4">
              <div className={bookingStep >= 1 ? 'text-cyan-400 font-bold' : ''}>1. Vehicle</div>
              <div className={bookingStep >= 2 ? 'text-cyan-400 font-bold' : ''}>2. Service</div>
              <div className={bookingStep >= 3 ? 'text-cyan-400 font-bold' : ''}>3. Pickup</div>
              <div className={bookingStep >= 4 ? 'text-cyan-400 font-bold' : ''}>4. Insurance</div>
              <div className={bookingStep >= 5 ? 'text-cyan-400 font-bold' : ''}>5. Review</div>
            </div>

            <form onSubmit={handleMultiStepSubmit}>
              
              {/* STEP 1: SELECT VEHICLE & ODOMETER */}
              {bookingStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Car className="w-4 h-4 text-cyan-400" /> Step 1: Select Registered Vehicle
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Vehicle *</label>
                    <select
                      required
                      value={bookingForm.vehicle_id}
                      onChange={(e) => setBookingForm({ ...bookingForm, vehicle_id: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="">-- Select your registered vehicle --</option>
                      {vehicles.map(v => (
                        <option key={v.vehicle_id} value={v.vehicle_id}>
                          {v.registration_no} - {v.brand} {v.model} ({v.fuel_type})
                        </option>
                      ))}
                    </select>
                    {vehicles.length === 0 && (
                      <p className="text-xs text-amber-400 mt-2">
                        ⚠️ No vehicles found. Please register a vehicle first.
                      </p>
                    )}
                  </div>

                  {selectedVehicleObj && (
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300 grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-400">Brand / Model:</span>
                        <p className="font-bold text-white">{selectedVehicleObj.brand} {selectedVehicleObj.model}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Registration Number:</span>
                        <p className="font-mono font-bold text-cyan-300">{selectedVehicleObj.registration_no}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Current Odometer Reading (km)</label>
                    <input
                      type="number"
                      value={bookingForm.odometer_reading}
                      onChange={(e) => setBookingForm({ ...bookingForm, odometer_reading: e.target.value })}
                      placeholder="e.g. 15400"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="button"
                      disabled={!bookingForm.vehicle_id}
                      onClick={() => setBookingStep(2)}
                      className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg disabled:opacity-50"
                    >
                      Next: Service Details <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: SERVICE & APPOINTMENT DETAILS */}
              {bookingStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-cyan-400" /> Step 2: Service & Schedule Details
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Service Type *</label>
                      <select
                        required
                        value={bookingForm.service_type}
                        onChange={(e) => setBookingForm({ ...bookingForm, service_type: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="General Service">General Service</option>
                        <option value="Periodic Service">Periodic Service</option>
                        <option value="Engine Service">Engine Service</option>
                        <option value="Brake Service">Brake Service</option>
                        <option value="AC Service">AC Service</option>
                        <option value="Electrical Service">Electrical Service</option>
                        <option value="Tyre Service">Tyre Service</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Preferred Service Date *</label>
                      <input
                        type="date"
                        required
                        value={bookingForm.booking_date}
                        onChange={(e) => setBookingForm({ ...bookingForm, booking_date: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Preferred Time Slot *</label>
                    <select
                      value={bookingForm.preferred_time_slot}
                      onChange={(e) => setBookingForm({ ...bookingForm, preferred_time_slot: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Morning (9:00 AM - 12:00 PM)">Morning (9:00 AM - 12:00 PM)</option>
                      <option value="Afternoon (12:00 PM - 3:00 PM)">Afternoon (12:00 PM - 3:00 PM)</option>
                      <option value="Evening (3:00 PM - 6:00 PM)">Evening (3:00 PM - 6:00 PM)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Problem / Service Description</label>
                    <textarea
                      rows={3}
                      value={bookingForm.problem_description}
                      onChange={(e) => setBookingForm({ ...bookingForm, problem_description: e.target.value })}
                      placeholder="Describe any issues, unusual noise, or specific requests..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setBookingStep(1)}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingStep(3)}
                      className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg"
                    >
                      Next: Pickup Request <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: VEHICLE PICKUP REQUEST */}
              {bookingStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Truck className="w-4 h-4 text-amber-400" /> Step 3: Vehicle Pickup Request Options
                  </h3>

                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="pickupCheck"
                      checked={bookingForm.pickup_required}
                      onChange={(e) => setBookingForm({ ...bookingForm, pickup_required: e.target.checked })}
                      className="mt-1 w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-800 focus:ring-amber-500"
                    />
                    <label htmlFor="pickupCheck" className="text-xs text-amber-200 cursor-pointer">
                      <strong className="text-white font-bold block text-sm">I want the service center to pick up my vehicle from my address</strong>
                      Enable door-step vehicle pickup. A workshop technician will be dispatched to your address.
                    </label>
                  </div>

                  {bookingForm.pickup_required && (
                    <div className="space-y-3 pt-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                      <p className="text-xs font-bold text-amber-400">Pickup Address Details:</p>

                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">House / Flat / Building *</label>
                          <input
                            type="text"
                            required={bookingForm.pickup_required}
                            value={bookingForm.flat_building}
                            onChange={(e) => setBookingForm({ ...bookingForm, flat_building: e.target.value })}
                            placeholder="e.g. Flat 402, ABC Apartments"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">Street / Road *</label>
                          <input
                            type="text"
                            required={bookingForm.pickup_required}
                            value={bookingForm.street}
                            onChange={(e) => setBookingForm({ ...bookingForm, street: e.target.value })}
                            placeholder="e.g. Road No. 5"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">Area / Landmark *</label>
                          <input
                            type="text"
                            required={bookingForm.pickup_required}
                            value={bookingForm.area}
                            onChange={(e) => setBookingForm({ ...bookingForm, area: e.target.value })}
                            placeholder="e.g. Kukatpally"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">City *</label>
                          <input
                            type="text"
                            required={bookingForm.pickup_required}
                            value={bookingForm.city}
                            onChange={(e) => setBookingForm({ ...bookingForm, city: e.target.value })}
                            placeholder="Hyderabad"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">PIN Code *</label>
                          <input
                            type="text"
                            required={bookingForm.pickup_required}
                            value={bookingForm.pincode}
                            onChange={(e) => setBookingForm({ ...bookingForm, pincode: e.target.value })}
                            placeholder="500072"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">Additional Pickup Instructions</label>
                        <input
                          type="text"
                          value={bookingForm.instructions}
                          onChange={(e) => setBookingForm({ ...bookingForm, instructions: e.target.value })}
                          placeholder="e.g. Please call me 15 minutes before pickup."
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setBookingStep(2)}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingStep(4)}
                      className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg"
                    >
                      Next: Insurance Docs <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: INSURANCE DOCUMENTS UPLOAD */}
              {bookingStep === 4 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" /> Step 4: Attach Vehicle Insurance Documents
                  </h3>

                  <div className="p-6 bg-slate-950 rounded-2xl border-2 border-dashed border-slate-800 text-center space-y-3">
                    <Upload className="w-8 h-8 text-cyan-400 mx-auto" />
                    <div>
                      <p className="text-xs font-bold text-white">Upload Vehicle Insurance Policy / Certificate</p>
                      <p className="text-[11px] text-slate-400">Supported Formats: PDF, JPG, JPEG, PNG (Max 10MB per file)</p>
                    </div>

                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs rounded-xl cursor-pointer border border-slate-700 transition-colors">
                      <Plus className="w-4 h-4" /> Select Files
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {fileError && (
                    <p className="text-xs text-rose-400 bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
                      ⚠️ {fileError}
                    </p>
                  )}

                  {/* Uploaded File List */}
                  {insuranceFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-400">Attached Documents ({insuranceFiles.length}):</p>
                      {insuranceFiles.map((file, idx) => (
                        <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <File className="w-4 h-4 text-cyan-400 shrink-0" />
                            <span className="font-semibold text-white truncate">{file.name}</span>
                            <span className="text-[10px] text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeInsuranceFile(idx)}
                            className="p-1 text-rose-400 hover:bg-rose-500/10 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setBookingStep(3)}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingStep(5)}
                      className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg"
                    >
                      Next: Review & Submit <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: REVIEW & FINAL SUBMISSION */}
              {bookingStep === 5 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Step 5: Review & Submit Appointment
                  </h3>

                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-3">
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Vehicle:</span>
                      <span className="font-bold text-white">
                        {selectedVehicleObj?.brand} {selectedVehicleObj?.model} ({selectedVehicleObj?.registration_no})
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Service Type:</span>
                      <span className="font-semibold text-cyan-300">{bookingForm.service_type}</span>
                    </div>

                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Appointment Schedule:</span>
                      <span className="font-semibold text-white">{bookingForm.booking_date} ({bookingForm.preferred_time_slot})</span>
                    </div>

                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Vehicle Pickup Required:</span>
                      <span className={`font-bold ${bookingForm.pickup_required ? 'text-amber-400' : 'text-slate-300'}`}>
                        {bookingForm.pickup_required ? 'YES (Door-step pickup requested)' : 'NO (Self-drive to service center)'}
                      </span>
                    </div>

                    {bookingForm.pickup_required && (
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                        <span className="text-slate-400 font-semibold block mb-1">Pickup Address:</span>
                        <p className="text-slate-200">
                          {bookingForm.flat_building}, {bookingForm.street}, {bookingForm.area}, {bookingForm.city} - {bookingForm.pincode}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-slate-400">Insurance Documents Attached:</span>
                      <span className="font-bold text-cyan-300">{insuranceFiles.length} file(s)</span>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setBookingStep(4)}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 text-xs flex items-center gap-2"
                    >
                      {loading ? 'Submitting...' : 'Confirm & Request Service Appointment'}
                    </button>
                  </div>
                </div>
              )}

            </form>
          </div>
        )}

        {/* TAB 3: MY APPOINTMENTS & PICKUP STATUS TRACKER */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">My Appointments & Pickup Tracker</h2>
                <p className="text-xs text-slate-400">Track service status, vehicle pickup dispatch, and uploaded insurance files</p>
              </div>
              <button
                onClick={loadCustomerData}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl border border-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
              </button>
            </div>

            {appointments.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-slate-900/50 border border-slate-800">
                <Truck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white">No Active Service Appointments</h3>
                <p className="text-xs text-slate-400 mb-4">Book a service appointment with doorstep vehicle pickup options.</p>
                <button
                  onClick={() => setActiveTab('book')}
                  className="px-4 py-2 bg-cyan-500 text-slate-950 font-bold text-xs rounded-xl"
                >
                  Book Appointment Now
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {appointments.map(appt => {
                  const isPickupReq = appt.pickup_required;
                  const pickupStatus = appt.pickup_status || 'N/A';
                  const serviceStatus = appt.service_status || 'Pending';

                  return (
                    <div
                      key={appt.booking_id}
                      className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full">
                              Booking #BK{String(appt.booking_id).padStart(4, '0')}
                            </span>
                            {isPickupReq && (
                              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <Truck className="w-3 h-3" /> Door-step Pickup
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-bold text-white mt-1">
                            {appt.brand} {appt.model} (<span className="font-mono text-cyan-300">{appt.registration_no}</span>)
                          </h3>
                        </div>

                        <div className="text-right">
                          <p className="text-[11px] text-slate-400 font-semibold">Service: {appt.service_type}</p>
                          <p className="text-xs text-slate-300 font-medium">
                            Date: {new Date(appt.booking_date).toLocaleDateString()} ({appt.preferred_time_slot})
                          </p>
                        </div>
                      </div>

                      {/* DUAL STEPPER TRACKER (PICKUP + SERVICE STATUS) */}
                      <div className="grid md:grid-cols-2 gap-6 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                        
                        {/* Tracker 1: Pickup Status */}
                        <div>
                          <p className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5" /> Door-Step Pickup Progress:
                          </p>
                          <div className="space-y-1.5 text-xs">
                            {['Requested', 'Accepted', 'Pickup Scheduled', 'Picked Up'].map((st, idx) => {
                              const isCurrent = pickupStatus === st;
                              const isPast = ['Requested', 'Accepted', 'Pickup Scheduled', 'Picked Up'].indexOf(pickupStatus) >= idx;
                              return (
                                <div key={st} className="flex items-center gap-2">
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                    isPast ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                                  }`}>
                                    {isPast ? '✓' : idx + 1}
                                  </div>
                                  <span className={isCurrent ? 'font-bold text-amber-300' : isPast ? 'text-slate-200' : 'text-slate-500'}>
                                    {st}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Tracker 2: Service Status */}
                        <div>
                          <p className="text-xs font-bold text-cyan-400 mb-2 flex items-center gap-1.5">
                            <Wrench className="w-3.5 h-3.5" /> Workshop Service Status:
                          </p>
                          <div className="space-y-1.5 text-xs">
                            {['Pending', 'In Progress', 'Completed'].map((st, idx) => {
                              const isCurrent = serviceStatus === st;
                              const isPast = ['Pending', 'In Progress', 'Completed'].indexOf(serviceStatus) >= idx;
                              return (
                                <div key={st} className="flex items-center gap-2">
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                    isPast ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                                  }`}>
                                    {isPast ? '✓' : idx + 1}
                                  </div>
                                  <span className={isCurrent ? 'font-bold text-cyan-300' : isPast ? 'text-slate-200' : 'text-slate-500'}>
                                    {st}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>

                      {/* Pickup Address & Insurance Files Details */}
                      <div className="grid md:grid-cols-2 gap-4 text-xs text-slate-300">
                        {isPickupReq && (
                          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-1">
                            <p className="text-slate-400 font-semibold flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-amber-400" /> Pickup Location:
                            </p>
                            <p className="text-slate-200 font-medium">{appt.pickup_address}</p>
                            {appt.pickup_instructions && (
                              <p className="text-amber-300 italic pt-1">"{appt.pickup_instructions}"</p>
                            )}
                          </div>
                        )}

                        {appt.insurance_documents && appt.insurance_documents.length > 0 && (
                          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2">
                            <p className="text-slate-400 font-semibold flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 text-cyan-400" /> Attached Insurance Documents:
                            </p>
                            <div className="space-y-1">
                              {appt.insurance_documents.map((doc, idx) => (
                                <a
                                  key={idx}
                                  href={`${BASE_URL}/appointments/${appt.booking_id}/insurance/${doc.document_id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded-xl border border-slate-800 flex items-center justify-between text-xs transition-colors"
                                >
                                  <span className="truncate">{doc.original_filename}</span>
                                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                    <Eye className="w-3 h-3 text-cyan-400" /> View
                                  </span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SERVICE HISTORY & ITEMIZED PARTS */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Vehicle Service History</h2>
              <p className="text-xs text-slate-400">Detailed records, spare parts used, and labor cost breakdowns</p>
            </div>

            {history.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-slate-900/50 border border-slate-800">
                <Wrench className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white">No Completed Service Records</h3>
                <p className="text-xs text-slate-400">Completed services will appear here with detailed receipts.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {history.map(item => (
                  <div key={item.service_id} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-4 pb-3 border-b border-slate-800">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Service Record #{item.service_id}
                        </span>
                        <h3 className="text-lg font-bold text-white mt-1">
                          {item.brand} {item.model} (<span className="font-mono text-cyan-300">{item.registration_no}</span>)
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Date: {new Date(item.service_date).toLocaleDateString()} • Odometer: {item.odometer_reading?.toLocaleString() || 'N/A'} km
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-slate-400">Total Amount</p>
                        <p className="text-xl font-extrabold text-emerald-400">₹{Number(item.grand_total || item.total_cost).toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 text-xs text-slate-300">
                      <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-1">
                        <p className="text-slate-400 font-semibold">Service Description & Work Done:</p>
                        <p className="text-slate-200">{item.description || item.service_type}</p>
                        <p className="text-slate-400 font-semibold pt-2">Technician:</p>
                        <p className="text-cyan-300 font-medium">{item.mechanic_name || 'Assigned Staff'} ({item.mechanic_specialization || 'Technician'})</p>
                      </div>

                      <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-1">
                        <p className="text-slate-400 font-semibold">Cost Breakdown:</p>
                        <div className="flex justify-between text-slate-300">
                          <span>Labour Charge:</span>
                          <span>₹{Number(item.labour_cost || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Spare Parts Total:</span>
                          <span>₹{Number(item.parts_cost || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>GST (18%):</span>
                          <span>₹{Number(item.gst || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Spare Parts Table */}
                    {item.parts_used && item.parts_used.length > 0 && (
                      <div className="pt-2">
                        <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                          <PackageCheck className="w-3.5 h-3.5 text-cyan-400" /> Itemized Spare Parts Replaced:
                        </p>
                        <div className="overflow-x-auto rounded-xl border border-slate-800">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                              <tr>
                                <th className="p-2.5">Part Name</th>
                                <th className="p-2.5 text-center">Qty</th>
                                <th className="p-2.5 text-right">Unit Price</th>
                                <th className="p-2.5 text-right">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-200">
                              {item.parts_used.map((p, idx) => (
                                <tr key={idx}>
                                  <td className="p-2.5 font-medium">{p.part_name}</td>
                                  <td className="p-2.5 text-center">{p.quantity}</td>
                                  <td className="p-2.5 text-right">₹{Number(p.price).toFixed(2)}</td>
                                  <td className="p-2.5 text-right font-semibold text-cyan-300">
                                    ₹{(Number(p.price) * Number(p.quantity)).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: INVOICES & PRINTING */}
        {activeTab === 'invoices' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Official GST Invoices</h2>
              <p className="text-xs text-slate-400">View and print downloadable tax invoices for completed services</p>
            </div>

            {invoices.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-slate-900/50 border border-slate-800">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white">No Invoices Available</h3>
                <p className="text-xs text-slate-400">Invoices will be generated automatically upon service completion.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {invoices.map(inv => (
                  <div key={inv.invoice_id} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3 pb-3 border-b border-slate-800">
                        <div>
                          <span className="text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded">
                            INV-#{inv.invoice_id}
                          </span>
                          <h3 className="text-lg font-bold text-white mt-1">
                            {inv.brand} {inv.model}
                          </h3>
                          <p className="text-xs text-slate-400">Reg: <span className="font-mono text-cyan-300">{inv.registration_no}</span></p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-slate-400">Grand Total</p>
                          <p className="text-xl font-black text-emerald-400">₹{Number(inv.grand_total).toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Invoice Date:</span>
                          <span>{new Date(inv.invoice_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Service Type:</span>
                          <span>{inv.service_type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">GST (18%):</span>
                          <span>₹{Number(inv.gst).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setPrintInvoice(inv)}
                      className="w-full py-2.5 bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Printer className="w-4 h-4" /> View & Print Invoice
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: MY PROFILE */}
        {activeTab === 'profile' && (
          <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-400" /> My Customer Profile
              </h2>
              <p className="text-xs text-slate-400">View and update your personal details</p>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={editProfile.name}
                  onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={editProfile.phone}
                    onChange={(e) => setEditProfile({ ...editProfile, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={editProfile.email}
                    onChange={(e) => setEditProfile({ ...editProfile, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Address</label>
                <textarea
                  rows={2}
                  value={editProfile.address}
                  onChange={(e) => setEditProfile({ ...editProfile, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all text-xs"
              >
                Save Profile Changes
              </button>
            </form>
          </div>
        )}

      </main>

      {/* CONFIRMATION CARD MODAL POST-BOOKING */}
      {bookingConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Service Appointment Requested Successfully!</h3>
              <p className="text-xs text-slate-400 mt-1">Your request is logged in PostgreSQL database.</p>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Booking Code:</span>
                <span className="font-mono font-bold text-cyan-300">{bookingConfirmation.booking_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Vehicle:</span>
                <span className="font-bold text-white">{bookingConfirmation.vehicle_model} ({bookingConfirmation.vehicle_reg})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Door-step Pickup:</span>
                <span className={`font-bold ${bookingConfirmation.pickup_required ? 'text-amber-400' : 'text-slate-300'}`}>
                  {bookingConfirmation.pickup_required ? 'YES (Requested)' : 'NO'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Insurance Docs:</span>
                <span className="font-bold text-cyan-300">{bookingConfirmation.insurance_documents_count} attached</span>
              </div>
            </div>

            <button
              onClick={() => {
                setBookingConfirmation(null);
                setActiveTab('appointments');
              }}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg"
            >
              View My Appointments & Tracker
            </button>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW VEHICLE */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Car className="w-5 h-5 text-cyan-400" /> Register Vehicle
              </h3>
              <button onClick={() => setShowAddVehicleModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddVehicle} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Registration Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TS09AB1234"
                  value={newVehicle.registration_no}
                  onChange={(e) => setNewVehicle({ ...newVehicle, registration_no: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-100 uppercase focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Brand *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hyundai"
                    value={newVehicle.brand}
                    onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Model *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Creta"
                    value={newVehicle.model}
                    onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Year</label>
                  <input
                    type="number"
                    value={newVehicle.manufacturing_year}
                    onChange={(e) => setNewVehicle({ ...newVehicle, manufacturing_year: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Fuel</label>
                  <select
                    value={newVehicle.fuel_type}
                    onChange={(e) => setNewVehicle({ ...newVehicle, fuel_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric</option>
                    <option value="CNG">CNG</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Mileage (km)</label>
                  <input
                    type="number"
                    value={newVehicle.mileage}
                    onChange={(e) => setNewVehicle({ ...newVehicle, mileage: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 mt-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 text-xs"
              >
                Save & Register Vehicle
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VEHICLE QR CODE TAG GENERATOR */}
      {qrModalVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-cyan-400" /> Vehicle QR Code Tag
              </h3>
              <button onClick={() => setQrModalVehicle(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-4 bg-white rounded-2xl inline-block shadow-inner">
              <QRCodeSVG
                value={getQrUrl(qrModalVehicle.registration_no)}
                size={180}
                level="H"
                includeMargin={true}
              />
            </div>

            <div>
              <p className="text-sm font-bold text-white">{qrModalVehicle.brand} {qrModalVehicle.model}</p>
              <p className="text-xs font-mono font-bold text-cyan-400 mt-0.5">{qrModalVehicle.registration_no}</p>
              <p className="text-[11px] text-slate-400 mt-2 bg-slate-950 p-2 rounded-xl border border-slate-800 break-all">
                {getQrUrl(qrModalVehicle.registration_no)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print Tag
              </button>

              <button
                onClick={() => setQrModalVehicle(null)}
                className="py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl"
              >
                Close Tag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PRINTABLE GST INVOICE */}
      {printInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-white text-slate-900 rounded-3xl p-8 space-y-6 shadow-2xl relative my-8">
            <button
              onClick={() => setPrintInvoice(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 text-xl font-bold"
            >
              ✕
            </button>

            {/* Invoice Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-6">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900">AutoCare Service Center</h2>
                <p className="text-xs text-slate-600">Official GST Tax Invoice</p>
                <p className="text-xs text-slate-500 mt-1">123 Workshop Lane, Jubilee Hills, Hyderabad</p>
                <p className="text-xs text-slate-500">GSTIN: 36ABCDE1234F1Z5</p>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                  PAID INVOICE
                </span>
                <p className="text-sm font-bold text-slate-900 mt-2">INV-#{printInvoice.invoice_id}</p>
                <p className="text-xs text-slate-500">Date: {new Date(printInvoice.invoice_date).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Billed To & Vehicle Details */}
            <div className="grid grid-cols-2 gap-6 text-xs border-b border-slate-200 pb-6">
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">Billed To:</p>
                <p className="font-bold text-slate-900 text-sm">{printInvoice.customer_name}</p>
                <p className="text-slate-600">Phone: {printInvoice.customer_phone}</p>
                <p className="text-slate-600">Email: {printInvoice.customer_email || 'N/A'}</p>
              </div>

              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">Vehicle Specification:</p>
                <p className="font-bold text-slate-900 text-sm">{printInvoice.brand} {printInvoice.model}</p>
                <p className="text-slate-600">Reg No: <strong className="text-slate-900 font-mono">{printInvoice.registration_no}</strong></p>
                <p className="text-slate-600">Service: {printInvoice.service_type}</p>
              </div>
            </div>

            {/* Cost Table */}
            <div className="space-y-2">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-3">Description</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  <tr>
                    <td className="p-3">Labour Charge & Technician Fee</td>
                    <td className="p-3 text-right font-medium">₹{Number(printInvoice.labour_cost || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="p-3">Spare Parts & Materials Total</td>
                    <td className="p-3 text-right font-medium">₹{Number(printInvoice.parts_cost || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="p-3">GST Tax (18%)</td>
                    <td className="p-3 text-right font-medium">₹{Number(printInvoice.gst || 0).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total Footer */}
            <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-2xl">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Payable Amount</p>
                <p className="text-xs text-slate-300">Inclusive of all applicable taxes</p>
              </div>
              <p className="text-2xl font-black text-emerald-400">₹{Number(printInvoice.grand_total).toFixed(2)}</p>
            </div>

            {/* Print Button */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg"
              >
                <Printer className="w-4 h-4" /> Print Tax Invoice
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
