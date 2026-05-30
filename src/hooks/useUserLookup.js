import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

// Module-level cache so we don't refetch on every component mount
let cachedMap = null;
let cacheTime = 0;
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

export function useUserLookup() {
  const [userMap, setUserMap] = useState(cachedMap || {});

  useEffect(() => {
    const now = Date.now();
    if (cachedMap && now - cacheTime < CACHE_TTL) {
      setUserMap(cachedMap);
      return;
    }
    base44.entities.User.list("-created_date", 500).then(users => {
      const map = {};
      users.forEach(u => {
        map[u.email] = u.display_name || u.full_name || "Lemonade Fan";
      });
      cachedMap = map;
      cacheTime = Date.now();
      setUserMap(map);
    });
  }, []);

  return userMap;
}

export function getUserName(userMap, email, fallback) {
  return userMap[email] || fallback || "Lemonade Fan";
}