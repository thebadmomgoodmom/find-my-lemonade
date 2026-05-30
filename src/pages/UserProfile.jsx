import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { ArrowLeft, UserCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import StandCard from "../components/StandCard";
import FeedPost from "../components/FeedPost";

export default function UserProfile() {
  const { userEmail } = useParams();
  const email = decodeURIComponent(userEmail);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stands, setStands] = useState([]);
  const [activities, setActivities] = useState([]);
  const [profileUser, setProfileUser] = useState(null);
  const [followRecord, setFollowRecord] = useState(null);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [savedStands, setSavedStands] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  const isMe = user?.email === email;

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [standsData, activitiesData, followersData, followingData, allUsersData, pointEvents] = await Promise.all([
        base44.entities.Stand.filter({ created_by: email }, "-created_date", 20),
        base44.entities.Activity.filter({ user_email: email }, "-created_date", 20),
        base44.entities.Follow.filter({ following_email: email, status: "accepted" }, "-created_date", 100),
        base44.entities.Follow.filter({ follower_email: email, status: "accepted" }, "-created_date", 100),
        base44.entities.User.list("-created_date", 500),
        base44.entities.PointEvent.filter({ user_email: email }, "-created_date", 500),
      ]);
      setStands(standsData);
      setActivities(activitiesData);
      setFollowers(followersData.length);
      setFollowing(followingData.length);
      setTotalPoints(pointEvents.reduce((s, p) => s + (p.points || 0), 0));
      const foundUser = allUsersData.find(u => u.email === email);
      setProfileUser(foundUser || null);

      if (user && !isMe) {
        const myFollow = await base44.entities.Follow.filter(
          { follower_email: user.email, following_email: email },
          "-created_date",
          1
        );
        setFollowRecord(myFollow[0] || null);
      }

      if (user) {
        const saved = await base44.entities.SavedStand.filter({ user_email: user.email }, "-created_date", 100);
        setSavedStands(saved);
      }
      setLoading(false);
    }
    load();
  }, [email, user, isMe]);

  const handleFollow = async () => {
    if (!user) return;
    if (followRecord) {
      await base44.entities.Follow.delete(followRecord.id);
      setFollowRecord(null);
      setFollowers(f => f - 1);
    } else {
      const rec = await base44.entities.Follow.create({
        follower_email: user.email,
        following_email: email,
        status: "accepted",
      });
      setFollowRecord(rec);
      setFollowers(f => f + 1);
    }
  };

  const displayName = profileUser?.display_name || profileUser?.full_name || "Lemonade Fan";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen font-nunito">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="font-nunito max-w-lg mx-auto pb-6">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-bold text-base flex-1 truncate">{displayName}</h1>
      </div>

      <div className="p-4 space-y-5">
        {/* Avatar + Stats */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl font-extrabold text-white shadow-lg shrink-0">
            {displayName[0]?.toUpperCase() || "?"}
          </div>
          <div className="flex-1">
            <h2 className="font-extrabold text-lg">{displayName}</h2>
            <div className="flex gap-4 mt-1">
              <div className="text-center">
                <p className="font-extrabold">{stands.length}</p>
                <p className="text-[10px] text-muted-foreground">Stands</p>
              </div>
              <div className="text-center">
                <p className="font-extrabold">{followers}</p>
                <p className="text-[10px] text-muted-foreground">Followers</p>
              </div>
              <div className="text-center">
                <p className="font-extrabold">{following}</p>
                <p className="text-[10px] text-muted-foreground">Following</p>
              </div>
              <div className="text-center">
                <p className="font-extrabold text-primary">{totalPoints}</p>
                <p className="text-[10px] text-muted-foreground">Points</p>
              </div>
            </div>
          </div>
        </div>

        {/* Follow button */}
        {!isMe && user && (
          <Button
            onClick={handleFollow}
            variant={followRecord ? "outline" : "default"}
            className="w-full rounded-full"
          >
            {followRecord ? (
              <><UserCheck className="h-4 w-4 mr-2" />Following</>
            ) : (
              <><UserPlus className="h-4 w-4 mr-2" />Follow</>
            )}
          </Button>
        )}

        {isMe && (
          <Link to="/profile">
            <Button variant="outline" className="w-full rounded-full">Edit Profile</Button>
          </Link>
        )}

        {/* Stands */}
        {stands.length > 0 && (
          <div>
            <h3 className="font-bold text-sm mb-3">🏪 Stands ({stands.length})</h3>
            <div className="grid grid-cols-2 gap-3">
              {stands.map(s => <StandCard key={s.id} stand={s} />)}
            </div>
          </div>
        )}

        {/* Activity Feed */}
        {activities.length > 0 && (
          <div>
            <h3 className="font-bold text-sm mb-3">🍋 Activity</h3>
            <div className="space-y-3">
              {activities.map(a => (
                <FeedPost
                  key={a.id}
                  activity={a}
                  currentUser={user}
                  savedStands={savedStands}
                  onRefresh={() => {}}
                />
              ))}
            </div>
          </div>
        )}

        {stands.length === 0 && activities.length === 0 && (
          <div className="text-center py-10">
            <span className="text-4xl">🍋</span>
            <p className="mt-2 text-sm text-muted-foreground">No activity yet</p>
          </div>
        )}
      </div>
    </div>
  );
}