import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { StatusBadge } from '../common/Badge';
import { MapPin, Navigation, Truck, User } from 'lucide-react';

// Custom SVG Icons generator for Leaflet markers based on bin status
const createCustomBinIcon = (status, fillLevel) => {
  let color = '#22c55e'; // Normal Green
  let border = '#166534';

  if (status === 'MEDIUM') {
    color = '#f59e0b'; // Medium Amber
    border = '#b45309';
  } else if (status === 'NEARLY_FULL') {
    color = '#f97316'; // Nearly full Orange
    border = '#c2410c';
  } else if (status === 'CRITICAL') {
    color = '#f43f5e'; // Critical Red
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

export default function WasteMap({ bins = [], onSelectBin, height = 'h-[500px]' }) {
  // Default Map center: San Francisco downtown coordinates (or center of first bin)
  const defaultCenter = bins.length > 0 ? [bins[0].latitude, bins[0].longitude] : [37.7749, -122.4194];

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

        {bins.map((bin) => (
          <Marker
            key={bin.id}
            position={[bin.latitude, bin.longitude]}
            icon={createCustomBinIcon(bin.status, bin.fill_level)}
          >
            <Popup>
              <div className="p-1 min-w-[220px]">
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
                        bin.status === 'CRITICAL' ? 'bg-rose-500' :
                        bin.status === 'NEARLY_FULL' ? 'bg-orange-500' :
                        bin.status === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${bin.fill_level}%` }}
                    />
                  </div>
                </div>

                {onSelectBin && (
                  <button
                    onClick={() => onSelectBin(bin)}
                    className="w-full text-center py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition"
                  >
                    Select Bin
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 z-[400] bg-slate-900/90 backdrop-blur border border-slate-800 p-3 rounded-xl shadow-xl text-xs space-y-1.5">
        <p className="font-bold text-slate-200 mb-1">Bin Status Legend</p>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-slate-300">Normal (0-50%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-slate-300">Medium (51-75%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-slate-300">Nearly Full (76-90%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
          <span className="text-slate-300 font-bold text-rose-400">Critical (91-100%)</span>
        </div>
      </div>
    </div>
  );
}
