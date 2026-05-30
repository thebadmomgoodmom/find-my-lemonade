import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";
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

export default function AddStand() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [position, setPosition] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    neighborhood: "",
    hours: "",
    parental_permission: false,
  });
  const [items, setItems] = useState([{ name: "", price: "" }]);
  const [photoFile, setPhotoFile] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
        () => {}
      );
    }
  }, []);

  const addItem = () => setItems([...items, { name: "", price: "" }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) => {
    const updated = [...items];
    updated[i][field] = value;
    setItems(updated);
  };

  const handleSubmit = async () => {
    const selectedCats = form.categories || (form.category ? [form.category] : []);
    if (!form.name.trim()) {
      toast.error("Please enter a stand name");
      return;
    }
    if (!position) {
      toast.error("Please tap the map to set your stand location");
      return;
    }
    if (!form.parental_permission) {
      toast.error("Please confirm parental permission");
      return;
    }

    setSubmitting(true);

    let photoUrl = "";
    if (photoFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: photoFile });
      photoUrl = file_url;
    }

    const validItems = items
      .filter((i) => i.name.trim())
      .map((i) => ({ name: i.name, price: parseFloat(i.price) || 0 }));

    // Fuzz the location slightly for privacy
    const fuzz = () => (Math.random() - 0.5) * 0.002;

    const stand = await base44.entities.Stand.create({
      ...form,
      categories: selectedCats,
      category: selectedCats[0] || "other",
      latitude: position[0] + fuzz(),
      longitude: position[1] + fuzz(),
      items: validItems,
      photo: photoUrl,
      is_open: true,
      average_rating: 0,
      review_count: 0,
    });

    // Badge for stand owner
    if (user) {
      const me = await base44.auth.me();
      const newBadges = [...(me.badges || [])];
      if (!newBadges.includes("stand_owner")) newBadges.push("stand_owner");
      await base44.auth.updateMe({ badges: newBadges });
    }

    toast.success("Stand created! 🍋");
    setSubmitting(false);
    navigate(`/stand/${stand.id}`);
  };

  return (
    <div className="font-nunito max-w-lg mx-auto p-4 space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">{"🍋 Add Your Stand"}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Share your stand with the neighborhood
        </p>
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <Label className="font-semibold text-sm">Stand Name *</Label>
        <Input
          placeholder="e.g. Mia's Lemonade"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="rounded-xl"
        />
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <Label className="font-semibold text-sm">Category *</Label>
        <div className="flex flex-wrap gap-2">
          {[
            { key: "lemonade", label: "🍋 Lemonade" },
            { key: "drinks", label: "🥤 Drinks" },
            { key: "snacks", label: "🍿 Snacks" },
            { key: "baked_goods", label: "🧁 Baked Goods" },
            { key: "other", label: "🏪 Other" },
          ].map(({ key, label }) => {
            const cats = form.categories || (form.category ? [form.category] : []);
            const selected = cats.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  const prev = form.categories || (form.category ? [form.category] : []);
                  const next = selected ? prev.filter(c => c !== key) : [...prev, key];
                  setForm({ ...form, categories: next, category: next[0] || "" });
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  selected ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-transparent"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label className="font-semibold text-sm">Description</Label>
        <Textarea
          placeholder="Tell people about your stand..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="rounded-xl"
          rows={3}
        />
      </div>

      {/* Items */}
      <div className="space-y-2">
        <Label className="font-semibold text-sm">{"Items & Prices"}</Label>
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input
              placeholder="Item name"
              value={item.name}
              onChange={(e) => updateItem(i, "name", e.target.value)}
              className="rounded-xl flex-1"
            />
            <div className="relative w-24">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <Input
                type="number"
                placeholder="0.00"
                value={item.price}
                onChange={(e) => updateItem(i, "price", e.target.value)}
                className="rounded-xl pl-7"
                step="0.25"
                min="0"
              />
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

      {/* Neighborhood and Hours */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="font-semibold text-sm">Neighborhood</Label>
          <Input
            placeholder="e.g. Oak Street"
            value={form.neighborhood}
            onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="font-semibold text-sm">Hours</Label>
          <Input
            placeholder="e.g. 10am-3pm"
            value={form.hours}
            onChange={(e) => setForm({ ...form, hours: e.target.value })}
            className="rounded-xl"
          />
        </div>
      </div>

      {/* Photo */}
      <div className="space-y-1.5">
        <Label className="font-semibold text-sm">Photo (optional)</Label>
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => setPhotoFile(e.target.files[0])}
          className="rounded-xl"
        />
      </div>

      {/* Location Picker */}
      <div className="space-y-1.5">
        <Label className="font-semibold text-sm flex items-center gap-1.5">
          <MapPin className="h-4 w-4" /> Stand Location *
        </Label>
        <p className="text-[11px] text-muted-foreground">
          {"Tap the map to set an approximate location. Exact address won't be shown."}
        </p>
        <div className="h-48 rounded-xl overflow-hidden border border-border">
          <MapContainer
            center={position || [40.7128, -74.006]}
            zoom={15}
            className="h-full w-full"
            zoomControl={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <RecenterMap position={position} />
            <LocationPicker position={position} setPosition={setPosition} />
          </MapContainer>
        </div>
      </div>

      {/* Permission */}
      <div className="flex items-start gap-3 bg-muted/50 p-3 rounded-xl">
        <Checkbox
          id="permission"
          checked={form.parental_permission}
          onCheckedChange={(checked) => setForm({ ...form, parental_permission: !!checked })}
          className="mt-0.5"
        />
        <Label htmlFor="permission" className="text-xs leading-relaxed cursor-pointer">
          I confirm I have parental permission to create this stand (if under 18) and agree to the community guidelines.
        </Label>
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full rounded-full h-12 text-base font-bold"
      >
        {submitting ? "Creating..." : "🍋 Create Stand"}
      </Button>
    </div>
  );
}
