import React, { useState, useEffect } from 'react';
import Modal from '../components/common/Modal';
import { StatusBadge } from '../components/common/Badge';
import { api } from '../services/api';
import { Trash2, Plus, Edit, Trash, MapPin, RefreshCw, Cpu } from 'lucide-react';

export default function BinManagementPage({ onOpenSimulator }) {
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBin, setEditingBin] = useState(null);
  const [binCode, setBinCode] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(37.7749);
  const [longitude, setLongitude] = useState(-122.4194);
  const [wasteType, setWasteType] = useState('General');
  const [fillLevel, setFillLevel] = useState(0);

  useEffect(() => {
    fetchBins();
  }, []);

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
    setLatitude(37.7800 + Math.random() * 0.02);
    setLongitude(-122.4100 + Math.random() * 0.02);
    setWasteType('General');
    setFillLevel(15);
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
    if (window.confirm('Are you sure you want to delete this bin node?')) {
      try {
        await api.deleteBin(id);
        fetchBins();
      } catch (err) {
        console.error('Error deleting bin:', err);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center space-x-2">
            <Trash2 className="w-6 h-6 text-emerald-400" />
            <span>Waste Bin Fleet Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure telemetry nodes, geographical coordinates, and waste categories.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenSimulator}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 font-bold text-xs border border-slate-700 transition"
          >
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Sensor Simulator</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-slate-950 font-bold text-xs hover:from-emerald-500 hover:to-teal-400 transition shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Smart Bin</span>
          </button>
        </div>
      </div>

      {/* Bins Table */}
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
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {bins.map((bin) => (
                <tr key={bin.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-6 py-4 font-bold text-emerald-400">{bin.bin_code}</td>
                  <td className="px-6 py-4 font-sans text-slate-200">{bin.address}</td>
                  <td className="px-6 py-4 font-sans text-slate-300">{bin.waste_type}</td>
                  <td className="px-6 py-4 font-bold text-slate-100">{bin.fill_level}%</td>
                  <td className="px-6 py-4 font-sans">
                    <StatusBadge status={bin.status} fillLevel={bin.fill_level} />
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

      {/* Bin Modal */}
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

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Address / Landmark</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              placeholder="e.g., Downtown Plaza North Entry"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                required
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                required
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

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
