import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { X, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VisitSection({ standId, standName, user }) {
  const navigate = useNavigate();
  const [step, setStep] = useState("idle"); // idle | form | submitting | done
  const [title, setTitle] = useState(`Visited ${standName}`);
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState([]); // [{url, file}]
  const [visitLimitMsg, setVisitLimitMsg] = useState("");
  const [checking, setChecking] = useState(false);
  const fileInputRef = useRef(null);

  const checkAndOpenForm = async () => {
    if (!user) return;
    setChecking(true);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayVisits = await base44.entities.Visit.filter(
      { user_email: user.email, stand_id: standId },
      "-created_date",
      10
    );

    const dailyVisits = todayVisits.filter(v => new Date(v.created_date) >= today);
    if (dailyVisits.length >= 4) {
      setVisitLimitMsg("You've reached today's visits 🍋");
      setChecking(false);
      return;
    }

    if (todayVisits.length > 0) {
      const lastVisit = new Date(todayVisits[0].created_date);
      const minsSince = (Date.now() - lastVisit.getTime()) / 60000;
      if (minsSince < 5) {
        setVisitLimitMsg(`Try again in ${Math.ceil(5 - minsSince)} minute(s)`);
        setChecking(false);
        return;
      }
    }

    const todayCount = dailyVisits.length;
    setVisitLimitMsg(`${todayCount}/4 visits today`);
    setChecking(false);
    setTitle(`Visited ${standName}`);
    setNote("");
    setPhotos([]);
    setStep("form");
  };

  const handlePhotoSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 3) {
      toast.error("Maximum 3 photos allowed");
      return;
    }
    const newPhotos = files.map(f => ({ url: URL.createObjectURL(f), file: f, uploading: true }));
    setPhotos(prev => [...prev, ...newPhotos]);

    // Upload each
    const uploadedPhotos = await Promise.all(
      files.map(async (file) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        return file_url;
      })
    );

    setPhotos(prev => {
      const updated = [...prev];
      let uploadIdx = 0;
      for (let i = 0; i < updated.length; i++) {
        if (updated[i].uploading) {
          updated[i] = { url: uploadedPhotos[uploadIdx], file: null, uploading: false };
          uploadIdx++;
          if (uploadIdx >= uploadedPhotos.length) break;
        }
      }
      return updated;
    });
  };

  const removePhoto = (idx) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const handlePost = async () => {
    if (!title.trim()) {
      toast.error("Title cannot be empty");
      return;
    }
    if (photos.some(p => p.uploading)) {
      toast.error("Please wait for photos to upload");
      return;
    }
    setStep("submitting");

    const photoUrls = photos.map(p => p.url);

    // Record visit
    await base44.entities.Visit.create({ user_email: user.email, stand_id: standId });

    // Award point to visitor
    await base44.entities.PointEvent.create({ user_email: user.email, points: 1, reason: "stand_visit" });

    // Award point to stand owner for receiving a visit
    const standData = await base44.entities.Stand.get(standId);
    if (standData?.created_by && standData.created_by !== user.email) {
      await base44.entities.PointEvent.create({ user_email: standData.created_by, points: 1, reason: "received_visit" });
    }

    // Create activity
    await base44.entities.Activity.create({
      type: "visit",
      user_email: user.email,
      user_name: user.display_name || user.full_name || "Someone",
      stand_id: standId,
      stand_name: standName,
      title: title.trim(),
      note: note.trim() || undefined,
      photos: photoUrls.length > 0 ? photoUrls : undefined,
      lemons: 0,
      lemon_users: [],
    });

    // Badge tracking
    const me = await base44.auth.me();
    const visitedList = me.stands_visited || [];
    if (!visitedList.includes(standId)) {
      const newVisited = [...visitedList, standId];
      const newBadges = [...(me.badges || [])];
      if (!newBadges.includes("first_visit")) newBadges.push("first_visit");
      if (newVisited.length >= 3 && !newBadges.includes("explorer")) newBadges.push("explorer");
      await base44.auth.updateMe({ stands_visited: newVisited, badges: newBadges });
    }

    toast.success("🍋 Posted! Check your Home feed.");
    setStep("done");
    // Navigate home so user sees their new post
    navigate("/home");
  };

  if (step === "done") {
    return (
      <div className="bg-secondary/10 border border-secondary/20 rounded-2xl p-3 text-center">
        <p className="text-sm font-bold text-secondary">✅ Visit posted!</p>
      </div>
    );
  }

  if (step === "form" || step === "submitting") {
    return (
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-bold text-sm">🍋 Share your visit</p>
          <button onClick={() => setStep("idle")} className="p-1 rounded-full hover:bg-muted">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Title */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Title</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="mt-1 w-full text-sm bg-muted/50 border border-border rounded-xl px-3 py-2 outline-none font-semibold"
            placeholder="Visited..."
          />
        </div>

        {/* Note */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Note (optional)</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add a note for your friends..."
            className="mt-1 w-full text-sm bg-muted/50 border border-border rounded-xl px-3 py-2 outline-none resize-none"
            rows={2}
          />
        </div>

        {/* Photos */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Photos (up to 3)</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {photos.map((p, i) => (
              <div key={i} className="relative w-20 h-20">
                <img src={p.url} alt="" className={`w-20 h-20 object-cover rounded-xl ${p.uploading ? "opacity-50" : ""}`} />
                {p.uploading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
                  </div>
                )}
                {!p.uploading && (
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute -top-1 -right-1 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
            {photos.length < 3 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <ImagePlus className="h-5 w-5" />
                <span className="text-[10px] font-semibold">Add</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handlePhotoSelect}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            className="flex-1 rounded-full"
            onClick={() => setStep("idle")}
            disabled={step === "submitting"}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 rounded-full"
            onClick={handlePost}
            disabled={step === "submitting" || !title.trim() || photos.some(p => p.uploading)}
          >
            {step === "submitting" ? "Posting..." : "Post Activity"}
          </Button>
        </div>
      </div>
    );
  }

  // idle state
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground">Are you here right now?</p>
        {visitLimitMsg && (
          <span className="text-[10px] font-semibold text-muted-foreground">{visitLimitMsg}</span>
        )}
      </div>
      <button
        onClick={checkAndOpenForm}
        disabled={checking || visitLimitMsg?.startsWith("You've")}
        className="w-full bg-primary text-primary-foreground font-bold text-sm py-2.5 rounded-full disabled:opacity-50"
      >
        {checking ? "Checking..." : "🍋 I visited this stand!"}
      </button>
    </div>
  );
}