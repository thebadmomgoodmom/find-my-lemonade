import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { useUserLookup, getUserName } from "../hooks/useUserLookup";

export default function NotificationsPanel({ userEmail, onClose }) {
  const userMap = useUserLookup();
  const [followers, setFollowers] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const follows = await base44.entities.Follow.filter(
        { following_email: userEmail, status: "accepted" },
        "-created_date",
        20
      );
      setFollowers(follows);

      const myActivities = await base44.entities.Activity.filter(
        { user_email: userEmail },
        "-created_date",
        20
      );
      const activityIds = myActivities.map(a => a.id);
      if (activityIds.length > 0) {
        const allComments = await base44.entities.ActivityComment.list("-created_date", 50);
        const mine = allComments.filter(c =>
          activityIds.includes(c.activity_id) && c.user_email !== userEmail
        );
        setComments(mine.slice(0, 10));
      }
      setLoading(false);
    }
    load();
  }, [userEmail]);

  const isEmpty = !loading && followers.length === 0 && comments.length === 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[490]" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 h-1/2 bg-card border-t border-border rounded-t-2xl shadow-xl z-[500] font-nunito flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-bold text-sm">🔔 Notifications</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-muted">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : isEmpty ? (
            <div className="text-center py-8 text-sm text-muted-foreground">No notifications yet</div>
          ) : (
            <div className="divide-y divide-border">
              {followers.map(f => (
                <div key={f.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {getUserName(userMap, f.follower_email, "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                          to={`/user/${encodeURIComponent(f.follower_email)}`}
                          onClick={onClose}
                          className="text-sm font-bold hover:underline truncate block"
                        >
                          {getUserName(userMap, f.follower_email, "Someone")}
                        </Link>
                    <p className="text-xs text-muted-foreground">started following you 👤</p>
                  </div>
                </div>
              ))}
              {comments.map(c => (
                <div key={c.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                    {(c.user_name || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold">{c.user_name || c.user_email}</p>
                    <p className="text-xs text-muted-foreground truncate">commented: "{c.text}" 💬</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}