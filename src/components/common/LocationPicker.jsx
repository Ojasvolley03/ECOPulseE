import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { MapPin, Search, X } from 'lucide-react';

const DEFAULT_MAP_CENTER = [20, 0];

function PickerMap({ position, onMapLocationSelect }) {
  const map = useMap();

  useMapEvents({
    click: (event) => onMapLocationSelect(event.latlng.lat, event.latlng.lng)
  });

  useEffect(() => {
    if (position) map.setView(position, Math.max(map.getZoom(), 13), { animate: true });
  }, [map, position]);

  return position ? <Marker position={position} /> : null;
}

export default function LocationPicker({ onLocationSelect, initialLat, initialLng, initialAddress }) {
  const [address, setAddress] = useState(initialAddress || '');
  const [latitude, setLatitude] = useState(initialLat ?? '');
  const [longitude, setLongitude] = useState(initialLng ?? '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);

  const selectedPosition = Number.isFinite(latitude) && Number.isFinite(longitude)
    ? [latitude, longitude]
    : null;

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey || window.google?.maps?.places) return;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  const handleMapLocationSelect = async (lat, lng) => {
    const fallbackAddress = `Pinned location (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
    setLatitude(lat);
    setLongitude(lng);
    setAddress(fallbackAddress);
    onLocationSelect(lat, lng, fallbackAddress);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      const resolvedAddress = data.display_name || fallbackAddress;
      setAddress(resolvedAddress);
      onLocationSelect(lat, lng, resolvedAddress);
    } catch (error) {
      console.error('Error resolving pinned location:', error);
    }
  };

  // Handle address search using Google Places API (if available) or fallback
  const handleAddressSearch = async (searchAddress) => {
    setAddress(searchAddress);
    if (!searchAddress.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    try {
      // Try Google Places API if available
      if (window.google && window.google.maps && window.google.maps.places) {
        const service = new window.google.maps.places.AutocompleteService();
        service.getPlacePredictions(
          { input: searchAddress },
          (predictions, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
              setSuggestions(predictions);
              setShowSuggestions(true);
            } else {
              setSuggestions([]);
              setShowSuggestions(false);
            }
            setLoading(false);
          }
        );
      } else {
        // Fallback: Use Nominatim (OpenStreetMap) for geocoding
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=5`
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
          const osmSuggestions = data.map(place => ({
            description: place.display_name,
            place_id: place.place_id,
            structured_formatting: {
              main_text: place.display_name.split(',')[0],
              secondary_text: place.display_name.split(',').slice(1).join(',').trim()
            },
            lat: parseFloat(place.lat),
            lon: parseFloat(place.lon)
          }));
          setSuggestions(osmSuggestions);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
        setLoading(false);
      }
    } catch (error) {
      console.error('Error searching address:', error);
      setSuggestions([]);
      setShowSuggestions(false);
      setLoading(false);
    }
  };

  // Handle selection of a location suggestion
  const handleSelectSuggestion = async (suggestion) => {
    setShowSuggestions(false);
    setAddress(suggestion.description);
    
    try {
      let lat, lng;
      
      // If suggestion already has coordinates (OSM fallback)
      if (suggestion.lat && suggestion.lon) {
        lat = suggestion.lat;
        lng = suggestion.lon;
      } else if (window.google && window.google.maps) {
        // Use Google Places API to get details
        const placesService = new window.google.maps.places.PlacesService(document.createElement('div'));
        placesService.getDetails(
          { placeId: suggestion.place_id },
          (place, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && place.geometry) {
              const newLat = place.geometry.location.lat();
              const newLng = place.geometry.location.lng();
              setLatitude(newLat);
              setLongitude(newLng);
              onLocationSelect(newLat, newLng, place.formatted_address || suggestion.description);
            }
          }
        );
        return;
      }
      
      if (lat && lng) {
        setLatitude(lat);
        setLongitude(lng);
        onLocationSelect(lat, lng, suggestion.description);
      }
    } catch (error) {
      console.error('Error getting location details:', error);
    }
  };

  // Handle manual coordinate input
  const handleManualLocation = () => {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    onLocationSelect(latitude, longitude, address);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="space-y-3">
      <div className="relative" ref={searchRef}>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
          Search Location
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={address}
            onChange={(e) => handleAddressSearch(e.target.value)}
            placeholder="Search for a location..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
          />
          {address && (
            <button
              type="button"
              onClick={() => {
                setAddress('');
                setSuggestions([]);
                setShowSuggestions(false);
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-xl max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                className="w-full text-left px-4 py-3 hover:bg-slate-800 transition border-b border-slate-800 last:border-b-0"
              >
                <div className="text-sm text-slate-200 font-medium">
                  {suggestion.structured_formatting?.main_text || suggestion.description.split(',')[0]}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {suggestion.structured_formatting?.secondary_text || suggestion.description}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
            Click Map To Place
          </label>
          <span className="text-[10px] text-slate-500">Select a precise point</span>
        </div>
        <div className="h-52 overflow-hidden rounded-xl border border-slate-800">
          <MapContainer
            center={selectedPosition || DEFAULT_MAP_CENTER}
            zoom={selectedPosition ? 13 : 2}
            scrollWheelZoom={true}
            className="w-full h-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <PickerMap
              position={selectedPosition}
              onMapLocationSelect={handleMapLocationSelect}
            />
          </MapContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            Latitude
          </label>
          <input
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value === '' ? '' : parseFloat(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            Longitude
          </label>
          <input
            type="number"
            step="any"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value === '' ? '' : parseFloat(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleManualLocation}
        disabled={!Number.isFinite(latitude) || !Number.isFinite(longitude)}
        className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
      >
        <MapPin className="w-4 h-4" />
        <span>Use These Coordinates</span>
      </button>
    </div>
  );
}