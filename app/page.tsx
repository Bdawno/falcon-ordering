"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user has session
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/login");
        const data = await res.json();

        if (data.user) {
          router.push("/orders");
        } else {
          router.push("/login");
        }
      } catch (error) {
        router.push("/login");
      }
    };

    checkSession();
  }, [router]);

  return <div>Redirecting...</div>;
}
