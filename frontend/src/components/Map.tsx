'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';

delete (L.Icon.Default.prototype as any)._getIconUrl;
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
];

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
        const res = await axios.get('http://localhost:5000/api/v1/users/craftsmen');
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
          <Marker key={c._id} position={coords as [number, number]}>
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
