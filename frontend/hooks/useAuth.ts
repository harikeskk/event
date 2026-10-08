"use client";

import { useState, useEffect, useCallback } from "react";
import { loginApi, logoutApi, registerApi, UserSession } from "../services/authService";

const STORAGE_KEY = "eventpulse_user_session";

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

  // Load session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (isValidSession(parsed)) {
          setUser(parsed);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {
      console.error("Failed to load user session", e);
    } finally {
      setIsLoading(false);
    }
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

  const logout = useCallback(() => {
    const token = user?.token;
    if (token) {
      void logoutApi(token);
    }
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
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
