"use client";

import { useEffect, useId, useState } from "react";
import { Button } from "./ui";

const DISMISS_KEY = "venzorah-install-dismissed";

function alreadyInstalled() {
  if (typeof window === "undefined") return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || Boolean(nav.standalone);
}

export function PwaRegister() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [offline, setOffline] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const titleId = useId();

  useEffect(() => {
    setOffline(!navigator.onLine);
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);

    const dismissed = sessionStorage.getItem(DISMISS_KEY) === "1";
    const onInstall = (e: Event) => {
      e.preventDefault();
      if (alreadyInstalled() || dismissed) return;
      setInstallEvent(e as BeforeInstallPromptEvent);
      setOpen(true);
    };
    const onInstalled = () => {
      setOpen(false);
      setInstallEvent(null);
      sessionStorage.setItem(DISMISS_KEY, "1");
    };
    window.addEventListener("beforeinstallprompt", onInstall);
    window.addEventListener("appinstalled", onInstalled);

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
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setOpen(false);
  }

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
      {open && installEvent ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-navy-deep/45" aria-label="Close" onClick={dismiss} />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-xl ring-1 ring-border"
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-dark">Venzorah app</p>
            <h2 id={titleId} className="mt-2 text-xl font-extrabold text-ink">
              Install Venzorah
            </h2>
            <p className="mt-2 text-sm text-muted">
              Add this site to your home screen for quicker shopping. Your browser has not installed it on this device
              yet.
            </p>
            <div className="mt-5 grid gap-2">
              <Button
                type="button"
                className="w-full rounded-full"
                onClick={async () => {
                  await installEvent.prompt();
                  dismiss();
                  setInstallEvent(null);
                }}
              >
                Install
              </Button>
              <Button type="button" variant="secondary" className="w-full rounded-full" onClick={dismiss}>
                Not now
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}
