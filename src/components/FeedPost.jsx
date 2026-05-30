import { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { MessageCircle, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useUserLookup, getUserName } from "../hooks/useUserLookup";
import LemonModal from "./LemonModal";

export default function FeedPost({ activity, currentUser, savedStands, onRefresh }) {
  const userMap = useUserLookup();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showLemonModal, setShowLemonModal] = useState(false);

  const hasGivenLemon = activity.lemon_users?.includes(currentUser?.email);
  const lemonCount = activity.lemons || 0;

  // Always show the current live username, not the stored one
  const displayName = getUserName(userMap, activity.user_email, activity.user_name);

  const giveLemon = async (e) => {
    e.stopPropagation();
    if (!currentUser || hasGivenLemon) return;
    const newLemonUsers = [...(activity.lemon_users || []), currentUser.email];
    await base44.entities.Activity.update(activity.id, {
      lemons: lemonCount + 1,
      lemon_users: newLemonUsers,
    });
    onRefresh?.();
  };

  const loadComments = async () => {
    if (comments !== null) return;
    const data = await base44.entities.ActivityComment.filter({ activity_id: activity.id }, "created_date", 50);
    setComments(data);
  };

  const toggleComments = async () => {
    if (!showComments) await loadComments();
    setShowComments(prev => !prev);
  };

  const submitComment = async () => {
    if (!commentText.trim() || !currentUser) return;
    setSubmitting(true);
    const newComment = await base44.entities.ActivityComment.create({
      activity_id: activity.id,
      user_email: currentUser.email,
      user_name: currentUser.display_name || currentUser.full_name || "Someone",
      text: commentText.trim(),
    });
    setComments(prev => [...(prev || []), newComment]);
    setCommentText("");
    setSubmitting(false);
  };

  const initials = displayName[0]?.toUpperCase() || "?";
  const actionText = activity.type === "visit" ? "visited" : "opened a new stand:";
  const timeAgo = activity.created_date
    ? formatDistanceToNow(new Date(activity.created_date), { addSuffix: true })
    : "";

  const postTitle = activity.title || null;

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to={`/user/${encodeURIComponent(activity.user_email)}`} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-extrabold text-white shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">{displayName}</p>
            <p className="text-[10px] text-muted-foreground">{timeAgo}</p>
          </div>
        </Link>
      </div>

      {/* Content */}
      <div>
        {postTitle ? (
          <p className="text-sm font-semibold">{postTitle}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {actionText}{" "}
            {activity.stand_id && (
              <Link to={`/stand/${activity.stand_id}`} className="font-bold text-foreground hover:underline">
                {activity.stand_name}
              </Link>
            )}
          </p>
        )}
        {activity.note && (
          <p className="text-sm mt-1.5 text-foreground leading-relaxed">"{activity.note}"</p>
        )}
      </div>

      {/* Photos */}
      {activity.photos?.length > 0 && (
        <div className={`grid gap-1 ${activity.photos.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {activity.photos.map((url, i) => (
            <img
              key={i}
              src={url}
              alt="activity photo"
              className="w-full h-40 object-cover rounded-xl"
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1 border-t border-border">
        {/* Lemon give button */}
        <button
          onClick={giveLemon}
          disabled={hasGivenLemon || !currentUser}
          className={`flex items-center gap-1 text-sm font-semibold transition-opacity ${hasGivenLemon ? "opacity-60" : "hover:opacity-70"}`}
        >
          🍋
          <span>{hasGivenLemon ? "You gave a lemon" : "Give Lemon"}</span>
        </button>

        {/* Lemon count — tap to see who */}
        {lemonCount > 0 && (
          <button
            onClick={() => setShowLemonModal(true)}
            className="text-sm font-bold text-primary hover:underline"
          >
            {lemonCount} 🍋
          </button>
        )}

        <button
          onClick={toggleComments}
          className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors ml-auto"
        >
          <MessageCircle className="h-4 w-4" />
          {comments !== null ? comments.length : ""}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="space-y-2">
          {(comments || []).map(c => {
            const commenterName = getUserName(userMap, c.user_email, c.user_name);
            return (
              <div key={c.id} className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold shrink-0">
                  {commenterName[0].toUpperCase()}
                </div>
                <div className="bg-muted/50 rounded-xl px-3 py-1.5 flex-1">
                  <p className="text-xs font-bold">{commenterName}</p>
                  <p className="text-xs text-muted-foreground">{c.text}</p>
                </div>
              </div>
            );
          })}
          <div className="flex gap-2 mt-2">
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submitComment()}
              placeholder="Add a comment..."
              className="flex-1 text-xs bg-muted/50 rounded-full px-3 py-2 outline-none"
            />
            <button
              onClick={submitComment}
              disabled={submitting || !commentText.trim()}
              className="p-2 rounded-full bg-primary text-primary-foreground disabled:opacity-40"
            >
              <Send className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {showLemonModal && (
        <LemonModal
          lemonUsers={activity.lemon_users || []}
          onClose={() => setShowLemonModal(false)}
        />
      )}
    </div>
  );
}