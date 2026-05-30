import { Star } from "lucide-react";

export default function StarRating({ rating, onRate, size = "md", interactive = false }) {
  const sizeClass = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-7 w-7" : "h-5 w-5";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onRate?.(star)}
          className={`${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform`}
        >
          <Star
            className={`${sizeClass} ${
              star <= rating
                ? "fill-primary text-primary"
                : "fill-muted text-muted-foreground/30"
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );
}