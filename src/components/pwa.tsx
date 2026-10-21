"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui";

export function PwaRegister() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [offline, setOffline] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    const onInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onInstall);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then((reg) => {
        reg.addEventListener("updatefound", () => {
          const worker = reg.installing;
          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              setUpdateReady(true);
            }
          });
        });
      });
    }
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      window.removeEventListener("beforeinstallprompt", onInstall);
    };
  }, []);

  return (
    <>
      {offline ? (
        <div className="bg-warning px-3 py-2 text-center text-sm text-white">
          You are offline. Browsing cached pages still works, but orders, payments, stock and payouts require a
          connection.
        </div>
      ) : null}
      {updateReady ? (
        <div className="flex items-center justify-center gap-3 bg-navy px-3 py-2 text-sm text-white">
          A new Venzorah version is ready.
          <Button type="button" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </div>
      ) : null}
      {installEvent ? (
        <div className="flex items-center justify-center gap-3 bg-gold px-3 py-2 text-sm text-navy">
          Install Venzorah on this device for an app-like experience.
          <Button
            type="button"
            variant="navy"
            onClick={async () => {
              await installEvent.prompt();
              setInstallEvent(null);
            }}
          >
            Install
          </Button>
        </div>
      ) : null}
    </>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}
