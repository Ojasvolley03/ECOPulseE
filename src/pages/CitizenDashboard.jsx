import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import WasteMap from '../components/map/WasteMap';
import AIClassifierWidget from '../components/ai/AIClassifierWidget';
import Modal from '../components/common/Modal';
import { PriorityBadge, TaskStatusBadge } from '../components/common/Badge';
import { api } from '../services/api';
import { 
  PlusCircle, 
  MapPin, 
  AlertCircle, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Image, 
  Sparkles, 
  User, 
  Phone, 
  Navigation, 
  QrCode,
  Check,
  Send,
  RefreshCw
} from 'lucide-react';

export default function CitizenDashboard() {
  const [bins, setBins] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const location = useLocation();

  // Complaint Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [citizenName, setCitizenName] = useState('');
  const [citizenPhone, setCitizenPhone] = useState('');
  const [problemType, setProblemType] = useState('Overflowing Dustbin');
  const [description, setDescription] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [selectedBinId, setSelectedBinId] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [aiClassification, setAiClassification] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccessId, setSubmittedSuccessId] = useState(null);

  useEffect(() => {
    fetchData();

    // Check query params for pre-filling bin
    const queryParams = new URLSearchParams(location.search);
    const qBinId = queryParams.get('binId');
    const qAddress = queryParams.get('address');
    if (qBinId || qAddress) {
      if (qBinId) setSelectedBinId(qBinId);
      if (qAddress) setLocationAddress(decodeURIComponent(qAddress));
      setIsModalOpen(true);
    }
  }, [location.search]);

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

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocationAddress(`GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)} (Current Location)`);
        },
        () => {
          setLocationAddress('Market St & 4th St (Downtown Area)');
        }
      );
    } else {
      setLocationAddress('Market St & 4th St (Downtown Area)');
    }
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!description || !locationAddress || !citizenName) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('citizen_name', citizenName);
      if (citizenPhone) formData.append('phone', citizenPhone);
      formData.append('description', `[${problemType}] ${description}`);
      formData.append('location_address', locationAddress);
      if (selectedBinId) formData.append('bin_id', selectedBinId);
      if (imageFile) formData.append('image', imageFile);

      const res = await api.createComplaint(formData);
      if (res.success) {
        setSubmittedSuccessId(res.data?.id || 'CMP-SUCCESS');
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
      console.error('Error submitting complaint:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Citizen Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/20 p-6 sm:p-8 rounded-3xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] tracking-wider uppercase border border-emerald-500/30">
              Community Waste Reporting Portal
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold">
              No Login Required
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight mt-1">
            Citizen Action & Waste Incident Portal
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Locate nearby smart bins, scan bin QR codes, and report overflows or sanitation issues with zero hassle.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-xl shadow-emerald-950 transition transform hover:scale-[1.02]"
          >
            <PlusCircle className="w-5 h-5" />
            <span>File a Waste Complaint</span>
          </button>
        </div>
      </div>

      {/* Submission Success Banner */}
      {submittedSuccessId && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold uppercase tracking-wider">Report Logged Successfully: </span>
              <span>Your complaint reference ID is <strong>#{submittedSuccessId}</strong>. Municipal collection trucks have been notified.</span>
            </div>
          </div>
          <button
            onClick={() => setSubmittedSuccessId(null)}
            className="text-slate-400 hover:text-white text-xs underline font-semibold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Map & Live Incident Tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Interactive Map */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Real-Time Public Dustbin Network</span>
            </h3>
            <span className="text-xs text-slate-400">{bins.length} Smart Bins Active</span>
          </div>

          <WasteMap
            bins={bins}
            height="h-[480px]"
            onSelectBin={(bin) => {
              setSelectedBinId(bin.id.toString());
              setLocationAddress(bin.address);
              setIsModalOpen(true);
            }}
          />
        </div>

        {/* Right 1 Col: AI Classifier & Quick Reporting Card */}
        <div className="space-y-6">
          <AIClassifierWidget />

          {/* Quick QR Info Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>Smart Bin QR System</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every city dustbin is tagged with an EcoPulse QR code. Scanning the physical sticker shows real-time fill level and lets you report directly for that bin.
            </p>
            <Link
              to="/bins"
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-400 hover:underline pt-1"
            >
              <span>Explore Bin QR Network</span>
              <span>→</span>
            </Link>
          </div>
        </div>

      </div>

      {/* Community Complaints Tracking Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <span>Public Incident & Complaints Tracker ({complaints.length})</span>
          </h3>
          <button
            onClick={fetchData}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh Complaints"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {complaints.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/30 mx-auto" />
            <p>No complaints reported right now. The community is clean!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {complaints.map((c) => (
              <div key={c.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-200">{c.citizen_name || 'Anonymous Citizen'}</span>
                    <TaskStatusBadge status={c.status} />
                  </div>
                  <p className="text-xs text-slate-300 leading-snug line-clamp-2">{c.description}</p>
                  <p className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{c.location_address}</span>
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(c.created_at).toLocaleDateString()}</span>
                  </span>
                  <PriorityBadge priority={c.priority} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Citizen Complaint Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Submit Citizen Waste Complaint">
        <form onSubmit={handleSubmitComplaint} className="space-y-4">
          
          {/* Citizen Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Your Full Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g., Alex Johnson"
                  value={citizenName}
                  onChange={(e) => setCitizenName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 pl-9"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="e.g., +1 555-0199"
                  value={citizenPhone}
                  onChange={(e) => setCitizenPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 pl-9"
                />
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          {/* Problem Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Issue Category
            </label>
            <select
              value={problemType}
              onChange={(e) => setProblemType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="Overflowing Dustbin">🗑️ Overflowing Dustbin / Sidewalk Spill</option>
              <option value="Damaged or Broken Bin">⚠️ Damaged / Broken Lid or Sensor</option>
              <option value="Severe Foul Odor">💨 Severe Odor / Hazard</option>
              <option value="Illegal Dumping">🚫 Illegal Dumping / Unauthorized Waste</option>
              <option value="Missed Collection">🚚 Missed Scheduled Collection</option>
              <option value="Other Sanitation Issue">📝 Other Sanitation Issue</option>
            </select>
          </div>

          {/* Location with GPS Auto Detect */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Location Address <span className="text-rose-400">*</span>
              </label>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="text-[11px] text-emerald-400 hover:underline flex items-center space-x-1"
              >
                <Navigation className="w-3 h-3" />
                <span>Use Current GPS</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={locationAddress}
              onChange={(e) => setLocationAddress(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              placeholder="e.g., 450 Mission St near transit stop"
            />
          </div>

          {/* Associated Bin Dropdown (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Associated Dustbin (Optional)
            </label>
            <select
              value={selectedBinId}
              onChange={(e) => setSelectedBinId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            >
              <option value="">-- None / General Location --</option>
              {bins.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bin_code} - {b.address} ({b.fill_level}% Full)
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Description / Notes <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              placeholder="Describe the issue in detail..."
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Attach Photo (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
            />
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="mt-2 w-full h-32 object-cover rounded-xl border border-slate-800"
              />
            )}
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
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
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg transition flex items-center space-x-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting...' : 'Submit Complaint'}</span>
            </button>
          </div>

        </form>
      </Modal>

    </div>
  );
}
