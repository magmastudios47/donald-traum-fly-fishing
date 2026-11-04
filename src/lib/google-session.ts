"use client";

import { useState, useEffect, useCallback } from "react";
import { GoogleUserSession } from "@/types/traum";

const GOOGLE_STORAGE_KEY = "traum_google_session_v1";
const GOOGLE_EVENT_NAME = "traum-google-session-change";

export function getSavedGoogleSession(): GoogleUserSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(GOOGLE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GoogleUserSession;
    if (parsed && parsed.email && parsed.name) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveGoogleSession(session: GoogleUserSession | null) {
  if (typeof window === "undefined") return;
  try {
    if (session) {
      localStorage.setItem(GOOGLE_STORAGE_KEY, JSON.stringify(session));
      document.cookie = `traum_google_user=${encodeURIComponent(
        session.email
      )}; path=/; max-age=2592000; SameSite=Lax`;
    } else {
      localStorage.removeItem(GOOGLE_STORAGE_KEY);
      document.cookie = "traum_google_user=; path=/; max-age=0; SameSite=Lax";
    }
    window.dispatchEvent(new CustomEvent(GOOGLE_EVENT_NAME, { detail: session }));
  } catch {
    // Ignore storage errors
  }
}

export function decodeGoogleJwtCredential(jwt: string): GoogleUserSession | null {
  try {
    const parts = jwt.split(".");
    if (parts.length !== 3) return null;
    const payloadJson = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson);
    if (!payload.email) return null;
    return {
      name: payload.name || payload.email.split("@")[0],
      email: payload.email,
      picture: payload.picture || undefined,
      sub: payload.sub || undefined,
      verifiedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function useGoogleSession() {
  const [user, setUser] = useState<GoogleUserSession | null>(null);

  useEffect(() => {
    setUser(getSavedGoogleSession());

    const handleSessionChange = () => {
      setUser(getSavedGoogleSession());
    };

    window.addEventListener(GOOGLE_EVENT_NAME, handleSessionChange);
    window.addEventListener("storage", handleSessionChange);
    return () => {
      window.removeEventListener(GOOGLE_EVENT_NAME, handleSessionChange);
      window.removeEventListener("storage", handleSessionChange);
    };
  }, []);

  const signIn = useCallback((session: GoogleUserSession) => {
    saveGoogleSession(session);
    setUser(session);
  }, []);

  const signOut = useCallback(() => {
    saveGoogleSession(null);
    setUser(null);
  }, []);

  return { user, signIn, signOut };
}
