import { query } from '../config/db.js';
import { getSocketIO } from '../services/socketService.js';

// In-memory / Real-time Collection Vehicle Fleet State
let vehicles = [
  {
    id: 'TRK-101',
    name: 'EcoPulse Rapid Truck #1',
    plate: 'CA-987-ECO',
    driver: 'John Driver',
    phone: '+1 555-0101',
    latitude: 37.7850,
    longitude: -122.4080,
    speed: 32, // km/h
    heading: 45, // degrees
    capacity_used: 68, // %
    status: 'ACTIVE_COLLECTING',
    target_bin: 'BIN-103',
    fuel_battery: 84, // %
    last_updated: new Date().toISOString()
  },
  {
    id: 'TRK-102',
    name: 'EcoPulse City Hauler #2',
    plate: 'CA-442-GRN',
    driver: 'Sarah Miller',
    phone: '+1 555-0102',
    latitude: 37.7720,
    longitude: -122.4250,
    speed: 26,
    heading: 120,
    capacity_used: 42,
    status: 'EN_ROUTE',
    target_bin: 'BIN-102',
    fuel_battery: 91,
    last_updated: new Date().toISOString()
  },
  {
    id: 'TRK-103',
    name: 'EcoPulse SOMA Navigator #3',
    plate: 'CA-103-WST',
    driver: 'David Vance',
    phone: '+1 555-0103',
    latitude: 37.7650,
    longitude: -122.4140,
    speed: 38,
    heading: 310,
    capacity_used: 82,
    status: 'RETURNING_TO_DEPOT',
    target_bin: null,
    fuel_battery: 67,
    last_updated: new Date().toISOString()
  }
];

// Helper: Haversine distance in kilometers between two coordinates
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

export async function getVehicles(req, res) {
  try {
    res.json({
      success: true,
      count: vehicles.length,
      data: vehicles
    });
  } catch (err) {
    console.error('Error fetching vehicles:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve vehicle fleet.' });
  }
}

export async function updateVehicleLocation(req, res) {
  try {
    const { id } = req.params;
    const { latitude, longitude, speed, heading, capacity_used, status, target_bin } = req.body;

    const vIndex = vehicles.findIndex(v => v.id === id);
    if (vIndex === -1) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    vehicles[vIndex] = {
      ...vehicles[vIndex],
      latitude: latitude !== undefined ? parseFloat(latitude) : vehicles[vIndex].latitude,
      longitude: longitude !== undefined ? parseFloat(longitude) : vehicles[vIndex].longitude,
      speed: speed !== undefined ? parseInt(speed) : vehicles[vIndex].speed,
      heading: heading !== undefined ? parseInt(heading) : vehicles[vIndex].heading,
      capacity_used: capacity_used !== undefined ? parseInt(capacity_used) : vehicles[vIndex].capacity_used,
      status: status || vehicles[vIndex].status,
      target_bin: target_bin !== undefined ? target_bin : vehicles[vIndex].target_bin,
      last_updated: new Date().toISOString()
    };

    const io = getSocketIO();
    if (io) {
      io.emit('vehicle_location_updated', vehicles[vIndex]);
    }

    res.json({
      success: true,
      message: 'Vehicle telemetry updated.',
      data: vehicles[vIndex]
    });
  } catch (err) {
    console.error('Error updating vehicle telemetry:', err);
    res.status(500).json({ success: false, message: 'Failed to update vehicle location.' });
  }
}

/**
 * Smart Shortest Route System (Nearest-Neighbor TSP Algorithm)
 * Calculates the shortest sequence of critical & high fill bins (>=75%) for driver navigation
 */
export async function getOptimizedRoute(req, res) {
  try {
    const startLat = req.query.startLat ? parseFloat(req.query.startLat) : (vehicles[0]?.latitude || 37.7749);
    const startLng = req.query.startLng ? parseFloat(req.query.startLng) : (vehicles[0]?.longitude || -122.4194);
    const minFillLevel = req.query.minFill ? parseInt(req.query.minFill) : 75;

    // Fetch bins needing collection (>= 75% fill or critical)
    const bins = await query(`
      SELECT wb.*, 
        (SELECT ct.id FROM collection_tasks ct WHERE ct.bin_id = wb.id AND ct.status != 'COMPLETED' LIMIT 1) as active_task_id
      FROM waste_bins wb
      WHERE wb.fill_level >= ? OR wb.status = 'CRITICAL'
      ORDER BY wb.fill_level DESC
    `, [minFillLevel]);

    if (!bins || bins.length === 0) {
      // If no bins >= 75%, select top 3 highest fill bins
      const topBins = await query(`
        SELECT * FROM waste_bins ORDER BY fill_level DESC LIMIT 3
      `);
      bins.push(...topBins);
    }

    // Nearest-Neighbor Route Optimization algorithm
    let currentPoint = { latitude: startLat, longitude: startLng, name: 'Current Vehicle / Depot Location' };
    const unvisited = [...bins];
    const orderedWaypoints = [];
    let totalDistanceKm = 0;

    while (unvisited.length > 0) {
      let nearestIdx = 0;
      let minDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const d = calculateDistanceKm(
          currentPoint.latitude,
          currentPoint.longitude,
          unvisited[i].latitude,
          unvisited[i].longitude
        );

        // Score based on distance & fill level urgency (prioritize critical bins)
        const priorityWeight = unvisited[i].fill_level >= 90 ? 0.7 : 1.0;
        const weightedScore = d * priorityWeight;

        if (weightedScore < minDistance) {
          minDistance = weightedScore;
          nearestIdx = i;
        }
      }

      const nextBin = unvisited.splice(nearestIdx, 1)[0];
      const actualDist = calculateDistanceKm(
        currentPoint.latitude,
        currentPoint.longitude,
        nextBin.latitude,
        nextBin.longitude
      );

      totalDistanceKm += actualDist;
      orderedWaypoints.push({
        step: orderedWaypoints.length + 1,
        bin_id: nextBin.id,
        bin_code: nextBin.bin_code,
        address: nextBin.address,
        latitude: nextBin.latitude,
        longitude: nextBin.longitude,
        fill_level: nextBin.fill_level,
        waste_type: nextBin.waste_type,
        status: nextBin.status,
        leg_distance_km: actualDist,
        est_driving_time_mins: Math.max(2, Math.round((actualDist / 30) * 60))
      });

      currentPoint = nextBin;
    }

    // Central Depot return point
    const depotDistance = calculateDistanceKm(currentPoint.latitude, currentPoint.longitude, startLat, startLng);
    totalDistanceKm += depotDistance;

    // Total ETA in minutes (driving time @ 30km/h average city speed + 5 minutes per collection stop)
    const totalEstTimeMins = Math.round((totalDistanceKm / 30) * 60 + (orderedWaypoints.length * 5));

    // Polyline coordinates array for Leaflet map drawing
    const routeCoordinates = [
      [startLat, startLng],
      ...orderedWaypoints.map(w => [w.latitude, w.longitude]),
      [startLat, startLng]
    ];

    res.json({
      success: true,
      data: {
        origin: { latitude: startLat, longitude: startLng, name: 'Vehicle Start GPS' },
        stops_count: orderedWaypoints.length,
        total_distance_km: parseFloat(totalDistanceKm.toFixed(2)),
        total_eta_mins: totalEstTimeMins,
        stops: orderedWaypoints,
        route_polyline: routeCoordinates
      }
    });
  } catch (err) {
    console.error('Error calculating smart route:', err);
    res.status(500).json({ success: false, message: 'Failed to calculate shortest route.' });
  }
}
