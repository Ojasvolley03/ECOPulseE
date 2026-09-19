import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Modal from '../components/common/Modal';
import LocationPicker from '../components/common/LocationPicker';
import { StatusBadge } from '../components/common/Badge';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { Trash2, Plus, Edit, Trash, MapPin, RefreshCw, Cpu, QrCode, ExternalLink, Download, Printer, Copy, Check } from 'lucide-react';

export default function BinManagementPage({ onOpenSimulator }) {
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBin, setEditingBin] = useState(null);
  const [binCode, setBinCode] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [wasteType, setWasteType] = useState('General');
  const [fillLevel, setFillLevel] = useState(0);

  // QR Modal State
  const [selectedQrBin, setSelectedQrBin] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Scan Simulator State
  const [isScanSimOpen, setIsScanSimOpen] = useState(false);
  const [simScanCode, setSimScanCode] = useState('');
  const { socket } = useSocket();

  useEffect(() => {
    fetchBins();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('bin_created', fetchBins);
    socket.on('bin_updated', fetchBins);
    socket.on('bin_deleted', fetchBins);

    return () => {
      socket.off('bin_created', fetchBins);
      socket.off('bin_updated', fetchBins);
      socket.off('bin_deleted', fetchBins);
    };
  }, [socket]);

  const fetchBins = async () => {
    try {
      const res = await api.getBins();
      if (res.success) setBins(res.data);
    } catch (err) {
      console.error('Error loading bins:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingBin(null);
    setBinCode(`BIN-${Math.floor(100 + Math.random() * 900)}`);
    setAddress('');
    setLatitude(null);
    setLongitude(null);
    setWasteType('General');
    setFillLevel(0);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (bin) => {
    setEditingBin(bin);
    setBinCode(bin.bin_code);
    setAddress(bin.address);
    setLatitude(bin.latitude);
    setLongitude(bin.longitude);
    setWasteType(bin.waste_type);
    setFillLevel(bin.fill_level);
    setIsModalOpen(true);
  };

  const handleSubmitBin = async (e) => {
    e.preventDefault();
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    try {
      if (editingBin) {
        await api.updateBin(editingBin.id, {
          address,
          latitude,
          longitude,
          waste_type: wasteType,
          fill_level: fillLevel
        });
      } else {
        await api.createBin({
          bin_code: binCode,
          address,
          latitude,
          longitude,
          waste_type: wasteType,
          fill_level: fillLevel
        });
      }
      setIsModalOpen(false);
      fetchBins();
    } catch (err) {
      console.error('Error saving bin:', err);
    }
  };

  const handleDeleteBin = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bin node?')) return;
    try {
      await api.deleteBin(id);
      fetchBins();
    } catch (err) {
      console.error('Error deleting bin:', err);
    }
  };

  const handleLocationSelect = (lat, lng, selectedAddress) => {
    setLatitude(lat);
    setLongitude(lng);
    if (selectedAddress) setAddress(selectedAddress);
  };

  const handleCopyPublicUrl = (code) => {
    const url = `${window.location.origin}/bin/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center space-x-2">
            <Trash2 className="w-6 h-6 text-emerald-400" />
            <span>Waste Bin Fleet & Smart QR Network</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Provision sensor nodes, deploy unique bin QR tags, and track live capacity fill telemetry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsScanSimOpen(true)}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition"
          >
            <QrCode className="w-4 h-4 text-emerald-400" />
            <span>Scan QR Simulator</span>
          </button>

          <button
            onClick={onOpenSimulator}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-emerald-500/20 transition"
          >
            <Cpu className="w-4 h-4" />
            <span>Simulate Sensors</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-950 transition transform hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Dustbin</span>
          </button>
        </div>
      </div>

      {/* Dustbins Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Bin Code</th>
                <th className="px-6 py-4">Address / Location</th>
                <th className="px-6 py-4">Waste Category</th>
                <th className="px-6 py-4">Fill Level</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Smart QR Tag</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {bins.map((bin) => (
                <tr key={bin.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-6 py-4 font-bold text-emerald-400">{bin.bin_code}</td>
                  <td className="px-6 py-4 font-sans text-slate-200">{bin.address}</td>
                  <td className="px-6 py-4 font-sans text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                      {bin.waste_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-100">
                    <div className="flex items-center space-x-2">
                      <span>{bin.fill_level}%</span>
                      {bin.fill_level >= 75 && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" title="75%+ Capacity Alert Triggered" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-sans">
                    <StatusBadge status={bin.status} fillLevel={bin.fill_level} />
                  </td>
                  <td className="px-6 py-4 font-sans">
                    <button
                      onClick={() => setSelectedQrBin(bin)}
                      className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>View QR Code</span>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right font-sans space-x-2">
                    <button
                      onClick={() => handleOpenEditModal(bin)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-emerald-400 transition"
                      title="Edit Bin Specs"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteBin(bin.id)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-rose-400 transition"
                      title="Delete Bin"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Modal for Selected Bin */}
      {selectedQrBin && (
        <Modal
          isOpen={!!selectedQrBin}
          onClose={() => setSelectedQrBin(null)}
          title={`Smart Bin QR Tag: ${selectedQrBin.bin_code}`}
        >
          <div className="space-y-6 text-center">
            
            {/* High Res QR Box */}
            <div className="bg-white p-5 rounded-2xl inline-block shadow-xl mx-auto">
              <QRCodeSVG
                value={`${window.location.origin}/bin/${selectedQrBin.bin_code}`}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>

            <div>
              <div className="flex items-center justify-center space-x-2">
                <span className="font-mono font-black text-lg text-emerald-400">{selectedQrBin.bin_code}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">{selectedQrBin.waste_type}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">{selectedQrBin.address}</p>
            </div>

            {/* Public Link Box */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-left flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 truncate mr-2">
                {`${window.location.origin}/bin/${selectedQrBin.bin_code}`}
              </span>
              <button
                onClick={() => handleCopyPublicUrl(selectedQrBin.bin_code)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold shrink-0 flex items-center space-x-1"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <a
                href={`/bin/${selectedQrBin.bin_code}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-lg transition"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Public Bin Page</span>
              </a>
            </div>

          </div>
        </Modal>
      )}

      {/* Scan Simulator Modal */}
      {isScanSimOpen && (
        <Modal
          isOpen={isScanSimOpen}
          onClose={() => setIsScanSimOpen(false)}
          title="Smart Bin QR Scanner Simulator"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Select any registered dustbin to simulate scanning its physical QR code with a smartphone camera.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {bins.map((b) => (
                <a
                  key={b.id}
                  href={`/bin/${b.bin_code}`}
                  className="p-3 bg-slate-950 hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/40 rounded-xl flex items-center justify-between text-xs transition group"
                >
                  <div>
                    <span className="font-mono font-bold text-emerald-400 group-hover:underline">{b.bin_code}</span>
                    <p className="text-[11px] text-slate-400 truncate max-w-[140px]">{b.address}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-200">{b.fill_level}%</span>
                    <QrCode className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 ml-auto mt-0.5" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Bin Edit/Create Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingBin ? 'Edit Smart Bin' : 'Register New Smart Bin'}>
        <form onSubmit={handleSubmitBin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Unique Bin Code</label>
            <input
              type="text"
              required
              disabled={!!editingBin}
              value={binCode}
              onChange={(e) => setBinCode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <LocationPicker
            onLocationSelect={handleLocationSelect}
            initialLat={latitude}
            initialLng={longitude}
            initialAddress={address}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Waste Category</label>
              <select
                value={wasteType}
                onChange={(e) => setWasteType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="General">General Waste</option>
                <option value="Recyclable">Recyclable</option>
                <option value="Organic">Organic</option>
                <option value="Paper">Paper</option>
                <option value="Glass">Glass</option>
                <option value="Metal">Metal</option>
                <option value="Hazardous">Hazardous</option>
                <option value="Mixed">Mixed Waste</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Fill Level (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={fillLevel}
                onChange={(e) => setFillLevel(parseInt(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition shadow-lg"
            >
              {editingBin ? 'Save Changes' : 'Create Dustbin Node'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
