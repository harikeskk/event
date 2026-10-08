const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export interface UserSession {
  userId: string;
  email: string;
  fullName: string;
  role: "CUSTOMER" | "VENDOR" | "ADMIN";
  token: string;
  vendorId?: string | null;
}

export async function loginApi(email: string, password: string): Promise<UserSession> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Invalid email or password");
  }
  return data.data;
}

export async function registerApi(payload: any): Promise<UserSession> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Registration failed");
  }
  return data.data;
}

export async function getMeApi(token: string): Promise<UserSession> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Session expired");
  }
  return { ...data.data, token };
}

export async function logoutApi(token: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    // Stateless logout is best-effort; client state is cleared regardless.
  }
}
