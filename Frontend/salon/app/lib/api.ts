import { useSyncExternalStore } from "react";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function api<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      data.message || data.detail || "Something went wrong. Please try again.",
    );
  }
  return data;
}

export type Service = {
  id: number;
  name: string;
  description: string;
  price: string;
  duration_minutes: number;
  is_available: boolean;
};

export type Appointment = {
  id: number;
  customer: number | null;
  customer_name: string;
  customer_email: string;
  service_name: string;
  appointment_datetime: string;
  status: string;
  status_display: string;
};

export type User = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  is_staff?: boolean;
};

export function getSession() {
  if (typeof window === "undefined")
    return { token: "", user: null as User | null };
  const savedUser = localStorage.getItem("salon_user");
  return {
    token: localStorage.getItem("salon_access") || "",
    user: savedUser ? (JSON.parse(savedUser) as User) : null,
  };
}

const emptySessionSnapshot = JSON.stringify({ token: "", user: null });

function sessionSnapshot() {
  if (typeof window === "undefined") return emptySessionSnapshot;
  return JSON.stringify({
    token: localStorage.getItem("salon_access") || "",
    user: localStorage.getItem("salon_user") || null,
  });
}

function subscribeToSession() {
  return () => {};
}

export function useSession() {
  const snapshot = useSyncExternalStore(
    subscribeToSession,
    sessionSnapshot,
    () => emptySessionSnapshot,
  );
  const parsed = JSON.parse(snapshot) as { token: string; user: string | null };
  return {
    token: parsed.token,
    user: parsed.user ? (JSON.parse(parsed.user) as User) : null,
  };
}
