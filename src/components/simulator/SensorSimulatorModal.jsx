import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { StatusBadge } from '../common/Badge';
import { api } from '../../services/api';
import { Cpu, Play, Square, Zap, Thermometer, Battery, Gauge, RefreshCw } from 'lucide-react';

export default function SensorSimulatorModal({ isOpen, onClose, bins = [], onBinUpdated }) {
  const [selectedBinId, setSelectedBinId] = useState('');
  const [fillLevel, setFillLevel] = useState(50);
  const [temperature, setTemperature] = useState(25);
  const [batteryLevel, setBatteryLevel] = useState(95);
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => {
    if (bins.length > 0 && !selectedBinId) {
      setSelectedBinId(bins[0].id.toString());
      setFillLevel(bins[0].fill_level);
    }
  }, [bins, selectedBinId]);

  useEffect(() => {
    checkSimulatorStatus();
  }, []);

  const checkSimulatorStatus = async () => {
    try {
      const res = await api.getSimulatorStatus();
      setIsAutoSimulating(res.isRunning);
    } catch (err) {
      console.error('Failed checking simulator status:', err);
    }
  };

  const handleBinSelect = (e) => {
    const id = e.target.value;
    setSelectedBinId(id);
    const bin = bins.find(b => b.id.toString() === id);
    if (bin) {
      setFillLevel(bin.fill_level);
    }
  };

  const handleManualSend = async () => {
    if (!selectedBinId) return;
    setLoading(true);
    try {
      const res = await api.manualSimulateBin({
        bin_id: parseInt(selectedBinId),
        fill_level: fillLevel,
        temperature,
        battery_level: batteryLevel
      });

      if (res.success) {
        setLastResult(res);
        if (onBinUpdated) onBinUpdated();
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateCritical = () => {
    setFillLevel(96);
    setTimeout(() => {
      handleManualSend();
    }, 100);
  };

  const toggleAutoSim = async () => {
    try {
      if (isAutoSimulating) {
        await api.stopSimulator();
        setIsAutoSimulating(false);
      } else {
        await api.startSimulator(8); // 8-second interval tick
        setIsAutoSimulating(true);
      }
    } catch (err) {
      console.error('Error toggling auto simulation:', err);
    }
  };

  const selectedBin = bins.find(b => b.id.toString() === selectedBinId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="IoT Sensor Data Simulator" maxWidth="max-w-xl">
      <div className="space-y-6">
        
        {/* Explanation banner */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-start space-x-3">
          <Cpu className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300">
            <p className="font-bold text-slate-100 mb-0.5">Real-Time Sensor Ingestion Pipeline</p>
            <p className="leading-relaxed">
              Adjust telemetry controls below to emulate physical IoT Ultrasonic Fill Sensors. 
              Submitting readings automatically evaluates bin thresholds and broadcasts changes via WebSockets.
            </p>
          </div>
        </div>

        {/* Target Bin Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Select Dustbin Sensor Node
          </label>
          <select
            value={selectedBinId}
            onChange={handleBinSelect}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
          >
            {bins.map(bin => (
              <option key={bin.id} value={bin.id}>
                {bin.bin_code} — {bin.address} ({bin.fill_level}%)
              </option>
            ))}
          </select>
        </div>

        {selectedBin && (
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400">Current Status: </span>
              <span className="font-bold text-slate-200">{selectedBin.waste_type}</span>
            </div>
            <StatusBadge status={selectedBin.status} fillLevel={selectedBin.fill_level} />
          </div>
        )}

        {/* Sensor Sliders */}
        <div className="space-y-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
          
          {/* Fill Level */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-slate-300 font-semibold flex items-center space-x-1.5">
                <Gauge className="w-4 h-4 text-emerald-400" />
                <span>Fill Level Telemetry (%):</span>
              </span>
              <span className="font-mono font-bold text-emerald-400 text-sm">{fillLevel}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={fillLevel}
              onChange={(e) => setFillLevel(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Temperature */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-slate-300 font-semibold flex items-center space-x-1.5">
                <Thermometer className="w-4 h-4 text-amber-400" />
                <span>Internal Temperature (°C):</span>
              </span>
              <span className="font-mono font-bold text-amber-400 text-sm">{temperature}°C</span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              value={temperature}
              onChange={(e) => setTemperature(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Battery */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-slate-300 font-semibold flex items-center space-x-1.5">
                <Battery className="w-4 h-4 text-teal-400" />
                <span>Battery Level (%):</span>
              </span>
              <span className="font-mono font-bold text-teal-400 text-sm">{batteryLevel}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={batteryLevel}
              onChange={(e) => setBatteryLevel(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
            />
          </div>

        </div>

        {/* Quick Action Presets */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFillLevel(20)}
            className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 font-medium"
          >
            Reset (20%)
          </button>
          <button
            onClick={() => setFillLevel(65)}
            className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 font-medium"
          >
            Medium (65%)
          </button>
          <button
            onClick={() => setFillLevel(85)}
            className="text-xs px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/20 font-medium"
          >
            Nearly Full (85%)
          </button>
          <button
            onClick={handleSimulateCritical}
            className="text-xs px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/50 hover:bg-rose-500/30 font-bold animate-pulse"
          >
            🚨 Trigger Critical (96%)
          </button>
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={toggleAutoSim}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition border ${
              isAutoSimulating
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {isAutoSimulating ? (
              <>
                <Square className="w-4 h-4 text-rose-400" />
                <span>Stop Auto Simulation</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-emerald-400" />
                <span>Start Auto Background Fill</span>
              </>
            )}
          </button>

          <button
            onClick={handleManualSend}
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-slate-950 text-xs font-bold hover:from-emerald-500 hover:to-teal-400 transition shadow-lg disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Emit Telemetry Reading</span>
          </button>
        </div>

        {lastResult && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-mono">
            ✅ Telemetry Transmitted! Bin {lastResult.data.bin_code} is now {lastResult.data.status} ({lastResult.data.fill_level}%).
            {lastResult.taskCreated && (
              <p className="text-rose-400 font-bold mt-1">🚨 Auto-generated Task #{lastResult.taskCreated.id} (CRITICAL PRIORITY)!</p>
            )}
          </div>
        )}

      </div>
    </Modal>
  );
}
