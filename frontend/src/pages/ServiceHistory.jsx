import React, { useEffect, useState, useRef } from 'react';
import { History, Search, Car, User, Calendar, Wrench, Package, FileText, CheckCircle2, AlertCircle, RefreshCw, QrCode, Download, Printer, Camera, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import Modal from '../components/Modal';
import { api } from '../api/axiosClient';

export default function ServiceHistory({ initialRegNumber, setActiveTab, onSelectInvoice }) {
  const [regNumber, setRegNumber] = useState(initialRegNumber || 'TS09AB1234');
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // QR Modal for Active Vehicle
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const qrRef = useRef(null);

  // Live Camera Scanner Modal State
  const [cameraScannerOpen, setCameraScannerOpen] = useState(false);
  const scannerRef = useRef(null);

  const fetchHistory = async (registrationToSearch) => {
    const targetReg = (registrationToSearch || regNumber).trim();
    if (!targetReg) return;

    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/service-history/${encodeURIComponent(targetReg)}`);
      setHistoryData(res);
    } catch (err) {
      setHistoryData(null);
      setError(err.message || `No service history found for vehicle '${targetReg}'.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialRegNumber) {
      setRegNumber(initialRegNumber);
      fetchHistory(initialRegNumber);
    } else {
      fetchHistory('TS09AB1234');
    }
  }, [initialRegNumber]);

  // Handle Camera QR Scanner lifecycle
  useEffect(() => {
    let scanner = null;
    if (cameraScannerOpen) {
      // Initialize Html5QrcodeScanner
      setTimeout(() => {
        const scannerContainer = document.getElementById('qr-reader');
        if (scannerContainer) {
          scannerContainer.innerHTML = '';
          scanner = new Html5QrcodeScanner(
            'qr-reader',
            { fps: 10, qrbox: { width: 220, height: 220 } },
            /* verbose= */ false
          );

          scanner.render(
            (decodedText) => {
              // Extract registration number from decoded URL or text
              let scannedReg = decodedText.trim();
              if (scannedReg.includes('reg=')) {
                try {
                  const urlObj = new URL(scannedReg);
                  scannedReg = urlObj.searchParams.get('reg') || scannedReg;
                } catch {
                  const parts = scannedReg.split('reg=');
                  scannedReg = parts[1]?.split('&')[0] || scannedReg;
                }
              }

              const cleanReg = scannedReg.trim().toUpperCase();
              setRegNumber(cleanReg);
              fetchHistory(cleanReg);

              if (scanner) {
                scanner.clear().catch(console.error);
              }
              setCameraScannerOpen(false);
            },
            (errorMessage) => {
              // Ignore scanning frame errors
            }
          );
        }
      }, 200);
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [cameraScannerOpen]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHistory();
  };

  const getVehicleQrUrl = (regNo) => {
    const host = window.location.host;
    const protocol = window.location.protocol;
    return `${protocol}//${host}/?reg=${encodeURIComponent(regNo)}`;
  };

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
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20);

      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `${historyData?.vehicle?.registration_no}_Service_QR.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="space-y-6">
      {/* Search Bar Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <History className="w-5 h-5 text-sky-400" />
              <h3 className="text-base font-bold text-slate-100">Vehicle Service History Search</h3>
            </div>
            <p className="text-xs text-slate-400">
              Executes PostgreSQL Stored Function <code className="text-sky-400 font-mono font-bold">SELECT * FROM get_vehicle_service_history('{regNumber}')</code>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCameraScannerOpen(true)}
              className="px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
            >
              <Camera className="w-4 h-4" />
              <span>Scan QR with Camera</span>
            </button>

            {historyData?.vehicle && (
              <button
                onClick={() => setQrModalOpen(true)}
                className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
              >
                <QrCode className="w-4 h-4" />
                <span>Vehicle QR Code</span>
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-3 max-w-xl">
          <div className="relative flex-1">
            <Car className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              required
              placeholder="Enter Registration Number (e.g. TS09AB1234)"
              value={regNumber}
              onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 font-mono uppercase focus:outline-none focus:border-sky-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-sky-500/20 flex items-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Search History</span>
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Display */}
      {historyData && (
        <div className="space-y-6 animate-fadeIn">
          {/* Vehicle & Customer Summary Header Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-start gap-4">
              <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
                <Car className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Vehicle Details</span>
                <h4 className="text-lg font-bold font-mono text-sky-400">{historyData.vehicle?.registration_no}</h4>
                <p className="text-sm font-semibold text-slate-200">{historyData.vehicle?.brand} {historyData.vehicle?.model}</p>
                <p className="text-xs text-slate-400">
                  Model Year: {historyData.vehicle?.manufacturing_year || 'N/A'} • Fuel: {historyData.vehicle?.fuel_type} • Odometer: {historyData.vehicle?.mileage?.toLocaleString()} km
                </p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-start gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <User className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Owner Information</span>
                <h4 className="text-base font-bold text-slate-100">{historyData.vehicle?.customer_name}</h4>
                <p className="text-xs text-slate-300 font-mono">Phone: {historyData.vehicle?.customer_phone}</p>
                <p className="text-xs text-slate-400">Email: {historyData.vehicle?.customer_email || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Timeline of Past Service Records */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
              <div>
                <h4 className="font-bold text-slate-100 text-base">Service History Timeline</h4>
                <p className="text-xs text-slate-400">Returned from PostgreSQL stored function <code className="text-sky-400 font-mono">get_vehicle_service_history()</code></p>
              </div>
              <span className="px-3 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-bold rounded-full">
                {historyData.total_services} Service Record{historyData.total_services !== 1 ? 's' : ''} Found
              </span>
            </div>

            {historyData.history?.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                No completed service history recorded for this vehicle yet.
              </div>
            ) : (
              <div className="space-y-6 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-800">
                {historyData.history?.map((item, idx) => (
                  <div key={idx} className="relative pl-8 space-y-3">
                    {/* Timeline Node Icon */}
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-slate-900 border-2 border-sky-500 flex items-center justify-center text-sky-400 shadow-md shadow-sky-500/20">
                      <Wrench className="w-3 h-3" />
                    </div>

                    {/* Service Record Box */}
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                        <div>
                          <span className="px-2.5 py-1 bg-sky-500/10 text-sky-400 text-xs font-bold rounded-lg border border-sky-500/20 mr-2">
                            {item.service_type}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            Completed on {new Date(item.service_date).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-xs text-slate-400">Total Cost: </span>
                          <span className="text-base font-extrabold font-mono text-emerald-400">
                            ₹{parseFloat(item.total_cost).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Work Description & Mechanic */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-slate-500 font-semibold block mb-0.5">Assigned Mechanic</span>
                          <p className="font-semibold text-slate-200">{item.mechanic_name}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 font-semibold block mb-0.5">Service Description</span>
                          <p className="text-slate-300">{item.description || 'Routine service inspection.'}</p>
                        </div>
                      </div>

                      {/* Replaced Parts Used Table */}
                      {item.parts_used?.length > 0 && (
                        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 space-y-2">
                          <h5 className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-amber-400" />
                            Replaced Spare Parts ({item.parts_used.length})
                          </h5>
                          <div className="divide-y divide-slate-800/60">
                            {item.parts_used.map((part, pIdx) => (
                              <div key={pIdx} className="py-1.5 flex items-center justify-between text-xs font-mono">
                                <span className="text-slate-300">{part.part_name} <span className="text-slate-500">(x{part.quantity})</span></span>
                                <span className="text-slate-400">₹{parseFloat(part.total_price).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Invoice Link Button */}
                      {item.invoice?.invoice_id && (
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => {
                              if (onSelectInvoice) onSelectInvoice(item.invoice.invoice_id);
                              setActiveTab('invoices');
                            }}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold rounded-xl flex items-center gap-1.5 border border-slate-700 transition"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View Full Invoice #{item.invoice.invoice_id} (Grand Total: ₹{parseFloat(item.invoice.grand_total).toFixed(2)})</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Live Camera QR Scanner Modal */}
      <Modal
        isOpen={cameraScannerOpen}
        onClose={() => setCameraScannerOpen(false)}
        title="Scan Vehicle QR Code with Camera"
      >
        <div className="space-y-4 text-xs text-center">
          <p className="text-slate-300">
            Point your camera or laptop webcam at a vehicle QR code sticker to scan automatically.
          </p>

          <div className="bg-slate-950 p-2 rounded-2xl border border-slate-800 overflow-hidden">
            <div id="qr-reader" className="w-full overflow-hidden text-slate-300 font-mono text-xs"></div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setCameraScannerOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* QR Code Tag Modal for Currently Viewed Vehicle */}
      {historyData?.vehicle && (
        <Modal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          title={`Vehicle QR Code Tag: ${historyData.vehicle.registration_no}`}
        >
          <div className="space-y-6 text-xs text-center">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Service History Tag</span>
              <h3 className="text-xl font-extrabold font-mono text-sky-400">{historyData.vehicle.registration_no}</h3>
              <p className="font-semibold text-slate-200">{historyData.vehicle.brand} {historyData.vehicle.model}</p>
              <p className="text-slate-400">Owner: <span className="text-slate-200 font-medium">{historyData.vehicle.customer_name}</span> ({historyData.vehicle.customer_phone})</p>
            </div>

            <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border-4 border-amber-500/30 w-fit mx-auto shadow-2xl" ref={qrRef}>
              <QRCodeSVG
                value={getVehicleQrUrl(historyData.vehicle.registration_no)}
                size={210}
                level="H"
                includeMargin={true}
              />
              <p className="text-[11px] font-mono text-slate-800 mt-2 font-bold tracking-tight">
                SCAN TO VIEW SERVICE HISTORY
              </p>
              <p className="text-[10px] font-mono text-slate-500 truncate max-w-[200px]">
                {getVehicleQrUrl(historyData.vehicle.registration_no)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={handleDownloadQR}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>Download PNG</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Print Tag</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
