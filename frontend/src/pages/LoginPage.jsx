import React, { useState } from 'react';
import { User, Shield, Wrench, Lock, Phone, Mail, UserPlus, LogIn, Sparkles, CheckCircle2, AlertCircle, ArrowRight, Car, Building2 } from 'lucide-react';
import { api } from '../api/axiosClient';

export default function LoginPage({ onLoginSuccess }) {
  const [selectedRole, setSelectedRole] = useState(null); // null, 'customer', or 'service_center'
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Form inputs
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const data = await api.post('/auth/login', { username, password });

      // Role check: If staff selected customer login or customer selected staff login, enforce strict role separation
      if (selectedRole === 'customer' && data.user.role !== 'customer') {
        throw new Error('This account belongs to Service Center Staff. Please use the Service Center Staff Login.');
      }
      if (selectedRole === 'service_center' && data.user.role !== 'service_center') {
        throw new Error('This account is a Customer account. Please use the Customer Login option.');
      }

      setSuccessMsg(`Welcome back, ${data.user.customerName || data.user.username}!`);
      setTimeout(() => {
        onLoginSuccess(data.user, data.token);
      }, 400);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const data = await api.post('/auth/register', {
        name,
        phone,
        email,
        address,
        username,
        password
      });

      setSuccessMsg(data.message || 'Customer Account Registered Successfully!');
      setTimeout(() => {
        onLoginSuccess(data.user, data.token);
      }, 400);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoCustomer = (demoUser) => {
    setUsername(demoUser);
    setPassword('customer123');
    setError('');
  };

  const handleQuickDemoStaff = () => {
    setUsername('admin');
    setPassword('admin123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-white font-sans">
      
      {/* Top App Header */}
      <header className="h-20 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur sticky top-0 z-30 px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Vehicle Service History Management System
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                PostgreSQL DBMS
              </span>
            </h1>
            <p className="text-xs text-slate-400">DBMS College Project • Mandatory Authentication Portal</p>
          </div>
        </div>
      </header>

      {/* Main Login Screen */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12 flex flex-col justify-center items-center">
        
        {/* Banner Title */}
        <div className="text-center max-w-xl mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Select Your Access Role Below to Sign In</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Welcome Back
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            Please select your user role to authenticate and enter your dashboard
          </p>
        </div>

        {/* STEP 1: ROLE SELECTION CARDS (CUSTOMER PRIORITY) */}
        {!selectedRole ? (
          <div className="grid md:grid-cols-12 gap-6 w-full max-w-4xl">
            
            {/* ROLE 1: CUSTOMER (PRIORITY & VISUALLY PROMINENT) */}
            <div
              onClick={() => {
                setSelectedRole('customer');
                setIsRegisterMode(false);
                setError('');
              }}
              className="md:col-span-7 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-900/90 border-2 border-cyan-500/50 hover:border-cyan-400 rounded-3xl p-8 cursor-pointer relative overflow-hidden shadow-2xl shadow-cyan-950/50 hover:scale-[1.02] transition-all group"
            >
              <div className="absolute top-0 right-0 bg-gradient-to-l from-cyan-500 to-blue-600 text-white font-black text-[10px] uppercase tracking-wider px-3.5 py-1 rounded-bl-xl shadow-md flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Priority Role
              </div>

              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all">
                  <User className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">👤 Customer</h3>
                  <p className="text-xs text-cyan-400 font-semibold mt-0.5">Vehicle Owners & Drivers</p>
                </div>
              </div>

              <p className="text-slate-300 text-xs md:text-sm mb-6 leading-relaxed">
                Book vehicle service appointments, request door-step vehicle pickup, track live status, download GST invoices, and access vehicle QR codes.
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs font-bold text-cyan-400 group-hover:text-cyan-300">
                <span>Sign In / Register as Customer</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </div>

            {/* ROLE 2: SERVICE CENTER STAFF */}
            <div
              onClick={() => {
                setSelectedRole('service_center');
                setIsRegisterMode(false);
                setError('');
              }}
              className="md:col-span-5 bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-3xl p-8 cursor-pointer relative overflow-hidden hover:scale-[1.02] transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-slate-950 transition-all">
                    <Building2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">🏢 Service Center</h3>
                    <p className="text-xs text-indigo-400 font-semibold mt-0.5">Workshop Staff & Technicians</p>
                  </div>
                </div>

                <p className="text-slate-400 text-xs mb-6 leading-relaxed">
                  Manage customer bookings, dispatch pickup requests, assign mechanics, process spare part stock triggers, and view DBMS reports.
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs font-bold text-indigo-400 group-hover:text-indigo-300">
                <span>Staff Portal Login</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

          </div>
        ) : (
          
          /* STEP 2: LOGIN & REGISTRATION FORM */
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-fadeIn">
            
            {/* Header Banner */}
            <div className={`p-6 text-white flex items-center justify-between ${
              selectedRole === 'customer'
                ? 'bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600'
                : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-slate-900'
            }`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 backdrop-blur rounded-xl">
                  {selectedRole === 'customer' ? <User className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold">
                    {selectedRole === 'customer' ? 'Customer Authentication' : 'Service Center Staff Login'}
                  </h3>
                  <p className="text-xs text-white/80">
                    {selectedRole === 'customer' ? 'Enter your customer credentials' : 'Staff access portal'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedRole(null)}
                className="text-xs font-semibold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-colors"
              >
                Change Role
              </button>
            </div>

            <div className="p-6 md:p-8">
              {/* Notifications */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* CUSTOMER LOGIN & REGISTER FORM */}
              {selectedRole === 'customer' && (
                <div>
                  <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800">
                    <span className="text-xs font-bold text-slate-400">
                      {isRegisterMode ? 'Create New Customer Account' : 'Sign In to Customer Dashboard'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegisterMode(!isRegisterMode);
                        setError('');
                      }}
                      className="text-xs text-cyan-400 hover:underline font-bold flex items-center gap-1"
                    >
                      {isRegisterMode ? (
                        <>
                          <LogIn className="w-3.5 h-3.5" /> Existing User? Sign In
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" /> New Customer? Register Here
                        </>
                      )}
                    </button>
                  </div>

                  {!isRegisterMode ? (
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Username or Email</label>
                        <div className="relative">
                          <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="e.g. rahul or rahul@example.com"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                        <div className="relative">
                          <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                          <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        {loading ? 'Authenticating...' : 'Sign In to Customer Dashboard'}
                      </button>

                      {/* Quick Demo Customer Account Buttons */}
                      <div className="pt-4 border-t border-slate-800">
                        <p className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Demo Customer Logins:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleQuickDemoCustomer('rahul')}
                            className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg font-medium"
                          >
                            Rahul Sharma (`rahul`)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickDemoCustomer('priya')}
                            className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg font-medium"
                          >
                            Priya Reddy (`priya`)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickDemoCustomer('tanish')}
                            className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg font-medium"
                          >
                            Tanish Pilly (`tanish`)
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    /* Customer Registration Form */
                    <form onSubmit={handleRegister} className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Ramesh Chandra"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number *</label>
                          <input
                            type="text"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="9876543210"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ramesh@example.com"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Residential Address</label>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="H.No 12, Jubilee Hills, Hyderabad"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">Choose Username *</label>
                          <input
                            type="text"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="ramesh123"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">Password *</label>
                          <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 text-xs"
                      >
                        {loading ? 'Creating Account...' : 'Register & Enter Customer Dashboard'}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* SERVICE CENTER STAFF LOGIN FORM */}
              {selectedRole === 'service_center' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs mb-2">
                    🛡️ Service Center Administration Portal for Workshop Managers, Technicians & Billing Staff.
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Staff Username</label>
                    <div className="relative">
                      <Shield className="w-4 h-4 absolute left-3.5 top-3.5 text-indigo-400" />
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. admin"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Staff Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-indigo-400" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all text-sm"
                  >
                    {loading ? 'Authenticating Staff...' : 'Sign In as Service Center Staff'}
                  </button>

                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Evaluator / Demo Staff Credentials:</span>
                    <button
                      type="button"
                      onClick={handleQuickDemoStaff}
                      className="px-3 py-1.5 text-xs font-semibold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-lg"
                    >
                      Staff Demo (`admin` / `admin123`)
                    </button>
                  </div>
                </form>
              )}

            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
        DBMS College Project • Developed by Tanish Pilly, Eshwar Siddhartha & G Manikanta
      </footer>

    </div>
  );
}
