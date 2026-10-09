import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  CalendarCheck, 
  Truck,
  Wrench, 
  History, 
  UserCheck, 
  Package, 
  FileText, 
  BarChart3 
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'pickup', label: 'Pickup Requests', icon: Truck, badge: 'Dispatch' },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'vehicles', label: 'Vehicles', icon: Car },
  { id: 'bookings', label: 'Service Bookings', icon: CalendarCheck },
  { id: 'records', label: 'Service Records', icon: Wrench },
  { id: 'history', label: 'Service History', icon: History, highlight: true },
  { id: 'mechanics', label: 'Mechanics', icon: UserCheck },
  { id: 'parts', label: 'Spare Parts', icon: Package },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
];

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-100 text-sm tracking-wide">GearShift Pro</h1>
            <p className="text-xs text-slate-400">Service History System</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {item.badge}
                  </span>
                )}
                {item.highlight && (
                  <span className="ml-auto text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    Main
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Team Info / Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">DBMS Team Project</p>
        <div className="text-xs text-slate-300 space-y-0.5 font-mono">
          <p>• Tanish Pilly (55)</p>
          <p>• A Eshwar Sidhartha (265)</p>
          <p>• G Manikanta (199)</p>
        </div>
      </div>
    </aside>
  );
}
