import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Train, MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 13);
    }
  }, [center, zoom, map]);
  return null;
}

export default function LocationMap({ 
  restaurantLocation, 
  userLocation, 
  transitInfo,
  height = '400px',
  showControls = true 
}) {
  // Default center (will be updated based on locations)
  const defaultCenter = restaurantLocation || userLocation || [37.7749, -122.4194]; // SF default

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200" style={{ height }}>
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={showControls}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={defaultCenter} zoom={13} />
        
        {restaurantLocation && (
          <Marker position={restaurantLocation}>
            <Popup>
              <div className="text-center">
                <MapPin className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <p className="font-semibold">Restaurant Location</p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {userLocation && (
          <Marker 
            position={userLocation}
            icon={L.divIcon({
              className: 'custom-user-marker',
              html: '<div style="background: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
              iconSize: [18, 18],
              iconAnchor: [9, 9]
            })}
          >
            <Popup>
              <p className="font-semibold text-blue-600">Your Location</p>
            </Popup>
          </Marker>
        )}
      </MapContainer>
      
      {transitInfo && (
        <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-slate-200">
          <div className="flex items-start gap-2">
            <Train className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-slate-900 text-sm">Public Transit</p>
              <p className="text-xs text-slate-600">{transitInfo}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}