import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { StatusBadge } from '../common/Badge';
import { MapPin, Navigation, Truck, User, BatteryCharging, Gauge, CheckCircle2 } from 'lucide-react';

// Custom SVG Icons generator for Leaflet markers based on bin status
const createCustomBinIcon = (status, fillLevel) => {
  let color = '#22c55e'; // Normal Green
  let border = '#166534';

  if (status === 'MEDIUM') {
    color = '#f59e0b'; // Medium Amber
    border = '#b45309';
  } else if (status === 'NEARLY_FULL' || fillLevel >= 75) {
    color = '#f97316'; // Nearly full Orange (75%+)
    border = '#c2410c';
  }
  if (status === 'CRITICAL' || fillLevel >= 90) {
    color = '#f43f5e'; // Critical Red (90%+)
    border = '#9f1239';
  }

  const svgHtml = `
    <div style="
      position: relative;
      width: 38px;
      height: 38px;
      background-color: #0f172a;
      border: 3px solid ${color};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 15px ${color}80;
      cursor: pointer;
      transition: transform 0.2s;
    ">
      <span style="
        font-family: monospace;
        font-weight: 800;
        font-size: 11px;
        color: ${color};
      ">${fillLevel}%</span>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-bin-marker',
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20],
  });
};

// Custom Icon for Live Collection Vehicles
const createVehicleIcon = (vehicle) => {
  const isMoving = vehicle.speed > 0;
  const svgHtml = `
    <div style="
      position: relative;
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #0284c7, #06b6d4);
      border: 3px solid #38bdf8;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 20px rgba(56, 189, 248, 0.7);
      cursor: pointer;
      transform: rotate(${vehicle.heading || 0}deg);
      transition: all 0.5s ease-out;
    ">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="1" y="3" width="15" height="13"></rect>
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
        <circle cx="5.5" cy="18.5" r="2.5"></circle>
        <circle cx="18.5" cy="18.5" r="2.5"></circle>
      </svg>
      ${isMoving ? '<span style="position: absolute; top:-4px; right:-4px; width: 10px; height: 10px; background-color: #22c55e; border-radius: 50%; box-shadow: 0 0 6px #22c55e;"></span>' : ''}
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-vehicle-marker',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
};

