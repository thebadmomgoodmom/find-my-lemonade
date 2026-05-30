import { useState } from "react";
import { Star } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function SaveButton({ standId, userEmail, savedStands, onToggle, size = "md" }) {
  const saved = savedStands?.find(s => s.stand_id === standId);
  const [loading, setLoading] = useState(false);
  const iconClass = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  const toggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading || !userEmail) return;
    setLoading(true);
    if (saved) {
      await base44.entities.SavedStand.delete(saved.id);
    } else {
      await base44.entities.SavedStand.create({ user_email: userEmail, stand_id: standId });
    }
    onToggle?.();
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="p-1.5 rounded-full hover:bg-muted transition-colors"
      title={saved ? "Unsave stand" : "Save stand"}
    >
      <Star className={`${iconClass} transition-colors ${saved ? "fill-primary text-primary" : "text-muted-foreground"}`} />
    </button>
  );
}