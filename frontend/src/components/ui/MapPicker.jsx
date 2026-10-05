import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin } from 'lucide-react';

// Fix Leaflet default marker icon issue in Vite/Webpack
const customMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapClickHandler({ onLocationSelect, readOnly }) {
  useMapEvents({
    click(e) {
      if (!readOnly && onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

export default function MapPicker({
  center = [-6.9175, 107.6191], // Default coordinates
  marker = null, // { lat, lng }
  onLocationSelect,
  readOnly = false,
  height = 'h-72',
  className = '',
}) {
  const mapCenter = marker && marker.lat && marker.lng ? [marker.lat, marker.lng] : center;

  const handleDragEnd = (e) => {
    if (readOnly || !onLocationSelect) return;
    const { lat, lng } = e.target.getLatLng();
    onLocationSelect(lat, lng);
  };

  return (
    <div className={`w-full ${height} rounded-lg border border-border overflow-hidden shadow-xs relative ${className}`}>
      <MapContainer
        center={mapCenter}
        zoom={14}
        scrollWheelZoom={!readOnly}
        className="w-full h-full z-0"
      >
        <ChangeView center={mapCenter} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onLocationSelect={onLocationSelect} readOnly={readOnly} />

        {marker && marker.lat && marker.lng && (
          <Marker
            position={[marker.lat, marker.lng]}
            icon={customMarkerIcon}
            draggable={!readOnly}
            eventHandlers={{ dragend: handleDragEnd }}
          />
        )}
      </MapContainer>

      {!readOnly && (
        <div className="absolute top-2 right-2 z-10 bg-surface/90 backdrop-blur-xs px-2.5 py-1 rounded-md border border-border text-xs font-semibold text-ink shadow-xs flex items-center gap-1.5 pointer-events-none">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span>Klik atau geser pin di peta untuk memilih lokasi</span>
        </div>
      )}
    </div>
  );
}
