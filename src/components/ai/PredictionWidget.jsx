import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { TrendingUp, AlertTriangle, Clock, ShieldCheck, RefreshCw } from 'lucide-react';

export default function PredictionWidget() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const res = await api.predictCriticalBins();
      if (res.success) {
        setPredictions(res.data);
      }
    } catch (err) {
      console.error('Error fetching predictions:', err);
    } finally {
      setLoading(false);
    }
  };

  const highRiskItems = predictions.filter(p => p.riskLevel === 'CRITICAL' || p.riskLevel === 'HIGH_RISK');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100">AI Overflow Risk Prediction</h4>
            <p className="text-xs text-slate-400">Forecasting bin fill trends over the next 4 hours</p>
          </div>
        </div>
        <button
          onClick={fetchPredictions}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-slate-500 py-4 text-center">Calculating trend velocity...</p>
      ) : highRiskItems.length === 0 ? (
        <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center space-x-3 text-xs text-emerald-300">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>All waste bins operating within safe thresholds. No overflow risk predicted within 4 hours.</span>
        </div>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {highRiskItems.map((item) => (
            <div
              key={item.binId}
              className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                item.riskLevel === 'CRITICAL'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold">{item.binCode}</span>
                  <span className="text-slate-400">— {item.address}</span>
                </div>
                <div className="flex items-center space-x-3 text-[11px] opacity-80">
                  <span>Current: {item.currentFill}%</span>
                  <span>Rate: +{item.estimatedFillRatePerHour}%/hr</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="flex items-center space-x-1 font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Est. Critical in ~{item.estimatedHoursToCritical}h</span>
                </div>
                <span className="text-[10px] uppercase tracking-wider font-semibold opacity-90 block mt-0.5">
                  {item.recommendedAction}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
