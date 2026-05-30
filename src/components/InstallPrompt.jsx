import { useState, useEffect } from "react";
import { X, Share, PlusSquare } from "lucide-react";

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("install_dismissed");
    if (dismissed) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;

    if (standalone) return; // Already installed

    if (ios) {
      setIsIos(true);
      setShow(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem("install_dismissed", "1");
    setShow(false);
  };

  const install = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setShow(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[2000] bg-card border border-border rounded-2xl shadow-xl p-4 font-nunito">
      <button onClick={dismiss} className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted">
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="flex items-start gap-3">
        <span className="text-3xl">🍋</span>
        <div>
          <p className="font-bold text-sm">Add to Home Screen</p>
          {isIos ? (
            <p className="text-xs text-muted-foreground mt-1">
              Tap <Share className="inline h-3.5 w-3.5 mx-0.5" /> then{" "}
              <strong>"Add to Home Screen"</strong>{" "}
              <PlusSquare className="inline h-3.5 w-3.5 mx-0.5" /> to install this app.
            </p>
          ) : (
            <div>
              <p className="text-xs text-muted-foreground mt-1">
                Install Find My Lemonade for quick access anytime!
              </p>
              <button
                onClick={install}
                className="mt-2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full"
              >
                Install App
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}