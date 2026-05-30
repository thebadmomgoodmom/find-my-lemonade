import { Award, MessageSquare, Compass, Star, Zap } from "lucide-react";

const BADGES = {
  first_visit: {
    name: "First Visit",
    description: "Visited your first stand",
    icon: Star,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  first_review: {
    name: "First Review",
    description: "Left your first review",
    icon: MessageSquare,
    color: "text-secondary",
    bg: "bg-secondary/10",
  },
  explorer: {
    name: "Explorer",
    description: "Visited 3 different stands",
    icon: Compass,
    color: "text-accent",
    bg: "bg-accent/10",
  },
  super_reviewer: {
    name: "Super Reviewer",
    description: "Left 5 reviews",
    icon: Award,
    color: "text-chart-4",
    bg: "bg-blue-50",
  },
  stand_owner: {
    name: "Stand Owner",
    description: "Created your own stand",
    icon: Zap,
    color: "text-chart-5",
    bg: "bg-purple-50",
  },
};

export { BADGES };

export default function BadgeIcon({ badgeId, earned = false, showLabel = true }) {
  const badge = BADGES[badgeId];
  if (!badge) return null;
  const Icon = badge.icon;

  return (
    <div className={`flex flex-col items-center gap-1 ${!earned ? "opacity-30 grayscale" : ""}`}>
      <div className={`${badge.bg} rounded-full p-3`}>
        <Icon className={`h-6 w-6 ${badge.color}`} />
      </div>
      {showLabel && (
        <>
          <span className="text-xs font-bold text-center">{badge.name}</span>
          <span className="text-[10px] text-muted-foreground text-center">
            {badge.description}
          </span>
        </>
      )}
    </div>
  );
}