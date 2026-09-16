import React, { useState, useEffect } from 'react';
import PredictionWidget from '../components/ai/PredictionWidget';
import AIClassifierWidget from '../components/ai/AIClassifierWidget';
import { api } from '../services/api';
import { BarChart3, TrendingUp, Cpu, Sparkles, Activity, ShieldCheck } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';

export default function AnalyticsPage() {
  const [bins, setBins] = useState([]);
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const [binsRes, readingsRes] = await Promise.all([
        api.getBins(),
        api.getSensorReadings()
      ]);

      if (binsRes.success) setBins(binsRes.data);
      if (readingsRes.success) setReadings(readingsRes.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Format historical sensor readings for trend chart
  const trendData = readings.slice(0, 20).reverse().map((r, index) => ({
    time: new Date(r.reading_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    fill: r.fill_level,
    temp: r.temperature,
    binCode: r.bin_code
  }));

  const categoryCounts = bins.reduce((acc, bin) => {
    acc[bin.waste_type] = (acc[bin.waste_type] || 0) + 1;
    return acc;
  }, {});

  const categoryBarData = Object.keys(categoryCounts).map(type => ({
    type,
    bins: categoryCounts[type]
  }));

  return (
    <div className="space-y-6 pb-12">
      
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center space-x-2">
          <BarChart3 className="w-6 h-6 text-emerald-400" />
          <span>Waste Intelligence & Predictive Analytics</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Historical sensor trends, fill rate velocity, and computer vision classification metrics.
        </p>
      </div>

      {/* Sensor Trend Line Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          <span>Telemetry Fill Level Telemetry Trend (Recent Ingests)</span>
        </h3>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff' }} />
              <Area type="monotone" dataKey="fill" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#fillGrad)" name="Fill Level (%)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Overflow Prediction */}
        <PredictionWidget />

        {/* AI Waste Classifier Standalone Widget */}
        <AIClassifierWidget />
      </div>

    </div>
  );
}
