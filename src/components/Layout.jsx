import { Outlet, Link, useLocation } from "react-router-dom";
import { Search, PlusCircle, User, Home, Map, Trophy } from "lucide-react";

const navItems = [
  { path: "/home", icon: Home, label: "Home" },
  { path: "/", icon: Map, label: "Map" },
  { path: "/leaderboard", icon: Trophy, label: "Ranks" },
  { path: "/search", icon: Search, label: "Search" },
  { path: "/add-stand", icon: PlusCircle, label: "Add" },
  { path: "/profile", icon: User, label: "Profile" },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="font-nunito min-h-screen bg-background flex flex-col">
      <main className="flex-1 pb-20">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-bottom">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-4">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            const isAdd = path === "/add-stand";
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center gap-0.5 transition-all ${
                  isAdd
                    ? "relative -top-3"
                    : ""
                }`}
              >
                {isAdd ? (
                  <div className="bg-primary rounded-full p-3 shadow-lg shadow-primary/30">
                    <Icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                ) : (
                  <Icon
                    className={`h-5 w-5 transition-colors ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                )}
                <span
                  className={`text-[10px] font-semibold ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  } ${isAdd ? "mt-1" : ""}`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}