import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { MapPin, ExternalLink } from 'lucide-react';
import Badge from './Badge';
import { getStaffStatusLabel } from '../../utils/statusColors';

const createColoredMarkerIcon = (statusRaw) => {
  const normalized = (statusRaw || '').toUpperCase();
  let color = '#4b5563';
  if (['PENDING_VERIFICATION', 'UNRESOLVED'].includes(normalized)) {
    color = '#d97706';
  } else if (['VERIFIED', 'ASSIGNED', 'IN_PROGRESS'].includes(normalized)) {
    color = '#2563eb';
  } else if (['RESOLVED'].includes(normalized)) {
    color = '#059669';
  } else if (['REJECTED'].includes(normalized)) {
    color = '#dc2626';
  } else if (['DUPLICATE'].includes(normalized)) {
    color = '#ea580c';
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="42">
    <path fill="${color}" stroke="#ffffff" stroke-width="1.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    <circle cx="12" cy="9" r="3" fill="#ffffff"/>
  </svg>`;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: svg,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -40],
  });
};

function AutoFitBounds({ validItems }) {
  const map = useMap();
  useEffect(() => {
    if (validItems && validItems.length > 0) {
      const bounds = L.latLngBounds(validItems.map((it) => [it.latitude, it.longitude]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [validItems, map]);
  return null;
}

export default function MultiMarkerMap({
  items = [],
  onSelect,
  height = 'h-[500px]',
  className = '',
  center = [-7.1189, 112.4150],
}) {
  const navigate = useNavigate();

  const validItems = useMemo(() => {
    return items.filter((item) => {
      if (!item) return false;
      const lat = parseFloat(item.latitude);
      const lng = parseFloat(item.longitude);
      return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    });
  }, [items]);

  const mapCenter = validItems.length > 0
    ? [validItems[0].latitude, validItems[0].longitude]
    : center;

  const handleOpenDetail = (id) => {
    if (onSelect) {
      onSelect(id);
    } else {
      navigate(`/verifier/reports/${id}`);
    }
  };

  const legendItems = [
    { label: 'Menunggu Verifikasi / Belum Selesai', color: '#d97706' },
    { label: 'Terverifikasi / Ditugaskan / Dalam Penanganan', color: '#2563eb' },
    { label: 'Selesai', color: '#059669' },
    { label: 'Ditolak', color: '#dc2626' },
    { label: 'Duplikat', color: '#ea580c' },
    { label: 'Ditutup', color: '#4b5563' },
  ];

  return (
    <div className={`w-full ${height} rounded-lg border border-border overflow-hidden shadow-xs relative ${className}`}>
      <MapContainer
        center={mapCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {validItems.length > 0 && <AutoFitBounds validItems={validItems} />}

        {validItems.map((item) => {
          const icon = createColoredMarkerIcon(item.status_raw);
          const staffStatus = getStaffStatusLabel(item.status_raw);

          return (
            <Marker
              key={item.id}
              position={[item.latitude, item.longitude]}
              icon={icon}
            >
              <Popup className="sigap-map-popup">
                <div className="p-1 max-w-xs space-y-2 text-ink">
                  <div className="flex items-center justify-between gap-2 border-b border-border pb-1.5">
                    <span className="font-mono text-xs font-extrabold text-primary bg-primary-light px-1.5 py-0.5 rounded border border-primary/20">
                      {item.nomor_laporan}
                    </span>
                    <Badge type="status" value={item.status_raw} audience="staff">
                      {staffStatus}
                    </Badge>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-ink">{item.category_name}</h4>
                    <p className="text-[11px] text-ink-soft line-clamp-2 mt-0.5" title={item.alamat_lokasi}>
                      {item.alamat_lokasi}
                    </p>
                  </div>

                  <div className="pt-1 border-t border-border flex items-center justify-between gap-2">
                    <Badge type="priority" value={item.priority} />
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(item.id)}
                      className="text-xs font-bold text-primary hover:text-primary-hover inline-flex items-center gap-1 cursor-pointer bg-primary-light/50 px-2 py-1 rounded border border-primary/20"
                    >
                      <span>Lihat Detail</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Legend */}
      <div className="absolute bottom-3 left-3 z-10 bg-surface/90 backdrop-blur-xs p-2.5 rounded-lg border border-border text-[11px] text-ink shadow-md max-w-[280px]">
        <div className="font-bold text-xs mb-1.5 flex items-center gap-1.5 border-b border-border/60 pb-1">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span>Legenda Status Laporan</span>
        </div>
        <div className="space-y-1">
          {legendItems.map((leg, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shrink-0 border border-white shadow-2xs"
                style={{ backgroundColor: leg.color }}
              />
              <span className="text-ink-soft leading-tight">{leg.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
