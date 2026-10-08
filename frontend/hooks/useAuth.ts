"use client";

import { useState, useEffect, useCallback } from "react";
import { loginApi, logoutApi, registerApi, UserSession } from "../services/authService";

const STORAGE_KEY = "eventpulse_user_session";
const AUTH_EVENT = "eventpulse:auth-change";

function readStoredSession(): UserSession | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    if (isValidSession(parsed)) return parsed;
    localStorage.removeItem(STORAGE_KEY);
    return null;
  } catch (e) {
    console.error("Failed to load user session", e);
    return null;
  }
}

function broadcastAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_EVENT));
  }
}

function isValidSession(value: unknown): value is UserSession {
  if (!value || typeof value !== "object") return false;
  const s = value as Record<string, unknown>;
  return (
    typeof s.token === "string" &&
    s.token.length > 0 &&
    typeof s.email === "string" &&
    (s.role === "CUSTOMER" || s.role === "VENDOR" || s.role === "ADMIN")
  );
}

export function useAuth() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session from localStorage on mount and stay in sync with
  // other hook instances / tabs (storage event + in-tab broadcast).
  useEffect(() => {
    setUser(readStoredSession());
    setIsLoading(false);
    const resync = () => {
      setUser(readStoredSession());
    };
    window.addEventListener("storage", resync);
    window.addEventListener(AUTH_EVENT, resync);
    return () => {
      window.removeEventListener("storage", resync);
      window.removeEventListener(AUTH_EVENT, resync);
    };
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    const session = await loginApi(email, pass);
    setUser(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return session;
  }, []);

  const register = useCallback(async (payload: any) => {
    const session = await registerApi(payload);
    setUser(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return session;
  }, []);

  const logout = useCallback((redirectTo?: string) => {
    const token = user?.token;
    if (token) {
      void logoutApi(token);
    }
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage unavailable — in-memory session is still cleared above.
    }
    broadcastAuthChange();
    if (redirectTo && typeof window !== "undefined") {
      // Hard navigation: destroys all in-memory React state (including any
      // stale router-cached session views) and forces a fresh session read.
      window.location.assign(redirectTo);
    }
  }, [user?.token]);

  return {
    user,
    token: user?.token || "",
    isAuthenticated: !!user,
    isVendor: user?.role === "VENDOR",
    isCustomer: user?.role === "CUSTOMER",
    isLoading,
    login,
    register,
    logout,
  };
}
