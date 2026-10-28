import { useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Session {
  user: User | null;
}

export function useAuth(): { session: Session | null; isLoading: boolean } {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/login");
        const data = await res.json();
        setSession({ user: data.user });
      } catch {
        setSession({ user: null });
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  return { session, isLoading };
}

export async function logout() {
  try {
    const response = await fetch("/api/auth/login", { method: "DELETE" });
    if (!response.ok) {
      alert("Could not sign out. Please try again.");
      return;
    }
    window.location.href = "/login";
  } catch (error) {
    console.error("Sign out failed:", error);
    alert("Could not sign out. Please try again.");
  }
}
