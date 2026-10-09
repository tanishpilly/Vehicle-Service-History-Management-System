import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

import LoginPage from './pages/LoginPage';
import CustomerDashboard from './pages/CustomerDashboard';

import Dashboard from './pages/Dashboard';
import PickupRequests from './pages/PickupRequests';
import Customers from './pages/Customers';
import Vehicles from './pages/Vehicles';
import ServiceBookings from './pages/ServiceBookings';
import ServiceRecords from './pages/ServiceRecords';
import ServiceHistory from './pages/ServiceHistory';
import Mechanics from './pages/Mechanics';
import SpareParts from './pages/SpareParts';
import Invoices from './pages/Invoices';
import Reports from './pages/Reports';

export default function App() {
  // Global Authentication State
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  // Service Center Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedHistoryReg, setSelectedHistoryReg] = useState('TS09AB1234');
  const [selectedBookingForRecord, setSelectedBookingForRecord] = useState(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  // QR Code Public Vehicle Scan Flag
  const [qrScanReg, setQrScanReg] = useState(null);

  // Check URL parameters for direct QR Code scanning (?reg=TS09AB1234)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const regParam = params.get('reg');
    if (regParam) {
      const cleanReg = regParam.trim().toUpperCase();
      setQrScanReg(cleanReg);
      setSelectedHistoryReg(cleanReg);
    }
  }, []);

  const handleLoginSuccess = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const handleSelectHistoryReg = (regNo) => {
    setSelectedHistoryReg(regNo);
  };

  const handleSelectBookingForRecord = (bookingObj) => {
    setSelectedBookingForRecord(bookingObj);
  };

  const handleSelectInvoice = (invoiceId) => {
    setSelectedInvoiceId(invoiceId);
  };

  // SCENARIO 1: Direct QR Code Scan from mobile camera or browser link (?reg=TS09AB1234)
  if (qrScanReg) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 md:p-8">
        <header className="max-w-6xl w-full mx-auto mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-bold text-cyan-400">Scanned QR Code Vehicle History</h1>
            <p className="text-xs text-slate-400">Live Database Verification for Vehicle: <strong className="text-white">{qrScanReg}</strong></p>
          </div>
          <button
            onClick={() => {
              setQrScanReg(null);
              window.history.pushState({}, '', window.location.pathname);
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700"
          >
            ← Return to Application Login
          </button>
        </header>

        <main className="max-w-6xl w-full mx-auto flex-1">
          <ServiceHistory
            initialRegNumber={qrScanReg}
            setActiveTab={() => {}}
            onSelectInvoice={handleSelectInvoice}
          />
        </main>
      </div>
    );
  }

  // SCENARIO 2: NOT LOGGED IN -> MANDATORY REDIRECT / ROUTE PROTECTION TO LOGIN PAGE
  if (!user || !token) {
    return (
      <LoginPage onLoginSuccess={handleLoginSuccess} />
    );
  }

  // SCENARIO 3: LOGGED IN AS CUSTOMER -> REDIRECT TO CUSTOMER DASHBOARD (PRIMARY INTERFACE)
  if (user.role === 'customer') {
    return (
      <CustomerDashboard user={user} onLogout={handleLogout} />
    );
  }

  // SCENARIO 4: LOGGED IN AS SERVICE CENTER STAFF -> REDIRECT TO SERVICE CENTER DASHBOARD
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar activeTab={activeTab} user={user} onLogout={handleLogout} />

        <main className="p-6 flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <Dashboard setActiveTab={setActiveTab} onSelectHistoryReg={handleSelectHistoryReg} />
          )}

          {activeTab === 'pickup' && (
            <PickupRequests />
          )}

          {activeTab === 'customers' && (
            <Customers setActiveTab={setActiveTab} />
          )}

          {activeTab === 'vehicles' && (
            <Vehicles setActiveTab={setActiveTab} onSelectHistoryReg={handleSelectHistoryReg} />
          )}

          {activeTab === 'bookings' && (
            <ServiceBookings setActiveTab={setActiveTab} onSelectBookingForRecord={handleSelectBookingForRecord} />
          )}

          {activeTab === 'records' && (
            <ServiceRecords
              selectedBookingForRecord={selectedBookingForRecord}
              setActiveTab={setActiveTab}
              onSelectInvoice={handleSelectInvoice}
            />
          )}

          {activeTab === 'history' && (
            <ServiceHistory
              initialRegNumber={selectedHistoryReg}
              setActiveTab={setActiveTab}
              onSelectInvoice={handleSelectInvoice}
            />
          )}

          {activeTab === 'mechanics' && (
            <Mechanics />
          )}

          {activeTab === 'parts' && (
            <SpareParts />
          )}

          {activeTab === 'invoices' && (
            <Invoices selectedInvoiceId={selectedInvoiceId} />
          )}

          {activeTab === 'reports' && (
            <Reports />
          )}
        </main>
      </div>
    </div>
  );
}
