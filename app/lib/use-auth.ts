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
      } catch (error) {
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
  // Clear session by calling a logout endpoint or just removing the cookie client-side
  document.cookie = "session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
  window.location.href = "/login";
}
