import React, { useState } from 'react';
import { User, Shield, Wrench, Lock, Phone, Mail, MapPin, Key, UserPlus, LogIn, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../api/axiosClient';

export default function AuthModal({ isOpen, onClose, onLoginSuccess, initialRole = 'customer' }) {
  const [activeRole, setActiveRole] = useState(initialRole); // 'customer' or 'service_center'
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const data = await api.post('/auth/login', { username, password });
      setSuccessMsg(data.message || 'Login successful!');
      setTimeout(() => {
        onLoginSuccess(data.user, data.token);
        onClose();
      }, 500);
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

      setSuccessMsg(data.message || 'Account registered!');
      setTimeout(() => {
        onLoginSuccess(data.user, data.token);
        onClose();
      }, 500);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoCustomer = (demoUsername) => {
    setUsername(demoUsername);
    setPassword('customer123');
    setError('');
  };

  const handleQuickDemoStaff = () => {
    setUsername('admin');
    setPassword('admin123');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 backdrop-blur rounded-xl">
              <Wrench className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">Vehicle Service Portal</h3>
              <p className="text-xs text-cyan-100/80">Sign in to access your dashboard</p>
            </div>
          </div>
        </div>

        {/* Role Switcher Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-950 border-b border-slate-800">
          <button
            type="button"
            onClick={() => {
              setActiveRole('customer');
              setIsRegisterMode(false);
              setError('');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-all ${
              activeRole === 'customer'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Customer Login</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded font-bold">PRIMARY</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveRole('service_center');
              setIsRegisterMode(false);
              setError('');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-all ${
              activeRole === 'service_center'
                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Service Center Staff</span>
          </button>
        </div>

        <div className="p-6">
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

          {/* CUSTOMER LOGIN & REGISTER */}
          {activeRole === 'customer' && (
            <div>
              {/* Register / Sign In Sub-toggle */}
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800">
                <span className="text-xs font-semibold text-slate-400">
                  {isRegisterMode ? 'Create New Customer Account' : 'Existing Customer Sign In'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(!isRegisterMode);
                    setError('');
                  }}
                  className="text-xs text-cyan-400 hover:underline font-semibold flex items-center gap-1"
                >
                  {isRegisterMode ? (
                    <>
                      <LogIn className="w-3.5 h-3.5" /> Already registered? Sign In
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" /> New Customer? Register Here
                    </>
                  )}
                </button>
              </div>

              {!isRegisterMode ? (
                /* Customer Login Form */
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Username or Email</label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. rahul or rahul@example.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? 'Authenticating...' : 'Sign In to Customer Portal'}
                  </button>

                  {/* Quick Demo Customer Account Buttons */}
                  <div className="pt-3 border-t border-slate-800/80">
                    <p className="text-[11px] font-medium text-slate-400 mb-2 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-cyan-400" /> Demo Customer Quick Logins:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickDemoCustomer('rahul')}
                        className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg"
                      >
                        Rahul Sharma (`rahul`)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickDemoCustomer('priya')}
                        className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg"
                      >
                        Priya Reddy (`priya`)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickDemoCustomer('tanish')}
                        className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg"
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
                    <label className="block text-xs font-medium text-slate-300 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ramesh Chandra"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number *</label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="9876543210"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ramesh@example.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Residential Address</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="H.No 12, Jubilee Hills, Hyderabad"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Choose Username *</label>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="ramesh123"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Password *</label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? 'Creating Account...' : 'Register & Enter Customer Portal'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* SERVICE CENTER STAFF LOGIN */}
          {activeRole === 'service_center' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs mb-2">
                🛡️ Service Center Administration Portal for Workshop Managers, Technicians & Billing Staff.
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Staff Username</label>
                <div className="relative">
                  <Shield className="w-4 h-4 absolute left-3.5 top-3 text-indigo-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. admin"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Staff Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-indigo-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Verifying Staff Access...' : 'Sign In as Service Center Staff'}
              </button>

              {/* Quick Demo Staff Login */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400">Quick Faculty / Evaluator Demo:</span>
                <button
                  type="button"
                  onClick={handleQuickDemoStaff}
                  className="px-3 py-1.5 text-xs font-semibold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-lg flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Staff Demo (`admin` / `admin123`)
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
