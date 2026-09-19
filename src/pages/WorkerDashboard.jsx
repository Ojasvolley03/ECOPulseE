import React, { useState, useEffect } from 'react';
import WasteMap from '../components/map/WasteMap';
import { PriorityBadge, TaskStatusBadge, StatusBadge } from '../components/common/Badge';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { 
  ClipboardList, 
  MapPin, 
  Play, 
  CheckCircle2, 
  Navigation, 
  AlertTriangle, 
  RefreshCw, 
  Truck, 
  Route, 
  Compass, 
  Clock, 
  ArrowRight,
  Flame,
  BatteryCharging,
  Gauge
} from 'lucide-react';

export default function WorkerDashboard() {
  const [tasks, setTasks] = useState([]);
  const [bins, setBins] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [smartRoute, setSmartRoute] = useState(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSimulatingDriving, setIsSimulatingDriving] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState([]);

  const { socket } = useSocket();

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleTaskChange = () => fetchAllData();
    const handleBinChange = (updatedBin) => {
      fetchBinsAndRoute();
      if (updatedBin && updatedBin.fill_level >= 75) {
        setLiveAlerts(prev => {
          const exists = prev.some(a => a.bin_id === updatedBin.id);
          if (exists) {
            return prev.map(a => a.bin_id === updatedBin.id ? { ...a, fill_level: updatedBin.fill_level } : a);
          }
          return [{
            id: `alert-${Date.now()}-${updatedBin.id}`,
            bin_id: updatedBin.id,
            bin_code: updatedBin.bin_code,
            address: updatedBin.address,
            fill_level: updatedBin.fill_level,
            timestamp: new Date().toISOString()
          }, ...prev];
        });
      }
    };

    const handleWorkerAlert = (alertData) => {
      setLiveAlerts(prev => [alertData, ...prev.filter(a => a.bin_code !== alertData.bin_code)]);
      fetchAllData();
    };

    const handleVehicleChange = (updatedVehicle) => {
      setVehicles(prev => prev.map(v => v.id === updatedVehicle.id ? updatedVehicle : v));
    };

    const handleVehicleCreated = (newVehicle) => {
      setVehicles(prev => prev.some(v => v.id === newVehicle.id) ? prev : [...prev, newVehicle]);
    };

    const handleVehicleDeleted = ({ id }) => {
      setVehicles(prev => prev.filter(v => v.id !== id));
      setSelectedVehicle(prev => prev?.id === id ? null : prev);
    };

    socket.on('task_created', handleTaskChange);
    socket.on('task_assigned', handleTaskChange);
    socket.on('task_status_changed', handleTaskChange);
    socket.on('bin_updated', handleBinChange);
    socket.on('bin_created', handleTaskChange);
    socket.on('bin_deleted', handleTaskChange);
    socket.on('worker_alert', handleWorkerAlert);
    socket.on('vehicle_location_updated', handleVehicleChange);
    socket.on('vehicle_updated', handleVehicleChange);
    socket.on('vehicle_created', handleVehicleCreated);
    socket.on('vehicle_deleted', handleVehicleDeleted);

    return () => {
      socket.off('task_created', handleTaskChange);
      socket.off('task_assigned', handleTaskChange);
      socket.off('task_status_changed', handleTaskChange);
      socket.off('bin_updated', handleBinChange);
      socket.off('bin_created', handleTaskChange);
      socket.off('bin_deleted', handleTaskChange);
      socket.off('worker_alert', handleWorkerAlert);
      socket.off('vehicle_location_updated', handleVehicleChange);
      socket.off('vehicle_updated', handleVehicleChange);
      socket.off('vehicle_created', handleVehicleCreated);
      socket.off('vehicle_deleted', handleVehicleDeleted);
    };
  }, [socket]);

  const fetchAllData = async () => {
    try {
      const [tasksRes, binsRes, vehRes] = await Promise.all([
        api.getTasks(),
        api.getBins(),
        api.getVehicles()
      ]);

      if (tasksRes.success) setTasks(tasksRes.data);
      if (binsRes.success) {
        setBins(binsRes.data);
        // Extract initial 75%+ alerts
        const highBins = binsRes.data.filter(b => b.fill_level >= 75);
        setLiveAlerts(highBins.map(b => ({
          id: `alert-${b.id}`,
          bin_id: b.id,
          bin_code: b.bin_code,
          address: b.address,
          fill_level: b.fill_level,
          timestamp: b.last_updated
        })));
      }
      if (vehRes.success && vehRes.data.length > 0) {
        setVehicles(vehRes.data);
        if (!selectedVehicle) {
          setSelectedVehicle(vehRes.data[0]);
        }
      }

      // Calculate initial smart shortest route
      const routeRes = await api.getOptimizedRoute('?minFill=75');
      if (routeRes.success && routeRes.data) {
        setSmartRoute(routeRes.data);
      }
    } catch (err) {
      console.error('Error fetching worker dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBinsAndRoute = async () => {
    try {
      const [binsRes, routeRes] = await Promise.all([
        api.getBins(),
        api.getOptimizedRoute('?minFill=75')
      ]);
      if (binsRes.success) setBins(binsRes.data);
      if (routeRes.success) setSmartRoute(routeRes.data);
    } catch (err) {
      console.error('Error updating bins and route:', err);
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      const res = await api.updateTaskStatus(taskId, newStatus);
      if (res.success) {
        fetchAllData();
      }
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  // Simulate driving vehicle to next bin in smart route & empty it
  const handleSimulateNextStop = async () => {
    if (!smartRoute || !smartRoute.stops || smartRoute.stops.length === 0) return;
    
    setIsSimulatingDriving(true);
    const targetStop = smartRoute.stops[activeStepIndex] || smartRoute.stops[0];

    try {
      // 1. Move vehicle coordinates to target stop
      if (selectedVehicle) {
        await api.updateVehicleLocation(selectedVehicle.id, {
          latitude: targetStop.latitude,
          longitude: targetStop.longitude,
          speed: 36,
          status: 'ACTIVE_COLLECTING',
          target_bin: targetStop.bin_code
        });
      }

      // 2. Empty the bin (reset fill_level to 0%)
      await api.updateBin(targetStop.bin_id, { fill_level: 0 });

      // 3. Mark task completed if associated
      const associatedTask = tasks.find(t => t.bin_id === targetStop.bin_id && t.status !== 'COMPLETED');
      if (associatedTask) {
        await api.updateTaskStatus(associatedTask.id, 'COMPLETED');
      }

      // 4. Advance step index
      setActiveStepIndex((prev) => (prev + 1) % smartRoute.stops.length);
      await fetchAllData();
    } catch (err) {
      console.error('Error during route driving simulation:', err);
    } finally {
      setIsSimulatingDriving(false);
    }
  };

  const activeTasks = tasks.filter(t => t.status !== 'COMPLETED');
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
  const critical75Bins = bins.filter(b => b.fill_level >= 75);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Driver Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-emerald-950 border border-purple-500/20 p-6 rounded-3xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-extrabold text-[10px] tracking-wider uppercase border border-purple-500/30">
              Live Dispatch & GPS Navigator
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
              Guest Access Mode (No Login Required)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight mt-1 flex items-center space-x-2">
            <Truck className="w-7 h-7 text-sky-400" />
            <span>Worker & Fleet Route Command</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Real-time 75%+ overflow notifications, live truck GPS tracking, and AI shortest route calculation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAllData}
            className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Refresh Route Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* FEATURE 1: 75%+ Capacity Real-Time Alert Broadcast Banner */}
      {critical75Bins.length > 0 && (
        <div className="bg-gradient-to-r from-rose-950/80 to-slate-900 border border-rose-500/40 rounded-2xl p-5 shadow-xl space-y-3 animate-fade-in">
          <div className="flex items-center justify-between border-b border-rose-500/20 pb-2">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
              <h3 className="font-extrabold text-sm text-rose-200 tracking-wide uppercase">
                🚨 Automatic 75%+ Capacity Notification Alert ({critical75Bins.length} Bins Triggered)
              </h3>
            </div>
            <span className="text-[10px] text-rose-300 font-mono bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/30">
              Auto Dispatch Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {critical75Bins.map((b) => (
              <div
                key={b.id}
                className="bg-slate-950/90 border border-rose-500/30 rounded-xl p-3.5 space-y-2 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-sm text-emerald-400">{b.bin_code}</span>
                  <span className="text-xs px-2 py-0.5 rounded font-black font-mono bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    {b.fill_level}% FULL
                  </span>
                </div>
                <p className="text-xs text-slate-300 flex items-start space-x-1 line-clamp-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <span>{b.address}</span>
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono">
                  <span>Type: {b.waste_type}</span>
                  <span className="text-rose-400 font-bold">Priority: CRITICAL</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FEATURE 2 & 3: Live Map with Vehicle Tracking & Smart Shortest Route */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Interactive Map with Vehicles & Route */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>Live Fleet Tracking & Shortest Route Navigation</span>
            </h3>
            {smartRoute && (
              <span className="text-xs text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                {smartRoute.total_distance_km} km • {smartRoute.total_eta_mins} mins ETA
              </span>
            )}
          </div>

          <WasteMap
            bins={bins}
            vehicles={vehicles}
            routePolyline={smartRoute?.route_polyline}
            routeStops={smartRoute?.stops || []}
            height="h-[460px]"
            onSelectVehicle={(veh) => setSelectedVehicle(veh)}
          />
        </div>

        {/* Right 1 Col: Smart Route Navigation Control Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="border-b border-slate-800 pb-3">
              <h4 className="font-extrabold text-sm text-slate-100 flex items-center space-x-2">
                <Route className="w-4 h-4 text-emerald-400" />
                <span>Smart Shortest Route System</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Calculated shortest sequence via GPS nearest-neighbor optimization.
              </p>
            </div>

            {/* Selected Vehicle Status */}
            {selectedVehicle && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Truck className="w-4 h-4 text-sky-400" />
                    <span className="font-bold text-slate-200">{selectedVehicle.name}</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 font-mono">
                    {selectedVehicle.plate}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono">
                  <span>Driver: <strong className="text-slate-200">{selectedVehicle.driver}</strong></span>
                  <span>Speed: <strong className="text-sky-400">{selectedVehicle.speed} km/h</strong></span>
                  <span>Load: <strong className="text-slate-200">{selectedVehicle.capacity_used}%</strong></span>
                  <span>Battery: <strong className="text-emerald-400">{selectedVehicle.fuel_battery}%</strong></span>
                </div>
              </div>
            )}

            {/* Turn by Turn Waypoints List */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Collection Waypoint Stops ({smartRoute?.stops?.length || 0})
              </p>
              
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {smartRoute?.stops?.map((stop, idx) => {
                  const isActive = idx === activeStepIndex;
                  return (
                    <div
                      key={stop.step}
                      className={`p-2.5 rounded-xl border text-xs transition ${
                        isActive
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`w-5 h-5 rounded-full text-xs font-extrabold flex items-center justify-center ${
                            isActive ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {stop.step}
                          </span>
                          <span className="font-mono font-bold">{stop.bin_code}</span>
                        </div>
                        <span className={`font-mono font-extrabold ${stop.fill_level >= 75 ? 'text-rose-400' : 'text-slate-400'}`}>
                          {stop.fill_level}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-1">{stop.address}</p>
                      <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                        <span>Leg: {stop.leg_distance_km} km</span>
                        <span>ETA: {stop.est_driving_time_mins} mins</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Interactive Simulation / Driving Action */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <button
              onClick={handleSimulateNextStop}
              disabled={isSimulatingDriving || !smartRoute?.stops?.length}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Play className={`w-4 h-4 ${isSimulatingDriving ? 'animate-spin' : ''}`} />
              <span>
                {isSimulatingDriving ? 'Simulating Driving & Pickup...' : 'Simulate Drive to Next Stop (Empty Bin)'}
              </span>
            </button>
          </div>

        </div>

      </div>

      {/* Active Tasks Queue */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
          <ClipboardList className="w-5 h-5 text-purple-400" />
          <span>Assigned Collection Tasks ({activeTasks.length})</span>
        </h3>

        {activeTasks.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center text-xs text-slate-500 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto" />
            <p>All assigned collection tasks completed! Fleet is ready.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeTasks.map((t) => (
              <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 relative overflow-hidden">
                
                {t.priority === 'CRITICAL' && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500 animate-pulse" />
                )}

                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-extrabold text-base text-emerald-400">{t.bin_code}</span>
                      <PriorityBadge priority={t.priority} />
                    </div>
                    <p className="text-xs text-slate-300 mt-1 flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{t.address}</span>
                    </p>
                  </div>
                  <StatusBadge status={t.bin_status} fillLevel={t.fill_level} />
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs flex justify-between text-slate-400 font-mono">
                  <span>Waste Category: <strong className="text-slate-200">{t.waste_type}</strong></span>
                  <span>Task Status: <strong className="text-purple-400">{t.status}</strong></span>
                </div>

                {/* Workflow Buttons */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-end space-x-2">
                  {t.status === 'ASSIGNED' && (
                    <button
                      onClick={() => handleUpdateStatus(t.id, 'IN_PROGRESS')}
                      className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-slate-950 font-bold text-xs transition shadow-md"
                    >
                      <Play className="w-4 h-4" />
                      <span>Start Collection</span>
                    </button>
                  )}

                  {t.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleUpdateStatus(t.id, 'COMPLETED')}
                      className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-extrabold text-xs transition shadow-lg animate-pulse"
                    >
                      <CheckCircle2 className="w-4.5 h-4.5" />
                      <span>Mark Collection Completed (Empty Bin)</span>
                    </button>
                  )}

                  {t.status === 'PENDING' && (
                    <button
                      onClick={() => handleUpdateStatus(t.id, 'ASSIGNED')}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition border border-slate-700"
                    >
                      Accept Task
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Collection History */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>Completed Collection History ({completedTasks.length})</span>
        </h3>

        {completedTasks.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No completed tasks recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-800/60 max-h-60 overflow-y-auto">
            {completedTasks.map((t) => (
              <div key={t.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-bold text-slate-200 mr-2">{t.bin_code}</span>
                  <span className="text-slate-400">{t.address}</span>
                </div>
                <div className="text-right">
                  <span className="text-emerald-400 font-bold">Emptied to 0%</span>
                  <span className="block text-[10px] text-slate-500">
                    {t.completion_time ? new Date(t.completion_time).toLocaleTimeString() : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
