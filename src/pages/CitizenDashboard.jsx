import React, { useState, useEffect } from 'react';
import WasteMap from '../components/map/WasteMap';
import AIClassifierWidget from '../components/ai/AIClassifierWidget';
import Modal from '../components/common/Modal';
import { PriorityBadge, TaskStatusBadge } from '../components/common/Badge';
import { api } from '../services/api';
import { PlusCircle, MapPin, AlertCircle, FileText, CheckCircle2, Clock, Image, Sparkles } from 'lucide-react';

export default function CitizenDashboard() {
  const [bins, setBins] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Complaint Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [selectedBinId, setSelectedBinId] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [aiClassification, setAiClassification] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [binsRes, compRes] = await Promise.all([
        api.getBins(),
        api.getComplaints()
      ]);

      if (binsRes.success) setBins(binsRes.data);
      if (compRes.success) setComplaints(compRes.data);
    } catch (err) {
      console.error('Error loading citizen portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!description || !locationAddress) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('description', description);
      formData.append('location_address', locationAddress);
      if (selectedBinId) formData.append('bin_id', selectedBinId);
      if (imageFile) formData.append('image', imageFile);

      const res = await api.createComplaint(formData);
      if (res.success) {
        setIsModalOpen(false);
        setDescription('');
        setLocationAddress('');
        setSelectedBinId('');
        setImageFile(null);
        setImagePreview('');
        setAiClassification(null);
        fetchData();
      }
    } catch (err) {
      console.error('Error filing complaint:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 to-slate-900 border border-emerald-500/20 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Citizen Waste Portal</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Locate nearby dustbins, inspect live fill status, and report overflowing waste directly to municipal authorities.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg transition transform hover:scale-[1.02] shrink-0"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Report Overflow / Waste Issue</span>
        </button>
      </div>

      {/* Live Bin Map Section */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
          <MapPin className="w-5 h-5 text-emerald-400" />
          <span>Nearby Smart Dustbins & Live Status</span>
        </h3>
        <WasteMap bins={bins} height="h-[420px]" />
      </div>

      {/* Complaints Tracking Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-teal-400" />
            <span>My Submitted Complaints ({complaints.length})</span>
          </h3>
        </div>

        {complaints.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto" />
            <p>No complaints reported yet. Click "Report Overflow" above if you spot waste issues in your area.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {complaints.map((c) => (
              <div key={c.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 shadow-md">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-slate-500">REF #{c.id}</span>
                    <p className="text-xs font-semibold text-slate-200">{c.location_address}</p>
                  </div>
                  <TaskStatusBadge status={c.status} />
                </div>

                <p className="text-xs text-slate-400 line-clamp-2">{c.description}</p>

                {c.image_url && (
                  <img src={c.image_url} alt="Reported Waste" className="h-32 w-full object-cover rounded-lg border border-slate-800" />
                )}

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(c.created_at).toLocaleDateString()}</span>
                  </span>
                  <PriorityBadge priority={c.priority} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* File Complaint Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Report Waste Problem" maxWidth="max-w-2xl">
        <form onSubmit={handleSubmitComplaint} className="space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Location Address *
            </label>
            <input
              type="text"
              required
              value={locationAddress}
              onChange={(e) => setLocationAddress(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              placeholder="e.g., 45th Street near City Central Park"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Associated Waste Bin (Optional)
            </label>
            <select
              value={selectedBinId}
              onChange={(e) => setSelectedBinId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
            >
              <option value="">Select Bin (Optional)</option>
              {bins.map(bin => (
                <option key={bin.id} value={bin.id}>
                  {bin.bin_code} — {bin.address}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Problem Description *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              placeholder="Describe the overflow, odor, or waste dumping problem..."
            />
          </div>

          {/* Optional AI Waste Image Classifier Preview */}
          <div className="pt-2">
            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Attach Waste Photo & AI Classifier</span>
            </p>
            <AIClassifierWidget
              onClassificationComplete={(result) => setAiClassification(result)}
            />
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
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition shadow-lg disabled:opacity-50"
            >
              {submitting ? 'Filing Report...' : 'Submit Waste Report'}
            </button>
          </div>

        </form>
      </Modal>

    </div>
  );
}
