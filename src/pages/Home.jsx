import { useState, useEffect, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Star, List, Map as MapIcon, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import StandCard from "../components/StandCard";
import InstallPrompt from "../components/InstallPrompt";

import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const lemonIcon = new L.DivIcon({
  html: `<div style="font-size:28px;text-align:center;line-height:1;">🍋</div>`,
  className: "lemon-marker",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

function FlyToUser({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position && typeof position[0] === 'number' && typeof position[1] === 'number' && isFinite(position[0]) && isFinite(position[1])) {
      map.flyTo(position, 15, { duration: 1.5 });
    }
  }, [position, map]);
  return null;
}

export default function Home() {
  const { user } = useAuth();
  const [stands, setStands] = useState([]);
  const [userPos, setUserPos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("map");
  const defaultCenter = [40.7128, -74.006];
  const RADIUS_MILES = 2;

  function distanceMiles(lat1, lon1, lat2, lon2) {
    const R = 3958.8;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  const visibleStands = useMemo(() => {
    const open = stands.filter(s => s.is_open !== false);
    if (!userPos) return open;
    return open.filter(s =>
      s.latitude != null && s.longitude != null &&
      !isNaN(s.latitude) && !isNaN(s.longitude) &&
      distanceMiles(userPos[0], userPos[1], s.latitude, s.longitude) <= RADIUS_MILES
    );
  }, [stands, userPos]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const standsData = await base44.entities.Stand.list("-created_date", 100);
    setStands(standsData);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          if (typeof lat === "number" && typeof lng === "number" && !isNaN(lat) && !isNaN(lng)) {
            setUserPos([lat, lng]);
          }
        },
        () => {}
      );
    }
  }, [loadAll]);

  useEffect(() => {
    const unsub = base44.entities.Stand.subscribe(event => {
      if (event.type === "create") setStands(prev => [event.data, ...prev]);
      else if (event.type === "update") setStands(prev => prev.map(s => s.id === event.id ? event.data : s));
      else if (event.type === "delete") setStands(prev => prev.filter(s => s.id !== event.id));
    });
    return unsub;
  }, []);

  const center = userPos || defaultCenter;
  const mapStands = stands.filter(s => s.is_open !== false && s.latitude != null && s.longitude != null && !isNaN(s.latitude) && !isNaN(s.longitude));

  return (
    <div className="font-nunito">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between z-40 relative">
        <div>
          <h1 className="text-lg font-extrabold flex items-center gap-1.5">🍋 Find My Lemonade</h1>
          <p className="text-[10px] text-muted-foreground font-medium">
            {visibleStands.length} open stands within 2 miles
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant={view === "map" ? "default" : "outline"} onClick={() => setView("map")} className="h-8 rounded-full text-xs px-3">
            <MapIcon className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant={view === "list" ? "default" : "outline"} onClick={() => setView("list")} className="h-8 rounded-full text-xs px-3">
            <List className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <InstallPrompt />

      {loading ? (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : view === "map" ? (
        <div className="h-[calc(100vh-130px)] w-full relative">
          <MapContainer center={center} zoom={14} className="h-full w-full z-0" zoomControl={false}>
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <FlyToUser position={userPos} />
            {mapStands.map(stand => (
              <Marker key={stand.id} position={[stand.latitude, stand.longitude]} icon={lemonIcon}>
                <Popup>
                  <div className="font-nunito min-w-[180px]">
                    <h3 className="font-bold text-sm">{stand.name}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs">{stand.average_rating > 0 ? stand.average_rating.toFixed(1) : "New"}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{stand.items?.map(i => i.name).join(", ")}</p>
                    <Link to={`/stand/${stand.id}`} className="inline-block mt-2 text-xs font-bold text-blue-500 hover:underline">
                      View Details →
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          {userPos && (
            <Button
              size="icon"
              className="absolute bottom-6 right-4 z-[1000] rounded-full shadow-lg h-10 w-10 bg-card text-foreground border border-border hover:bg-muted"
              onClick={() => setUserPos([...userPos])}
            >
              <Navigation className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <div className="p-4 space-y-3 max-w-lg mx-auto">
          {visibleStands.length === 0 ? (
            <div className="text-center py-20">
              <span className="text-5xl">🍋</span>
              <p className="mt-3 font-bold text-lg">No stands nearby!</p>
              <Link to="/add-stand"><Button className="mt-4 rounded-full">Add a Stand</Button></Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {visibleStands.map(stand => <StandCard key={stand.id} stand={stand} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
