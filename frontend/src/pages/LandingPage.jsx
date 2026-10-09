import React from 'react';
import { User, Shield, Wrench, QrCode, FileText, CheckCircle2, Clock, Cpu, BarChart3, ChevronRight, Sparkles, Layers } from 'lucide-react';

export default function LandingPage({ onOpenAuth }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Top Header Navigation */}
      <header className="h-20 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur sticky top-0 z-40 px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              AutoCare DBMS
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                PostgreSQL
              </span>
            </h1>
            <p className="text-xs text-slate-400">Vehicle Service History & Tracking System</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenAuth('service_center')}
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all"
          >
            <Shield className="w-3.5 h-3.5 text-indigo-400" /> Staff Access
          </button>
          <button
            onClick={() => onOpenAuth('customer')}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl shadow-lg shadow-cyan-500/25 transition-all"
          >
            <User className="w-4 h-4" /> Customer Portal
          </button>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-12 py-12 md:py-16 flex flex-col justify-center">
        
        {/* Banner Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold self-start mb-6">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Faculty Review Aligned DBMS College Project</span>
        </div>

        {/* Title and Intro */}
        <div className="max-w-3xl mb-12">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none mb-6">
            Complete Vehicle Service History & Real-Time Tracking
          </h2>
          <p className="text-slate-400 text-base md:text-lg leading-relaxed">
            Welcome to the official vehicle service platform. Access your complete vehicle maintenance history, track live service progress in real time, view itemized spare parts used, download GST invoices, and scan QR code tags.
          </p>
        </div>

        {/* Role Cards (CUSTOMER IS PRIMARY & PRIORITY) */}
        <div className="grid md:grid-cols-12 gap-8 mb-16">
          
          {/* PRIMARY & PRIORITY CARD: CUSTOMER PORTAL */}
          <div className="md:col-span-7 bg-gradient-to-b from-slate-900/90 to-slate-900 border-2 border-cyan-500/40 rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-cyan-950/40 hover:border-cyan-500/70 transition-all group">
            
            <div className="absolute top-0 right-0 bg-gradient-to-l from-cyan-500 to-blue-600 text-white font-extrabold text-[11px] uppercase tracking-wider px-4 py-1 rounded-bl-2xl shadow-md flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Primary Interface
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <User className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">Customer Portal</h3>
                <p className="text-xs text-cyan-400 font-medium">For Vehicle Owners & Drivers</p>
              </div>
            </div>

            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              Register or sign in to your personal dashboard to manage your vehicles, book service appointments, track live work progress, and download official invoices.
            </p>

            {/* Feature Checklist */}
            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {[
                { icon: Clock, label: 'Track Live Status (Pending → In Progress → Completed)' },
                { icon: QrCode, label: 'Vehicle QR Code Tag Generator & Printable Cards' },
                { icon: FileText, label: 'Itemized Spare Parts & Labour Cost Breakdown' },
                { icon: FileText, label: 'Instant Printable GST Invoice Generation' },
              ].map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
                  <feat.icon className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{feat.label}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => onOpenAuth('customer')}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-cyan-500/30 transition-all flex items-center justify-center gap-3 text-base group-hover:scale-[1.01]"
            >
              <span>Enter Customer Portal</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* SECONDARY CARD: SERVICE CENTER STAFF */}
          <div className="md:col-span-5 bg-slate-900/60 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between hover:border-slate-700 transition-all">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Shield className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Service Center Staff</h3>
                  <p className="text-xs text-indigo-400 font-medium">For Managers & Technicians</p>
                </div>
              </div>

              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Full administration workspace for workshop managers to process customer bookings, assign mechanics, manage spare parts inventory, and run database analytics.
              </p>

              <div className="space-y-2.5 mb-8 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  <span>Process Bookings & Assign Mechanics</span>
                </div>
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  <span>PostgreSQL Stock Deduction Trigger Execution</span>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Manage 8 Relational Database Tables</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-400" />
                  <span>DBMS Statistical Reports (COUNT, SUM, AVG)</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onOpenAuth('service_center')}
              className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white font-bold rounded-2xl border border-slate-700 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <span>Service Center Staff Login</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Database Tech Stack Specs Bar */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/60 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-xs text-slate-400 font-medium mb-1">Database Engine</p>
            <p className="text-sm font-bold text-cyan-400">PostgreSQL 18</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium mb-1">Architecture</p>
            <p className="text-sm font-bold text-indigo-400">React + Express REST API</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium mb-1">Security</p>
            <p className="text-sm font-bold text-emerald-400">Bcrypt Password Hashing</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium mb-1">DB Triggers & Functions</p>
            <p className="text-sm font-bold text-amber-400">PL/pgSQL Trigger Stock Sync</p>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
        DBMS College Project • Developed by Tanish Pilly, Eshwar Siddhartha & G Manikanta
      </footer>
    </div>
  );
}
