import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api';
import WasteMap from '../components/map/WasteMap';
import { StatusBadge, PriorityBadge } from '../components/common/Badge';
import { 
  Trash2, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Thermometer, 
  BatteryCharging, 
  QrCode, 
  Download, 
  Share2, 
  ArrowLeft, 
  RefreshCw,
  PlusCircle
} from 'lucide-react';

export default function PublicBinPage() {
  const { binCode } = useParams();
  const [bin, setBin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchBinData();
  }, [binCode]);

  const fetchBinData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getBinByCode(binCode);
      if (res.success && res.data) {
        setBin(res.data);
      } else {
        setError('Dustbin not found.');
      }
    } catch (err) {
      console.error('Error fetching bin info:', err);
      setError(err.message || 'Failed to load bin data.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-400">
        <RefreshCw className="w-10 h-10 animate-spin text-emerald-400 mb-4" />
        <p className="text-sm font-semibold">Scanning & Fetching Smart Bin Telemetry...</p>
      </div>
    );
  }

  if (error || !bin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100">Bin Not Found</h2>
        <p className="text-xs text-slate-400 mt-2 max-w-sm">
          Could not locate dustbin code "{binCode}". Please verify the QR code or link.
        </p>
        <Link
          to="/citizen"
          className="mt-6 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-2 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Citizen Portal</span>
        </Link>
      </div>
    );
  }

  const isHighCapacity = bin.fill_level >= 75;
  const isCritical = bin.fill_level >= 90;
  const publicUrl = window.location.href;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <Link
          to="/citizen"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Citizen Portal</span>
        </Link>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleShare}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 font-semibold transition"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{copied ? 'Link Copied!' : 'Share'}</span>
          </button>
          <button
            onClick={fetchBinData}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
            title="Refresh Live Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Smart Bin Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
          isCritical ? 'bg-rose-500/10' : isHighCapacity ? 'bg-orange-500/10' : 'bg-emerald-500/10'
        }`} />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          
          {/* Bin Info & Status */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-slate-800 text-emerald-400 border border-emerald-500/20 font-mono font-black text-sm tracking-wider">
                {bin.bin_code}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold">
                {bin.waste_type} Waste
              </span>
              <StatusBadge status={bin.status} fillLevel={bin.fill_level} />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight flex items-center space-x-2">
                <span>Smart Dustbin Telemetry</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1 flex items-center space-x-1.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium text-slate-300">{bin.address}</span>
              </p>
            </div>

            {/* Alert banner if >= 75% */}
            {isHighCapacity && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold uppercase tracking-wide">High Capacity / Overflow Alert</p>
                  <p className="text-[11px] text-rose-300/80 mt-0.5">
                    This bin has reached {bin.fill_level}% capacity. Collection vehicle has been notified for pickup.
                  </p>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to={`/report?binId=${bin.id}&binCode=${bin.bin_code}&address=${encodeURIComponent(bin.address)}`}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center space-x-2 shadow-lg shadow-emerald-950 transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Report Problem / Overflow</span>
              </Link>
            </div>
          </div>

          {/* QR Code Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center text-center space-y-3 shadow-inner">
            <div className="bg-white p-3 rounded-xl shadow-md">
              <QRCodeSVG
                value={publicUrl}
                size={140}
                level="H"
                includeMargin={false}
              />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">Bin QR Code</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Scan with any phone camera</p>
            </div>
          </div>

        </div>
      </div>

      {/* Sensor & Telemetry Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        {/* Fill Level Metric */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Capacity Fill</span>
            <Trash2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-100">
            {bin.fill_level}%
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full ${
                isCritical ? 'bg-rose-500' : isHighCapacity ? 'bg-orange-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${bin.fill_level}%` }}
            />
          </div>
        </div>

        {/* Temperature */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Internal Temp</span>
            <Thermometer className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-100">
            {bin.readings?.[0]?.temperature ? `${bin.readings[0].temperature}°C` : '24°C'}
          </div>
          <p className="text-[10px] text-emerald-400 font-semibold">Optimal range</p>
        </div>

        {/* Battery / Power */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Sensor Battery</span>
            <BatteryCharging className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-100">
            {bin.readings?.[0]?.battery_level ? `${bin.readings[0].battery_level}%` : '98%'}
          </div>
          <p className="text-[10px] text-slate-400">Solar synced</p>
        </div>

        {/* Last Collection / Update */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Last Sync</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-sm font-bold text-slate-200 truncate">
            {new Date(bin.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <p className="text-[10px] text-slate-500">
            {new Date(bin.last_updated).toLocaleDateString()}
          </p>
        </div>

      </div>

      {/* Map Location Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-emerald-400" />
          <span>Bin Geographical Location</span>
        </h3>
        <WasteMap
          bins={[bin]}
          height="h-[320px]"
          selectedLocation={[bin.latitude, bin.longitude]}
        />
      </div>

    </div>
  );
}
