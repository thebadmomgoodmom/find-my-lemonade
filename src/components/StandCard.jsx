import { Link } from "react-router-dom";
import { Star, MapPin, Clock } from "lucide-react";

const categoryEmoji = {
  lemonade: "🍋",
  drinks: "🥤",
  snacks: "🍿",
  baked_goods: "🧁",
  other: "🏪",
};

export default function StandCard({ stand }) {
  const cheapest = stand.items?.length
    ? Math.min(...stand.items.map((i) => i.price))
    : null;

  return (
    <Link to={`/stand/${stand.id}`} className="block">
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="relative h-32">
          {stand.photo ? (
            <img
              src={stand.photo}
              alt={stand.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <span className="text-4xl">
                {categoryEmoji[stand.category] || "🍋"}
              </span>
            </div>
          )}
          {stand.is_open && (
            <span className="absolute top-2 right-2 bg-secondary text-secondary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
              OPEN
            </span>
          )}
        </div>
        <div className="p-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-sm truncate">{stand.name}</h3>
            <div className="flex items-center gap-0.5 shrink-0">
              <Star className="h-3.5 w-3.5 fill-primary text-primary" />
              <span className="text-xs font-semibold">
                {stand.average_rating > 0
                  ? stand.average_rating.toFixed(1)
                  : "New"}
              </span>
            </div>
          </div>
          <p className="text-muted-foreground text-xs mt-1 truncate">
            {stand.items?.map((i) => i.name).join(", ") || "Stand"}
          </p>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="text-[10px]">
                {stand.neighborhood || "Nearby"}
              </span>
            </div>
            {cheapest !== null && (
              <span className="text-xs font-bold text-secondary">
                From ${cheapest.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}