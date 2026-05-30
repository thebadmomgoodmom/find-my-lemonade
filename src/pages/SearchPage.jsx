import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { UserPlus, UserCheck, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import StandCard from "../components/StandCard";

const FILTERS = [
  { key: "all", label: "All", emoji: "✨" },
  { key: "lemonade", label: "Lemonade", emoji: "🍋" },
  { key: "drinks", label: "Drinks", emoji: "🥤" },
  { key: "snacks", label: "Snacks", emoji: "🍿" },
  { key: "baked_goods", label: "Baked", emoji: "🧁" },
  { key: "other", label: "Other", emoji: "🏪" },
];

const SORT_OPTIONS = [
  { key: "rating", label: "Highest Rated" },
  { key: "cheapest", label: "Cheapest First" },
  { key: "newest", label: "Newest" },
];

export default function SearchPage() {
  const { user } = useAuth();
  const [stands, setStands] = useState([]);
  const [allUsersList, setAllUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("rating");
  const [tab, setTab] = useState("stands");
  const [followMap, setFollowMap] = useState({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [all, users] = await Promise.all([
        base44.entities.Stand.list("-created_date", 200),
        base44.entities.User.list("-created_date", 200),
      ]);
      const data = all.filter(s => s.is_open !== false);
      setStands(data);
      setAllUsersList(users);
      if (user?.email) {
        const myFollows = await base44.entities.Follow.filter({ follower_email: user.email }, "-created_date", 200);
        const map = {};
        myFollows.forEach(f => { map[f.following_email] = f; });
        setFollowMap(map);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  const allUsers = useMemo(() => {
    return allUsersList.map(u => ({
      email: u.email,
      name: u.full_name || u.display_name || "Lemonade Fan",
      standsCount: stands.filter(st => st.created_by === u.email).length,
    }));
  }, [allUsersList, stands]);

  const filteredUsers = useMemo(() => {
    if (!query.trim()) return allUsers;
    const q = query.toLowerCase();
    return allUsers.filter(u =>
      u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)
    );
  }, [allUsers, query]);

  const filtered = useMemo(() => {
    let result = [...stands];
    if (activeFilter !== "all") {
      result = result.filter(s => {
        const cats = s.categories?.length ? s.categories : (s.category ? [s.category] : []);
        return cats.includes(activeFilter);
      });
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.items?.some(i => i.name?.toLowerCase().includes(q)) ||
        s.neighborhood?.toLowerCase().includes(q)
      );
    }
    if (sortBy === "rating") result.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
    else if (sortBy === "cheapest") {
      const cheapestPrice = s => s.items?.length ? Math.min(...s.items.map(i => i.price || 999)) : 999;
      result.sort((a, b) => cheapestPrice(a) - cheapestPrice(b));
    } else result.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    return result;
  }, [stands, query, activeFilter, sortBy]);

  const handleFollow = async (targetEmail) => {
    if (!user) return;
    const existing = followMap[targetEmail];
    if (existing) {
      await base44.entities.Follow.delete(existing.id);
      setFollowMap(prev => { const m = { ...prev }; delete m[targetEmail]; return m; });
    } else {
      const rec = await base44.entities.Follow.create({
        follower_email: user.email,
        following_email: targetEmail,
        status: "accepted",
      });
      setFollowMap(prev => ({ ...prev, [targetEmail]: rec }));
    }
  };

  return (
    <div className="font-nunito max-w-lg mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-extrabold">🔍 Discover</h1>

      {/* Tabs */}
      <div className="flex gap-2">
        {[["stands", "🏪 Stands"], ["users", "👤 Users"]].map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
              tab === t ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={tab === "users" ? "Search users..." : "Search stands, items, neighborhoods..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10 rounded-full h-11"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {tab === "stands" && (
        <>
          {/* Category Chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeFilter === f.key ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground"
                }`}
              >
                {f.emoji} {f.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex gap-2">
            {SORT_OPTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSortBy(s.key)}
                className={`text-xs font-semibold px-3 py-1 rounded-full transition-all ${
                  sortBy === s.key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-4xl">🔍</span>
              <p className="mt-2 font-bold">No stands found</p>
              <p className="text-sm text-muted-foreground">Try a different search</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filtered.map(stand => <StandCard key={stand.id} stand={stand} />)}
            </div>
          )}
        </>
      )}

      {tab === "users" && (
        loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-4xl">👤</span>
            <p className="mt-2 font-bold">No users found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredUsers.map(u => (
              <div key={u.email} className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3">
                <Link to={`/user/${encodeURIComponent(u.email)}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-white shrink-0">
                    {u.name[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.standsCount} stand{u.standsCount !== 1 ? "s" : ""}</p>
                  </div>
                </Link>
                {user && u.email !== user.email && (
                  <button
                    onClick={() => handleFollow(u.email)}
                    className={`shrink-0 flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full ${
                      followMap[u.email] ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {followMap[u.email]
                      ? <><UserCheck className="h-3 w-3" /> Following</>
                      : <><UserPlus className="h-3 w-3" /> Follow</>}
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}