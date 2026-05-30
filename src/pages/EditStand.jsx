import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, MapPin, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function LocationPicker({ position, setPosition }) {
  useMapEvents({ click(e) { setPosition([e.latlng.lat, e.latlng.lng]); } });
  return position ? <Marker position={position} /> : null;
}

function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => { if (position) map.flyTo(position, 15); }, [position]);
  return null;
}

export default function EditStand() {
  const { standId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [position, setPosition] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", category: "lemonade", neighborhood: "", hours: "" });
  const [items, setItems] = useState([{ name: "", price: "" }]);

  useEffect(() => {
    async function load() {
      const stand = await base44.entities.Stand.get(standId);
      if (stand.created_by !== user?.email) {
        toast.error("You can only edit your own stands");
        navigate(`/stand/${standId}`);
        return;
      }
      setForm({
        name: stand.name || "",
        description: stand.description || "",
        category: stand.category || "lemonade",
        neighborhood: stand.neighborhood || "",
        hours: stand.hours || "",
      });
      setItems(stand.items?.length ? stand.items.map(i => ({ name: i.name, price: String(i.price) })) : [{ name: "", price: "" }]);
      setPosition([stand.latitude, stand.longitude]);
      setLoading(false);
    }
    load();
  }, [standId, user, navigate]);

  const addItem = () => setItems([...items, { name: "", price: "" }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) => {
    const updated = [...items];
    updated[i][field] = value;
    setItems(updated);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Please enter a stand name"); return; }
    if (!position) { toast.error("Please set a location on the map"); return; }
    setSubmitting(true);
    const validItems = items.filter(i => i.name.trim()).map(i => ({ name: i.name, price: parseFloat(i.price) || 0 }));
    await base44.entities.Stand.update(standId, { ...form, latitude: position[0], longitude: position[1], items: validItems });
    toast.success("Stand updated!");
    navigate(`/stand/${standId}`);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen font-nunito">
      <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="font-nunito max-w-lg mx-auto p-4 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/stand/${standId}`)} className="p-2 rounded-full hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold">Edit Stand</h1>
          <p className="text-sm text-muted-foreground">Update your stand details</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="font-semibold text-sm">Stand Name *</Label>
        <Input placeholder="e.g. Mia's Lemonade" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl" />
      </div>

      <div className="space-y-1.5">
        <Label className="font-semibold text-sm">Category *</Label>
        <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
          <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="lemonade">{"🍋 Lemonade"}</SelectItem>
            <SelectItem value="drinks">{"🥤 Drinks"}</SelectItem>
            <SelectItem value="snacks">{"🍿 Snacks"}</SelectItem>
            <SelectItem value="baked_goods">{"🧁 Baked Goods"}</SelectItem>
            <SelectItem value="other">{"🏪 Other"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="font-semibold text-sm">Description</Label>
        <Textarea placeholder="Tell people about your stand..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl" rows={3} />
      </div>

      <div className="space-y-2">
        <Label className="font-semibold text-sm">{"Items & Prices"}</Label>
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input placeholder="Item name" value={item.name} onChange={(e) => updateItem(i, "name", e.target.value)} className="rounded-xl flex-1" />
            <div className="relative w-24">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <Input type="number" placeholder="0.00" value={item.price} onChange={(e) => updateItem(i, "price", e.target.value)} className="rounded-xl pl-7" step="0.25" min="0" />
            </div>
            {items.length > 1 && (
              <Button size="icon" variant="ghost" onClick={() => removeItem(i)} className="shrink-0">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addItem} className="rounded-full text-xs">
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="font-semibold text-sm">Neighborhood</Label>
          <Input placeholder="e.g. Oak Street" value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label className="font-semibold text-sm">Hours</Label>
          <Input placeholder="e.g. 10am-3pm" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} className="rounded-xl" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="font-semibold text-sm flex items-center gap-1.5">
          <MapPin className="h-4 w-4" /> Location
        </Label>
        <p className="text-[11px] text-muted-foreground">Tap the map to move your stand's location.</p>
        <div className="h-48 rounded-xl overflow-hidden border border-border">
          <MapContainer center={position || [40.7128, -74.006]} zoom={15} className="h-full w-full" zoomControl={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <RecenterMap position={position} />
            <LocationPicker position={position} setPosition={setPosition} />
          </MapContainer>
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={submitting} className="w-full rounded-full h-12 text-base font-bold">
        {submitting ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}