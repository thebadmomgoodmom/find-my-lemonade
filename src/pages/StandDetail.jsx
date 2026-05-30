import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Star, MapPin, Clock, ArrowLeft, Edit2, Trash2, ToggleLeft, ToggleRight, Navigation } from "lucide-react";
import VisitSection from "../components/VisitSection";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import StarRating from "../components/StarRating";
import { toast } from "sonner";

const categoryEmoji = {
  lemonade: "🍋",
  drinks: "🥤",
  snacks: "🍿",
  baked_goods: "🧁",
  other: "🏪",
};

export default function StandDetail() {
  const { standId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOwner, setIsOwner] = useState(false);
  const [stand, setStand] = useState(null);
  const isAdmin = user?.email === 'liammlinton@gmail.com';
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [standData, reviewsData] = await Promise.all([
      base44.entities.Stand.get(standId),
      base44.entities.Review.filter({ stand_id: standId }, "-created_date", 50),
    ]);
    setStand(standData);
    setReviews(reviewsData);
    if (user?.email) {
      const userReview = reviewsData.find((r) => r.created_by === user.email);
      setHasReviewed(!!userReview);
      setIsOwner(standData.created_by === user.email);
    }
    setLoading(false);

    // Track visit for badges
    if (user) {
      const me = await base44.auth.me();
      const visited = me.stands_visited || [];
      if (!visited.includes(standId)) {
        const newVisited = [...visited, standId];
        const newBadges = [...(me.badges || [])];
        if (!newBadges.includes("first_visit")) newBadges.push("first_visit");
        if (newVisited.length >= 3 && !newBadges.includes("explorer")) newBadges.push("explorer");
        await base44.auth.updateMe({ stands_visited: newVisited, badges: newBadges });
      }
    }
  }, [standId, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const submitReview = async () => {
    if (reviewRating === 0) {
      toast.error("Please select a rating");
      return;
    }
    setSubmitting(true);
    await base44.entities.Review.create({
      stand_id: standId,
      rating: reviewRating,
      text: reviewText,
      reviewer_name: user?.display_name || user?.full_name || "Anonymous",
    });

    // Update stand average
    const allReviews = await base44.entities.Review.filter({ stand_id: standId });
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
    await base44.entities.Stand.update(standId, {
      average_rating: Math.round(avg * 10) / 10,
      review_count: allReviews.length,
    });

    // Badge check
    if (user) {
      const me = await base44.auth.me();
      const newCount = (me.reviews_count || 0) + 1;
      const newBadges = [...(me.badges || [])];
      if (!newBadges.includes("first_review")) newBadges.push("first_review");
      if (newCount >= 5 && !newBadges.includes("super_reviewer")) newBadges.push("super_reviewer");
      await base44.auth.updateMe({ reviews_count: newCount, badges: newBadges });
    }

    setReviewRating(0);
    setReviewText("");
    setSubmitting(false);
    setHasReviewed(true);
    toast.success("Review submitted!");
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen font-nunito">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!stand) {
    return (
      <div className="flex flex-col items-center justify-center h-screen font-nunito gap-3">
        <span className="text-5xl">😢</span>
        <p className="font-bold">Stand not found</p>
        <Link to="/">
          <Button variant="outline" className="rounded-full">Go back</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="font-nunito max-w-lg mx-auto">
      {/* Header Image */}
      <div className="relative h-52">
        {stand.photo ? (
          <img src={stand.photo} alt={stand.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
            <span className="text-7xl">{categoryEmoji[stand.category] || "🍋"}</span>
          </div>
        )}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-card/80 backdrop-blur rounded-full p-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        {stand.is_open && (
          <span className="absolute top-4 right-4 bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1 rounded-full">
            OPEN NOW
          </span>
        )}
      </div>

      <div className="p-4 space-y-5">
        {/* Owner Controls */}
        {(isOwner || isAdmin) && (
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" className="rounded-full text-xs h-8" onClick={() => navigate(`/edit-stand/${standId}`)}>
              <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit Stand
            </Button>
            <Button
              size="sm"
              variant={stand.is_open ? "outline" : "default"}
              className="rounded-full text-xs h-8"
              onClick={async () => {
                await base44.entities.Stand.update(standId, { is_open: !stand.is_open });
                setStand({ ...stand, is_open: !stand.is_open });
                toast.success(stand.is_open ? "Stand marked as closed" : "Stand is open again!");
              }}
            >
              {stand.is_open ? <ToggleRight className="h-3.5 w-3.5 mr-1" /> : <ToggleLeft className="h-3.5 w-3.5 mr-1" />}
              {stand.is_open ? "Mark Closed" : "Open Again"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive" className="rounded-full text-xs h-8">
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="z-[9999]">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this stand?</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently remove this stand.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={async () => { await base44.entities.Stand.delete(standId); navigate("/profile"); toast.success("Stand deleted"); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {/* Visit */}
        {!isOwner && (
          <VisitSection standId={standId} standName={stand.name} user={user} />
        )}

        {/* Name & Rating */}
        <div>
          <h1 className="text-2xl font-extrabold">{stand.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <StarRating rating={Math.round(stand.average_rating || 0)} />
            <span className="text-sm font-semibold">
              {stand.average_rating > 0 ? stand.average_rating.toFixed(1) : "No ratings"}
            </span>
            <span className="text-xs text-muted-foreground">
              ({stand.review_count || 0} reviews)
            </span>
          </div>
        </div>

        {/* Map + Directions */}
        {stand.latitude != null && stand.longitude != null && !isNaN(stand.latitude) && !isNaN(stand.longitude) && (
          <div className="space-y-2">
            <div className="h-44 rounded-xl overflow-hidden border border-border" style={{isolation: 'isolate', zIndex: 0, position: 'relative'}}>
              <MapContainer
                center={[stand.latitude, stand.longitude]}
                zoom={16}
                className="h-full w-full"
                zoomControl={false}
                dragging={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
                attributionControl={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[stand.latitude, stand.longitude]} />
              </MapContainer>
            </div>
            <a
              href={`${
                /iphone|ipad|ipod/i.test(navigator.userAgent)
                  ? `maps://maps.apple.com/?daddr=${stand.latitude},${stand.longitude}`
                  : `https://www.google.com/maps/dir/?api=1&destination=${stand.latitude},${stand.longitude}`
              }`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground font-bold text-sm py-2.5 rounded-full"
            >
              <Navigation className="h-4 w-4" />
              Get Directions
            </a>
          </div>
        )}

        {/* Info */}
        <div className="flex flex-wrap gap-3">
          {stand.neighborhood && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {stand.neighborhood}
            </div>
          )}
          {stand.hours && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {stand.hours}
            </div>
          )}
        </div>

        {stand.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{stand.description}</p>
        )}

        {/* Menu */}
        {stand.items?.length > 0 && (
          <div>
            <h2 className="font-bold text-base mb-2">🧾 Menu</h2>
            <div className="bg-muted/50 rounded-xl p-3 space-y-2">
              {stand.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-sm font-bold text-secondary">
                    ${item.price?.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div>
          <h2 className="font-bold text-base mb-3">⭐ Reviews</h2>

          {!hasReviewed && user && (
            <div className="bg-muted/50 rounded-xl p-4 mb-4 space-y-3">
              <p className="text-sm font-semibold">Leave a review</p>
              <StarRating rating={reviewRating} onRate={setReviewRating} interactive size="lg" />
              <Textarea
                placeholder="Tell others about this stand..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="bg-card text-sm"
                rows={3}
              />
              <Button
                onClick={submitReview}
                disabled={submitting || reviewRating === 0}
                className="rounded-full w-full"
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          )}

          {hasReviewed && (
            <p className="text-sm text-muted-foreground mb-3 italic">
              ✅ You've already reviewed this stand
            </p>
          )}

          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No reviews yet — be the first!
            </p>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="bg-card border border-border rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">
                      {review.created_by === user?.email
                        ? (user?.display_name || user?.full_name || "Anonymous")
                        : (review.reviewer_name || "Anonymous")}
                    </span>
                    <div className="flex items-center gap-2">
                      <StarRating rating={review.rating} size="sm" />
                      {isAdmin && (
                        <button
                          onClick={async () => {
                            await base44.entities.Review.delete(review.id);
                            toast.success("Review deleted");
                            loadData();
                          }}
                          className="p-1 rounded-full hover:bg-destructive/10 text-destructive"
                          title="Delete review"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  {review.text && (
                    <p className="text-sm text-muted-foreground mt-1">{review.text}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