// Custom Icon for Route Step Waypoints
const createStepIcon = (stepNumber) => {
  const svgHtml = `
    <div style="
      position: relative;
      width: 28px;
      height: 28px;
      background: #10b981;
      border: 2px solid #ffffff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 13px;
      color: #0f172a;
      box-shadow: 0 0 12px rgba(16, 185, 129, 0.8);
    ">
      ${stepNumber}
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-step-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

// Component to dynamically adjust map viewport
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 13, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

export default function WasteMap({
  bins = [],
  vehicles = [],
  routePolyline = null,
  routeStops = [],
  onSelectBin,
  onSelectVehicle,
  height = 'h-[500px]',
  selectedLocation = null
}) {
  const defaultCenter = selectedLocation || (bins.length > 0 ? [bins[0].latitude, bins[0].longitude] : [20, 0]);

  return (
    <div className={`w-full ${height} rounded-2xl overflow-hidden border border-slate-800 shadow-xl relative z-10`}>
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {selectedLocation && <MapController center={selectedLocation} zoom={15} />}

        {/* Smart Navigation Route Polyline */}
        {routePolyline && routePolyline.length > 1 && (
          <Polyline
            positions={routePolyline}
            color="#10b981"
            weight={5}
            opacity={0.85}
            dashArray="10, 8"
          />
        )}

        {/* Step Waypoint Markers */}
        {routeStops.map((stop) => (
          <Marker
            key={`step-${stop.step}-${stop.bin_id}`}
            position={[stop.latitude, stop.longitude]}
            icon={createStepIcon(stop.step)}
          >
            <Popup>
              <div className="p-1 min-w-[200px]">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-extrabold text-xs flex items-center justify-center">
                    {stop.step}
                  </span>
                  <span className="font-bold text-xs text-slate-200">Stop #{stop.step}: {stop.bin_code}</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-1">{stop.address}</p>
                <div className="flex justify-between text-xs text-slate-300 bg-slate-950 p-2 rounded border border-slate-800">
                  <span>Fill: <strong className="text-rose-400">{stop.fill_level}%</strong></span>
                  <span>Dist: <strong>{stop.leg_distance_km} km</strong></span>
                  <span>ETA: <strong>{stop.est_driving_time_mins}m</strong></span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Waste Dustbins */}
        {bins.map((bin) => (
          <Marker
            key={`bin-${bin.id}`}
            position={[bin.latitude, bin.longitude]}
            icon={createCustomBinIcon(bin.status, bin.fill_level)}
          >
            <Popup>
              <div className="p-1 min-w-[230px]">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                  <span className="font-extrabold text-sm font-mono text-emerald-400">{bin.bin_code}</span>
                  <StatusBadge status={bin.status} fillLevel={bin.fill_level} />
                </div>

                <p className="text-xs text-slate-300 flex items-start space-x-1.5 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{bin.address}</span>
                </p>

                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80 mb-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Waste Category:</span>
                    <span className="font-semibold text-slate-200">{bin.waste_type}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        bin.fill_level >= 90 ? 'bg-rose-500' :
                        bin.fill_level >= 75 ? 'bg-orange-500' :
                        bin.fill_level >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${bin.fill_level}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                    <span>Capacity Fill:</span>
                    <span className="font-bold text-slate-200">{bin.fill_level}%</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {onSelectBin && (
                    <button
                      onClick={() => onSelectBin(bin)}
                      className="flex-1 text-center py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition"
                    >
                      Select Bin
                    </button>
                  )}
                  <a
                    href={`/bin/${bin.bin_code}`}
                    className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold text-center transition"
                  >
                    Public QR
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Live Collection Vehicles */}
        {vehicles.map((v) => (
          <Marker
            key={`veh-${v.id}`}
            position={[v.latitude, v.longitude]}
            icon={createVehicleIcon(v)}
          >
            <Popup>
              <div className="p-1 min-w-[240px]">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                  <div className="flex items-center space-x-1.5">
                    <Truck className="w-4 h-4 text-sky-400" />
                    <span className="font-bold text-xs text-sky-300">{v.name}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 font-bold">
                    {v.plate}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-300 mb-3">
                  <p className="flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Driver: <strong>{v.driver}</strong></span>
                  </p>
                  <p className="flex items-center space-x-1.5">
                    <Gauge className="w-3.5 h-3.5 text-slate-400" />
                    <span>Speed: <strong>{v.speed} km/h</strong></span>
                  </p>
                  <p className="flex items-center space-x-1.5">
                    <BatteryCharging className="w-3.5 h-3.5 text-slate-400" />
                    <span>Battery / Fuel: <strong>{v.fuel_battery}%</strong></span>
                  </p>
                  {v.target_bin && (
                    <p className="flex items-center space-x-1.5 text-amber-300">
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Heading to: <strong>{v.target_bin}</strong></span>
                    </p>
                  )}
                </div>

                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-xs mb-2">
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Truck Load Capacity:</span>
                    <span className="font-bold text-slate-200">{v.capacity_used}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${v.capacity_used > 80 ? 'bg-rose-500' : 'bg-sky-500'}`}
                      style={{ width: `${v.capacity_used}%` }}
                    />
                  </div>
                </div>

                {onSelectVehicle && (
                  <button
                    onClick={() => onSelectVehicle(v)}
                    className="w-full text-center py-1.5 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-slate-950 text-xs font-bold transition"
                  >
                    Track This Vehicle
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 right-4 z-[400] bg-slate-900/90 backdrop-blur border border-slate-800 p-3 rounded-xl shadow-xl text-xs space-y-1.5">
        <p className="font-bold text-slate-200 mb-1">Live Map Legend</p>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-slate-300">Normal (0-50%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-slate-300">Medium (51-74%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-slate-300 font-semibold text-orange-400">75%+ Alert Trigger</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
          <span className="text-slate-300 font-bold text-rose-400">Critical (90-100%)</span>
        </div>
        <div className="flex items-center space-x-2 pt-1 border-t border-slate-800">
          <span className="w-3.5 h-3.5 rounded bg-sky-500 flex items-center justify-center text-[9px] text-slate-950 font-bold">🚛</span>
          <span className="text-sky-300 font-semibold">Live Collection Vehicle</span>
        </div>
        {routePolyline && (
          <div className="flex items-center space-x-2">
            <span className="w-4 h-1 bg-emerald-400 rounded" />
            <span className="text-emerald-400 font-semibold">Smart Shortest Route</span>
          </div>
        )}
      </div>
    </div>
  );
}
