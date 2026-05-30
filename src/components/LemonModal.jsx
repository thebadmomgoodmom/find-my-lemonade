import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { useUserLookup, getUserName } from "../hooks/useUserLookup";

export default function LemonModal({ lemonUsers = [], onClose }) {
  const userMap = useUserLookup();

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[490]" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 max-h-[60vh] bg-card border-t border-border rounded-t-2xl shadow-xl z-[500] font-nunito flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <h3 className="font-bold text-sm">🍋 People who gave a lemon</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-muted">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {lemonUsers.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No lemons yet</p>
          ) : (
            <div className="divide-y divide-border">
              {lemonUsers.map(email => {
                const name = getUserName(userMap, email, email);
                return (
                  <Link
                    key={email}
                    to={`/user/${encodeURIComponent(email)}`}
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-extrabold text-white shrink-0">
                      {name[0].toUpperCase()}
                    </div>
                    <p className="font-semibold text-sm">{name}</p>
                    <span className="ml-auto text-base">🍋</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}