"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface TestCredentials {
  admin: { email: string; password: string };
  employee: { email: string; password: string };
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [testCredentials, setTestCredentials] = useState<TestCredentials | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const timeout = window.setTimeout(() => {
      void fetch("/api/auth/test-credentials")
        .then(async (response) => {
          if (!response.ok) return null;
          return (await response.json()) as TestCredentials;
        })
        .then((credentials) => {
          if (credentials) setTestCredentials(credentials);
        })
        .catch((fetchError: unknown) => {
          console.error("Unable to load development test credentials:", fetchError);
        });
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Login failed");
      } else {
        router.push("/orders");
      }
    } catch {
      setError("An error occurred during sign in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <Link href="/" aria-label="Go to home">
            <img src="/falcon-logo.png" alt="Falcon Northwest" className="h-16 w-auto mx-auto mb-4" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Falcon Northwest</h1>
          <p className="mt-2 text-gray-600">Food Order Management</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              placeholder="you@company.com"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                style={{ paddingRight: '2.5rem' }}
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
                disabled={isLoading}
              >
                {showPassword ? (
                  <svg className="" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: '1.125rem', height: '1.125rem' }}>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg className="" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: '1.125rem', height: '1.125rem' }}>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                    <line x1="4" y1="4" x2="20" y2="20" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {testCredentials && (
          <section className="mt-6 border-t border-gray-200 pt-6" aria-label="Test login information">
            <p className="text-center text-sm font-medium text-gray-700">
              Development test accounts
            </p>
            <div className="mt-3 space-y-3 rounded-md bg-gray-50 p-3 text-sm">
              <div>
                <p className="font-semibold text-gray-700">Admin</p>
                <p className="text-gray-600">Email: {testCredentials.admin.email}</p>
                <p className="text-gray-600">Password: {testCredentials.admin.password}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Employee</p>
                <p className="text-gray-600">Email: {testCredentials.employee.email}</p>
                <p className="text-gray-600">Password: {testCredentials.employee.password}</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
