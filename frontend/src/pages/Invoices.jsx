import React, { useEffect, useState } from 'react';
import { FileText, Printer, Search, RefreshCw, Wrench, CheckCircle2, User, Car } from 'lucide-react';
import Modal from '../components/Modal';
import { api } from '../api/axiosClient';

export default function Invoices({ selectedInvoiceId }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  // Selected Invoice Modal State
  const [viewInvoice, setViewInvoice] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/invoices');
      setInvoices(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoiceDetails = async (id) => {
    try {
      setInvoiceLoading(true);
      const res = await api.get(`/invoices/${id}`);
      setViewInvoice(res.data);
    } catch (err) {
      alert(`Failed to load invoice: ${err.message}`);
    } finally {
      setInvoiceLoading(false);
    }
  };

  useEffect(() => {
    if (selectedInvoiceId) {
      fetchInvoiceDetails(selectedInvoiceId);
    }
  }, [selectedInvoiceId]);

  const handlePrint = () => {
    window.print();
  };

  const filteredInvoices = invoices.filter(i =>
    i.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    i.registration_no?.toLowerCase().includes(search.toLowerCase()) ||
    String(i.invoice_id).includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Top Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search invoice #, customer, reg no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="text-xs text-slate-400 font-semibold">
          Showing {filteredInvoices.length} of {invoices.length} Invoices
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchInvoices} className="underline">Retry</button>
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
            <span>Loading invoices...</span>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No invoices found.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">Invoice #</th>
                <th className="p-4">Date</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Vehicle</th>
                <th className="p-4">Service Type</th>
                <th className="p-4">Subtotal</th>
                <th className="p-4">GST (18%)</th>
                <th className="p-4">Grand Total</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredInvoices.map((inv) => (
                <tr key={inv.invoice_id} className="hover:bg-slate-800/40 transition">
                  <td className="p-4 font-mono font-bold text-sky-400">#INV-{inv.invoice_id}</td>
                  <td className="p-4">{new Date(inv.invoice_date).toLocaleDateString()}</td>
                  <td className="p-4 font-semibold text-slate-100">{inv.customer_name}</td>
                  <td className="p-4 font-mono text-slate-300">{inv.registration_no}</td>
                  <td className="p-4">{inv.service_type}</td>
                  <td className="p-4 font-mono">₹{parseFloat(inv.subtotal).toFixed(2)}</td>
                  <td className="p-4 font-mono text-slate-400">₹{parseFloat(inv.gst).toFixed(2)}</td>
                  <td className="p-4 font-mono font-extrabold text-emerald-400">₹{parseFloat(inv.grand_total).toFixed(2)}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => fetchInvoiceDetails(inv.invoice_id)}
                      className="px-3 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 rounded-lg font-semibold inline-flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View Invoice</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Printable Invoice Modal */}
      <Modal
        isOpen={!!viewInvoice}
        onClose={() => setViewInvoice(null)}
        title={viewInvoice ? `Invoice #INV-${viewInvoice.invoice_id}` : 'Invoice Details'}
      >
        {invoiceLoading ? (
          <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
            <span>Generating invoice view...</span>
          </div>
        ) : viewInvoice ? (
          <div className="space-y-4">
            {/* Action Bar (Not visible during print) */}
            <div className="flex justify-end no-print">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Invoice</span>
              </button>
            </div>

            {/* Printable Area */}
            <div id="printable-invoice" className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-6 text-xs text-slate-300">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-sky-400" />
                    GearShift Pro Service Center
                  </h2>
                  <p className="text-slate-400 text-[11px] mt-0.5">Automotive Repair & Maintenance Hub • GSTIN: 36AAACG1234F1Z5</p>
                  <p className="text-slate-400 text-[11px]">Jubilee Hills, Road No. 36, Hyderabad, Telangana</p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">TAX INVOICE</span>
                  <p className="font-mono text-sm font-bold text-slate-100">#INV-{viewInvoice.invoice_id}</p>
                  <p className="text-slate-400 text-[11px]">Date: {new Date(viewInvoice.invoice_date).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Customer & Vehicle Info Box */}
              <div className="grid grid-cols-2 gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <div>
                  <p className="font-bold text-slate-200 text-xs flex items-center gap-1.5 mb-1">
                    <User className="w-3.5 h-3.5 text-sky-400" /> Customer Information
                  </p>
                  <p className="font-semibold text-slate-100">{viewInvoice.customer_name}</p>
                  <p className="text-slate-400">Phone: {viewInvoice.customer_phone}</p>
                  <p className="text-slate-400">Email: {viewInvoice.customer_email || 'N/A'}</p>
                </div>

                <div>
                  <p className="font-bold text-slate-200 text-xs flex items-center gap-1.5 mb-1">
                    <Car className="w-3.5 h-3.5 text-sky-400" /> Vehicle Information
                  </p>
                  <p className="font-mono font-bold text-sky-400">{viewInvoice.registration_no}</p>
                  <p className="text-slate-200">{viewInvoice.brand} {viewInvoice.model} ({viewInvoice.fuel_type})</p>
                  <p className="text-slate-400">Service: {viewInvoice.service_type} • Mechanic: {viewInvoice.mechanic_name}</p>
                </div>
              </div>

              {/* Itemized Breakdown Table */}
              <div>
                <h4 className="font-bold text-slate-200 mb-2">Itemized Charges Breakdown</h4>
                <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden">
                  <thead className="bg-slate-900 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {/* Labour Charge */}
                    <tr>
                      <td className="p-2.5 font-sans font-medium text-slate-200">Labour & Service Charges</td>
                      <td className="p-2.5 text-center">1</td>
                      <td className="p-2.5 text-right">₹{parseFloat(viewInvoice.labour_cost).toFixed(2)}</td>
                      <td className="p-2.5 text-right font-bold">₹{parseFloat(viewInvoice.labour_cost).toFixed(2)}</td>
                    </tr>

                    {/* Spare Parts Items */}
                    {viewInvoice.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-sans text-slate-300">Part: {item.part_name}</td>
                        <td className="p-2.5 text-center">{item.quantity}</td>
                        <td className="p-2.5 text-right">₹{parseFloat(item.price).toFixed(2)}</td>
                        <td className="p-2.5 text-right font-bold">₹{parseFloat(item.line_total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Calculation */}
              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-1.5 font-mono text-xs border-t border-slate-800 pt-3">
                  <div className="flex justify-between text-slate-300">
                    <span>Labour Charges:</span>
                    <span>₹{parseFloat(viewInvoice.labour_cost).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Parts Charges:</span>
                    <span>₹{parseFloat(viewInvoice.parts_cost).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-100 border-t border-slate-800/80 pt-1">
                    <span>Subtotal:</span>
                    <span>₹{parseFloat(viewInvoice.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>GST (18%):</span>
                    <span>₹{parseFloat(viewInvoice.gst).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-emerald-400 border-t border-slate-800 pt-1">
                    <span>Grand Total:</span>
                    <span>₹{parseFloat(viewInvoice.grand_total).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4 text-center text-[11px] text-slate-500 italic">
                Thank you for servicing your vehicle with GearShift Pro! Computer-generated invoice.
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
