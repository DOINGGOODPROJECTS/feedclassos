"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  clearAuthTokens,
  getAccessToken,
  getAccessTokenExpiryMs,
  getLastActivityAt,
  touchSessionActivity,
} from "@/lib/backendApi";

const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;
const CHECK_INTERVAL_MS = 15 * 1000;

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hasLoggedOutRef = useRef(false);

  useEffect(() => {
    const logout = () => {
      if (hasLoggedOutRef.current) {
        return;
      }

      hasLoggedOutRef.current = true;
      clearAuthTokens();
      window.localStorage.removeItem("fc_role");
      document.cookie = "fc_role=; path=/; max-age=0";
      router.replace("/login");
    };

    const recordActivity = () => {
      if (!getAccessToken()) {
        return;
      }
      touchSessionActivity();
    };

    const checkSession = () => {
      const token = getAccessToken();
      if (!token) {
        logout();
        return;
      }

      const expiryMs = getAccessTokenExpiryMs();
      if (expiryMs && Date.now() >= expiryMs) {
        logout();
        return;
      }

      const lastActivityAt = getLastActivityAt();
      if (lastActivityAt && Date.now() - lastActivityAt >= INACTIVITY_LIMIT_MS) {
        logout();
      }
    };

    const events: Array<keyof WindowEventMap> = ["click", "keydown", "mousemove", "scroll", "touchstart"];

    recordActivity();
    checkSession();
    events.forEach((eventName) => window.addEventListener(eventName, recordActivity, { passive: true }));
    document.addEventListener("visibilitychange", checkSession);
    const intervalId = window.setInterval(checkSession, CHECK_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      events.forEach((eventName) => window.removeEventListener(eventName, recordActivity));
      document.removeEventListener("visibilitychange", checkSession);
    };
  }, [router]);

  return <>{children}</>;
}
