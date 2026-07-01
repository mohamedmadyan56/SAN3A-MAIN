'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import { API_BASE } from '@/lib/api';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface CraftsmanMarker {
  _id: string;
  name: string;
  rating: number;
  avgResponseTimeSeconds: number | null;
  location: {
    coordinates: [number, number];
    address?: string;
  };
}

const fallbackMarkers = [
  { _id: '1', name: 'أحمد - كهربائي', rating: 4.8, avgResponseTimeSeconds: 45, location: { coordinates: [30.0444, 31.2357] as [number, number] } },
  { _id: '2', name: 'محمد - سباك', rating: 4.7, avgResponseTimeSeconds: 60, location: { coordinates: [30.0500, 31.2400] as [number, number] } },
  { _id: '3', name: 'علي - نجار', rating: 4.9, avgResponseTimeSeconds: 30, location: { coordinates: [30.0380, 31.2300] as [number, number] } },
  { _id: '4', name: 'محمود - دهان', rating: 4.6, avgResponseTimeSeconds: 75, location: { coordinates: [30.0560, 31.2260] as [number, number] } },
];

const greenCraftsmanIcon = L.divIcon({
  className: '',
  html: '<div style="width:28px;height:28px;border-radius:9999px;background:#0f5132;border:3px solid white;box-shadow:0 6px 16px rgba(15,81,50,.28);display:flex;align-items:center;justify-content:center;color:white;font-size:14px;font-weight:700;">⌂</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

function formatTime(seconds: number | null): string {
  if (seconds === null) return 'جديد';
  if (seconds < 60) return `استجابة ${Math.round(seconds)}ث`;
  return `استجابة ${Math.round(seconds / 60)}د`;
}

export default function Map() {
  const [craftsmen, setCraftsmen] = useState<CraftsmanMarker[]>(fallbackMarkers);

  useEffect(() => {
    const fetchCraftsmen = async () => {
      try {
        const res = await axios.get(`${API_BASE}/users/craftsmen`);
        if (res.data.status === 'success' && res.data.data.craftsmen.length > 0) {
          setCraftsmen(res.data.data.craftsmen);
        }
      } catch {
        // use fallback if API fails
      }
    };
    fetchCraftsmen();
  }, []);

  return (
    <MapContainer
      center={[30.0444, 31.2357]}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {craftsmen.map((c) => {
        const coords = c.location?.coordinates || [30.0444, 31.2357];
        return (
          <Marker key={c._id} position={coords as [number, number]} icon={greenCraftsmanIcon}>
            <Popup>
              <div className="text-right" style={{ fontFamily: 'system-ui' }}>
                <p className="font-bold text-sm">{c.name}</p>
                <p className="text-xs text-amber-600">⭐ {c.rating?.toFixed(1)}</p>
                <p className="text-xs text-gray-500">{formatTime(c.avgResponseTimeSeconds)}</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
